import * as dotenv from "dotenv";

dotenv.config();

export const EVM = process.env.ENVIRONMENT;
export const PORT = process.env.PORT ? +process.env.PORT : 3601;
export const AWS_CONFIG = {
  region: process.env.REGION || "eu-central-1",
  accessKeyId: process.env.ACCESS_KEY_ID || "",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
};
