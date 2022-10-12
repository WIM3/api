import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, POSITION_SUBGRAPH } from "../common/constants";
import { Amm } from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";
import { getDataFeedId, fetchPrice } from "../blockchain/client";

let amms: Amm[] = [];

const getAmmsFromSubgraph = async (): Promise<Amm[]> => {
  let amms: Amm[] = [];
  let last = "";

  while (true) {
    const res = (
      await axios.post(
        POSITION_SUBGRAPH,
        {
          query: `query GetAmms {
              amms (first: ${SUBGRAPH_LIMIT}, where: { id_gt: "${last}" }) {
                id
                quoteAsset
                priceFeedKey
                fundingPeriod
                fundingBufferPeriod
                lastFunding
                fundingRate
                tradeLimitRatio
                tradingVolume
                underlyingPrice
              }
            }`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
    ).data;
    if (res.errors) throw res.errors[0].message;

    const tmp: Amm[] = res.data.amms;
    amms = amms.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return amms;
};

export const getAmm = (address: string): Amm | undefined => {
  return amms.find((amm) => {
    return amm.id === address.toLowerCase();
  });
};

export const run = async () => {
  // TODO: we need to double-check if it is enough to query it once
  const dataFeeds: { [id: string]: string } = {};

  while (true) {
    const feedKeys = [];
    const feedCalls = [];
    const priceCalls = [];
    const newAmms = await getAmmsFromSubgraph().catch((e) => {
      logger.error(e);
    });
    if (newAmms) amms = newAmms;

    // fetching all the necessary data from api3 feed
    for (const amm of amms) {
      if (!dataFeeds[amm.priceFeedKey]) {
        feedKeys.push(amm.priceFeedKey);
        feedCalls.push(getDataFeedId(amm.priceFeedKey));
      }
      priceCalls.push(fetchPrice(amm.priceFeedKey));
    }
    const res = await Promise.all(priceCalls.concat(feedCalls)).catch((e) => {
      logger.error(e);
    });

    // storing fetched api3 data in amms and calculating next funding
    if (res) {
      for (let i = amms.length; i < res.length; i++) {
        dataFeeds[feedKeys[i - amms.length]] = res[i];
      }
      for (let i = 0; i < amms.length; i++) {
        amms[i].price = res[i] ? +res[i] : undefined;
        amms[i].dataFeedId = dataFeeds[amms[i].priceFeedKey];
        amms[i].nextFunding = amms[i].lastFunding + amms[i].fundingPeriod;
      }
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
