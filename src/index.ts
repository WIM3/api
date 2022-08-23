import { Server, Socket } from "socket.io";
import * as dynamoose from "dynamoose";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG, RELOAD_RATE, STOP } from "./common/constants";
import { Amm, Position } from "./common/types";
import { sleep } from "./common/utils";

import { getPositions } from "./model/positions";
import { getMarketsFromJson as fetchMarkets, getMarkets } from "./services/fetchMarkets";
import { run as runAmms, getAmm } from "./services/fetchAmms";
import { run as runPositions } from "./services/fetchPositions";

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
  runPositions(await getPositionsFromDb());
};

const getPositionsFromDb = async (): Promise<Map<string, Position>> => {
  const positionsFromDb = await getPositions().catch((e) => {
    logger.error(e);
  });

  if (positionsFromDb) {
    return new Map(
      positionsFromDb.map((object) => {
        return [object.key, object.position];
      })
    );
  } else return new Map<string, Position>();
};

const getAmmInfo = async (amm: string): Promise<Amm> => {
  const ammInfo = getAmm(amm);
  if (!ammInfo) throw `Amm ${amm} not found`;
  return ammInfo;
};

// TODO: needs to be investigated if this is the best way to handle communication
const addListener = (
  socket: Socket,
  channel: string,
  getResponse: (arg: string) => Promise<any>
) => {
  socket.on(channel, async (arg) => {
    let active = arg !== STOP;
    let prev;

    // stopping live feed
    socket.on("disconnect", () => {
      active = false;
    });
    socket.on(channel, () => {
      active = false;
    });

    while (active) {
      const current = await getResponse(arg).catch((e) => {
        logger.error(e);
        socket.emit(channel, e);
      });
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

  addListener(socket, "amm_info", getAmmInfo);
});

run();
io.listen(PORT);
logger.info(`Listening on port ${PORT}`);
