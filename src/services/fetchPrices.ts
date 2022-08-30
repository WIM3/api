import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, PRICE_SUBGRAPH } from "../common/constants";
import { DbPriceFeed, SubPriceFeed, PriceUpdate } from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";
import { savePriceFeed } from "../model/prices";

let priceFeeds = new Map<string, Omit<DbPriceFeed, "key">>();

const getPriceFeedsFromSubgraph = async (): Promise<SubPriceFeed[]> => {
  let subPriceFeeds: SubPriceFeed[] = [];
  let last = "";

  // TODO: we might need to limit updates as there are way too many already
  while (true) {
    const res = (
      await axios.post(
        PRICE_SUBGRAPH,
        {
          query: `query GetPriceFeeds {
              priceFeeds (first: ${SUBGRAPH_LIMIT}, where: { id_gt: "${last}" }) {
                id
                timestamp
                price
                updates (first: ${SUBGRAPH_LIMIT}, orderBy: timestamp) {
                  timestamp
                  price
                }
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

    const tmp: SubPriceFeed[] = res.data.priceFeeds;
    subPriceFeeds = subPriceFeeds.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return subPriceFeeds;
};

const getNewUpdates = (priceUpdates: PriceUpdate[], timestamp: number): PriceUpdate[] => {
  const updates: PriceUpdate[] = [];

  // filtering out only those that are new
  for (const priceUpdate of priceUpdates) {
    if (priceUpdate.timestamp > timestamp) {
      updates.push(priceUpdate);
    }
  }

  return updates;
};

export const getPrices = (): Map<string, Omit<DbPriceFeed, "key">> => {
  return priceFeeds;
};

export const run = async (priceFeedsFromDb: Map<string, Omit<DbPriceFeed, "key">>) => {
  // initializing prices from DB so that it does not need to start over
  priceFeeds = priceFeedsFromDb;

  while (true) {
    const subPriceFeeds = await getPriceFeedsFromSubgraph().catch((e) => {
      logger.error(e);
    });

    if (subPriceFeeds) {
      for (const subPriceFeed of subPriceFeeds) {
        // checking if it already exists in memory
        const old = priceFeeds.get(subPriceFeed.id);
        const history = old ? old.history : [];
        const { id, updates, ...newPriceFeed } = subPriceFeed;

        // if they are exactly the same based on their timestamp, we can skip
        const latest = old ? old.history[old.history.length - 1].timestamp : 0;
        if (old && newPriceFeed.timestamp === latest) continue;

        // processing of price feed related updates
        const priceUpdates = getNewUpdates(subPriceFeed.updates, latest);
        for (const priceUpdate of priceUpdates) {
          history.push(priceUpdate);
        }

        priceFeeds.set(subPriceFeed.id, { history });
        savePriceFeed({ key: subPriceFeed.id, history }).catch((e) => {
          logger.error(e);
        });
      }
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
