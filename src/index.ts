import { Server, Socket } from "socket.io";
import * as dynamoose from "dynamoose";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG, RELOAD_RATE, STOP } from "./common/constants";
import { Amm, DbPriceFeed, DbPosition, HistoryEvent } from "./common/types";
import { sleep } from "./common/utils";

import { getPriceFeeds } from "./model/prices";
import { getPositions } from "./model/positions";
import { getMarketsFromJson as fetchMarkets, getMarkets } from "./services/fetchMarkets";
import { run as runAmms, getAmm } from "./services/fetchAmms";
import { run as runPrices, getSpecificPriceFeed } from "./services/fetchPrices";
import {
  run as runPositions,
  getPositionsByUser,
  getRecentlyOpenedPositionsByAmm,
} from "./services/fetchPositions";

/* Initial setup */

// setting up dynamo db instance
const ddb = new dynamoose.aws.sdk.DynamoDB(
  EVM === "local" ? AWS_CONFIG : { region: AWS_CONFIG.region }
);
dynamoose.aws.ddb.set(ddb);

// setting up socket io server
const io = new Server({ cors: { origin: "*" } });

/* Helper functions */

const run = async () => {
  fetchMarkets();
  runAmms();
  runPrices(await getPriceFeedsFromDb());
  runPositions(await getPositionsFromDb());
};

const getPriceFeedsFromDb = async (): Promise<Map<string, Omit<DbPriceFeed, "key">>> => {
  const priceFeedsFromDb = await getPriceFeeds().catch((e) => {
    logger.error(e);
  });

  if (priceFeedsFromDb) {
    return new Map(
      priceFeedsFromDb.map((object) => {
        return [object.key, { history: object.history }];
      })
    );
  } else return new Map<string, Omit<DbPriceFeed, "key">>();
};

const getPositionsFromDb = async (): Promise<Map<string, Omit<DbPosition, "key">>> => {
  const positionsFromDb = await getPositions().catch((e) => {
    logger.error(e);
  });

  if (positionsFromDb) {
    return new Map(
      positionsFromDb.map((object) => {
        return [object.key, { position: object.position, history: object.history }];
      })
    );
  } else return new Map<string, Omit<DbPosition, "key">>();
};

const getAmmInfo = async (amm: string): Promise<Amm> => {
  const ammInfo = getAmm(amm);
  if (!ammInfo) throw `Amm ${amm} not found`;
  return ammInfo;
};

const getPairPriceHistory = async (feedKey: string): Promise<Omit<DbPriceFeed, "key">> => {
  const priceFeed = getSpecificPriceFeed(feedKey.toLowerCase());
  if (!priceFeed) throw `No price feed for ${feedKey} found`;
  return priceFeed;
};

const getUserPositions = async (user: string): Promise<Omit<DbPosition, "key">[]> => {
  return getPositionsByUser(user.toLowerCase());
};

const getAmmPositions = async (amm: string): Promise<HistoryEvent[]> => {
  return getRecentlyOpenedPositionsByAmm(amm.toLowerCase());
};

const addListener = (
  socket: Socket,
  channel: string,
  getResponse: (arg: string) => Promise<any>
) => {
  const listener = async (arg: string) => {
    if (arg === STOP) return;

    let active = true;
    let prev;

    // stopping live feed in case of new request or disconnect
    const stop = () => {
      logger.debug(`client stopped communication - ${channel}`);
      active = false;
      socket.off(channel, stop);
      socket.off("disconnect", stop);
    };
    socket.on(channel, stop);
    socket.on("disconnect", stop);

    logger.debug(`client started communication - ${channel}`);
    while (active) {
      const current = await getResponse(arg).catch((e) => {
        logger.error(e);
        socket.emit(channel, e);
      });
      if (!active) return;

      // TODO: in most cases this will work, but sometimes it sends it anyway
      if (current != prev) {
        socket.emit(channel, current);
        prev = current;
      } else if (current) {
        logger.debug("no change, no need to emit");
      }
      await sleep(RELOAD_RATE);
    }
  };

  socket.on(channel, listener);
};

/* Application core */

io.on("connection", (socket) => {
  logger.debug("client connected");
  socket.emit("markets", getMarkets());

  addListener(socket, "amm_info", getAmmInfo);
  addListener(socket, "pair_prices", getPairPriceHistory);
  addListener(socket, "user_positions", getUserPositions);
  addListener(socket, "amm_positions", getAmmPositions);
});

run();
io.listen(PORT);
logger.info(`Listening on port ${PORT}`);
