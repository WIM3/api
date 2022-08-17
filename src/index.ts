import { Server, Socket } from "socket.io";
import * as dynamoose from "dynamoose";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG, RELOAD_RATE, STOP } from "./common/constants";
import { sleep } from "./common/utils";

import { getMarketsFromJson as fetchMarkets, getMarkets } from "./services/fetchMarkets";
import { run as runAmms, getAmm } from "./services/fetchAmms";

/* Initial setup */

// setting up dynamo db instance
const ddb = new dynamoose.aws.sdk.DynamoDB(
  EVM === "local" ? AWS_CONFIG : { region: AWS_CONFIG.region }
);
dynamoose.aws.ddb.set(ddb);

// setting up socket io server
const io = new Server({ cors: { origin: "*" } });

/* Helper functions */

// TODO: needs to be adjusted and extended
const getMarketInfo = (amm: string): string => {
  const priceKey = getAmm(amm)?.priceFeedKey;
  return priceKey || "";
};

// TODO: needs to be investigated if this is the best way to handle communication
const addListener = (socket: Socket, channel: string, getResponse: (arg: string) => any) => {
  socket.on(channel, async (arg) => {
    let active = arg !== STOP;
    let prev;

    socket.on(channel, () => {
      active = false;
    });

    while (active) {
      const current = getResponse(arg);
      if (current !== prev) {
        socket.emit(channel, current);
        prev = current;
      }
      await sleep(RELOAD_RATE);
    }
  });
};

/* Application core */

io.on("connection", (socket) => {
  socket.emit("markets", getMarkets());

  addListener(socket, "market_info", getMarketInfo);
});

fetchMarkets();
runAmms();
io.listen(PORT);
logger.info(`Listening on port ${PORT}`);
