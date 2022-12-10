import { Schema, model } from "dynamoose";

import { EVM } from "../common/constants";
import { DbPriceFeed } from "../common/types";

const PriceUpdateSchema = new Schema({
  timestamp: Number,
  price: String,
});
const PriceFeedSchema = new Schema({
  key: String,
  history: {
    type: Array,
    schema: [PriceUpdateSchema],
  },
});

const record = model(`infinix-${EVM}-prices`, PriceFeedSchema, {
  throughput: "ON_DEMAND",
});

export const getPriceFeeds = async (): Promise<DbPriceFeed[]> => {
  return <DbPriceFeed[]>(await record.scan().exec())?.toJSON();
};

export const getPriceFeed = async (key: string): Promise<DbPriceFeed> => {
  return (await record.query("key").eq(key).exec())?.toJSON()[0];
};

export const savePriceFeed = async (feed: DbPriceFeed) => {
  return await new record(feed).save();
};
