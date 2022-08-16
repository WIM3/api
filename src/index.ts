import { Server } from "socket.io";
import * as dynamoose from "dynamoose";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG } from "./common/constants";
// import { sleep } from "common/utils";
import { getMarkets } from "./services/fetchMarkets";

/* Initial setup */

// setting up dynamo db instance
const ddb = new dynamoose.aws.sdk.DynamoDB(
  EVM === "local" ? AWS_CONFIG : { region: AWS_CONFIG.region }
);
dynamoose.aws.ddb.set(ddb);

// setting up socket io server
const io = new Server({ cors: { origin: "*" } });

/* Application core */

io.on("connection", (socket) => {
  socket.emit("markets", getMarkets());

  // TODO: needs to be investigated how to handle closing active listenings
  /* socket.on("user-positions", async (arg) => {
    let active = true;
    while (active) {
      socket.on("user-positions", (_arg) => {
        active = false;
      })
      socket.emit('user-positions', getUserPositions());
      await sleep(3000);
    }
  })*/
});

io.listen(PORT);
logger.info(`Listening on port ${PORT}`);
