import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

export const EVM = process.env.ENVIRONMENT || "local";
export const PORT = process.env.PORT ? +process.env.PORT : 3601;
export const AWS_CONFIG = {
  region: process.env.REGION || "eu-central-1",
  accessKeyId: process.env.ACCESS_KEY_ID || "",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
};
export const RELOAD_RATE = process.env.RELOAD_RATE ? +process.env.RELOAD_RATE : 36000;

export const enum STATUS {
  Open = "Opening",
  Close = "Closing",
  Chng = "Changing",
  Mgn = "Margin Changing",
  Liq = "Liquidating",
  None = "Invalid",
}
export const STOP = "STOP";
export const SUBGRAPH_LIMIT = 1000;
export const SUBGRAPH_FREQUENCY = 36000;
export const MAX_POSITIONS = 15;

export const PROVIDER =
  EVM === "prod"
    ? new ethers.providers.StaticJsonRpcProvider(
        `https://avalanche-mainnet.infura.io/v3/${process.env.PROVIDER_KEY}`
      )
    : new ethers.providers.StaticJsonRpcProvider(
        `https://avalanche-fuji.infura.io/v3/${process.env.PROVIDER_KEY}`
      );
export const PRICE_SUBGRAPH =
  EVM === "prod"
    ? "TODO"
    : "https://api.thegraph.com/subgraphs/name/infinix-finance/dev-fuji-prices";
export const POSITION_SUBGRAPH =
  EVM === "prod"
    ? "TODO"
    : "https://api.thegraph.com/subgraphs/name/infinix-finance/dev-fuji-positions";
export const API3_PRICE_FEED =
  EVM === "prod" ? "TODO" : "0xdC91ea613247C0C9438A6F64Cc0E08291198981a";
