import { ethers } from "ethers";

import { PROVIDER, API3_PRICE_FEED } from "../common/constants";

import api3PriceFeed from "./abi/API3PriceFeed.json";

const api3PriceFeedContract = new ethers.Contract(API3_PRICE_FEED, api3PriceFeed, PROVIDER);

export const fetchPrice = async (key: string): Promise<string> => {
  const encodedDapiName = ethers.utils.formatBytes32String(key);
  const res = await api3PriceFeedContract.getPrice(encodedDapiName);
  return res.toString();
};
