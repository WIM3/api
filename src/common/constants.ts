import * as dotenv from "dotenv";

dotenv.config();

export const EVM = process.env.ENVIRONMENT;
export const PORT = process.env.PORT ? +process.env.PORT : 3601;
export const AWS_CONFIG = {
  region: process.env.REGION || "eu-central-1",
  accessKeyId: process.env.ACCESS_KEY_ID || "",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
};
export const RELOAD_RATE = process.env.RELOAD_RATE ? +process.env.RELOAD_RATE : 3600;

export const STOP = "STOP";
export const SUBGRAPH_LIMIT = 1000;
export const SUBGRAPH_FREQUENCY = 3600;
export const SUBGRAPH_URL =
  EVM === "prod"
    ? "TODO"
    : "https://api.thegraph.com/subgraphs/name/infinix-finance/dev-fuji-positions";
