import { Server } from "socket.io";
import * as dynamoose from "dynamoose";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG } from "./common/constants";
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
});

io.listen(PORT);
logger.info(`Listening on port ${PORT}`);
