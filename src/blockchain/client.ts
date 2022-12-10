import { ethers } from "ethers";

import { PROVIDER, API3_PRICE_FEED } from "../common/constants";

import api3DapiServer from "./abi/DapiServer.json";

const api3DapiServerContract = new ethers.Contract(API3_PRICE_FEED, api3DapiServer, PROVIDER);

export const getDataFeedId = async (key: string): Promise<string> => {
  const encodedDapiName = ethers.utils.formatBytes32String(key);
  return await api3DapiServerContract.dapiNameToDataFeedId(encodedDapiName);
};

export const fetchPrice = async (key: string): Promise<string> => {
  const encodedDapiName = ethers.utils.formatBytes32String(key);
  const res = await api3DapiServerContract.readDataFeedValueWithDapiName(encodedDapiName);
  return ethers.utils.formatEther(res);
};
