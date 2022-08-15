import { Schema, model } from "dynamoose";

import { EVM } from "../common/constants";
import { DefaultModelResponse } from "../common/types";

const DefaultSchema = new Schema({
  id: String,
  value: String,
});

const record = model(`infinix-${EVM}-tmp`, DefaultSchema, {
  throughput: "ON_DEMAND",
});

export const getTmp = async (id: string): Promise<DefaultModelResponse> => {
  return (await record.query("id").eq(id).exec())?.toJSON()[0];
};

export const saveTmp = async (tmp: DefaultModelResponse) => {
  return await new record(tmp).save();
};
