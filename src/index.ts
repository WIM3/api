import express, { Request, Response } from "express";
import * as dynamoose from "dynamoose";
import cors from "cors";

import { logger } from "./common/logger";
import { EVM, PORT, AWS_CONFIG } from "./common/constants";
import { getMarkets } from "./services/fetchMarkets";

/* Initial setup */

// setting up dynamo db instance
const ddb = new dynamoose.aws.sdk.DynamoDB(
  EVM === "local" ? AWS_CONFIG : { region: AWS_CONFIG.region }
);
dynamoose.aws.ddb.set(ddb);

// setting up express
const app = express();

/* Application core */

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/markets/all", async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.json(getMarkets());
  res.status(200);
});

app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
