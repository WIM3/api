import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, SUBGRAPH_URL } from "../common/constants";
import { Amm } from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";
import { fetchPrice } from "../blockchain/client";

let amms: Amm[] = [];

const getAmmsFromSubgraph = async (): Promise<Amm[]> => {
  let amms: Amm[] = [];
  let last = "";

  while (true) {
    const res = (
      await axios.post(
        SUBGRAPH_URL,
        {
          query: `query GetAmms {
              amms (first: ${SUBGRAPH_LIMIT}, where: { id_gt: "${last}" }) {
                id
                priceFeedKey
                fundingPeriod
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
  while (true) {
    const priceCalls = [];
    const newAmms = await getAmmsFromSubgraph().catch((e) => {
      logger.error(e);
    });
    if (newAmms) amms = newAmms;

    for (const amm of amms) {
      priceCalls.push(fetchPrice(amm.priceFeedKey));
    }
    const res = await Promise.all(priceCalls).catch((e) => {
      logger.error(e);
    });
    for (let i = 0; i < amms.length; i++) {
      amms[i].price = res && res[i] ? +res[i] : 0;
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
