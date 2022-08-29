import { Schema, model } from "dynamoose";

import { EVM } from "../common/constants";
import { DbPosition } from "../common/types";

const PositionSchema = new Schema({
  key: String,
  position: {
    type: Object,
    schema: {
      timestamp: Number,
      trader: String,
      amm: String,
      active: Boolean,
      margin: String,
      openNotional: String,
      size: String,
      tradingVolume: String,
      leverage: String,
      entryPrice: String,
      fee: String,
      realizedPnl: String,
      unrealizedPnl: String,
      badDebt: String,
      liquidationPenalty: String,
      fundingPayment: String,
      totalPnlAmount: String,
    },
  },
  history: {
    type: Array,
    schema: [
      {
        type: Object,
        schema: {
          timestamp: Number,
          type: String,
          trader: String,
          amm: String,
          margin: String,
          size: String,
          fee: String,
          realizedPnl: String,
          unrealizedPnlAfter: String,
          amount: String,
          fundingPayment: String,
          notification: Boolean,
        },
      },
    ],
  },
});

const record = model(`infinix-${EVM}-positions`, PositionSchema, {
  throughput: "ON_DEMAND",
});

export const getPositions = async (): Promise<DbPosition[]> => {
  return <DbPosition[]>(await record.scan().exec())?.toJSON();
};

export const getPosition = async (key: string): Promise<DbPosition> => {
  return (await record.query("key").eq(key).exec())?.toJSON()[0];
};

export const savePosition = async (position: DbPosition) => {
  return await new record(position).save();
};
