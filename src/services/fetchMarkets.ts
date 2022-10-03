import axios from "axios";

import { EVM } from "../common/constants";
import { Markets } from "../common/types";
import { logger } from "../common/logger";

// TODO: remove after testing
// based on this - https://github.com/bbenligiray/data-feed-reader-example/tree/avalanche-testnet#dapi-names
const mockData = {
  contracts: {
    Markets: {
      Crypto: {
        BTCUSDC: "0x6b91c20cb2F01843E07F337085e7f6cB71DD103f",
        SOLUSDC: "0x883bB1ABF2B9011456e797CE1aa9384B4177F4A6",
        AVAXUSDC: "0x2e49aCCF96Fa08090aE1eEa3DA246803bd95aEC9",
      },
      SPPlatts: {
        BATCH04: "0x1a35B421551ec1437FC72ba69281376f95B5a3C4",
        BATCP04: "0x100AFFBc0E5A71a9b0F9A093442C369eB5525913",
        CNCAD00: "0x56c5fcCF5e6389965892F6d76D9445aF130b4ce0",
        ACRCA00: "0x3AbCE047D741cBbB5a0A6933449A0966d5888986",
      },
      SPIndices: {
        SPBTC: "0x9a5186e2797f59F7144Cd288789CacC5903217c4",
        SPETH: "0x3EDa393D828278A34c8f5Bf9da5d712dFb275DA5",
      },
    },
  },
};

// TODO: only for testing purposes, replace later
const contractUrl =
  EVM === "prod"
    ? "TBD"
    : "https://raw.githubusercontent.com/perpetual-protocol/perpetual-protocol/master/metadata/production.json";

let markets: Markets;

export const getMarketsFromJson = async () => {
  const res = await axios.get(contractUrl).catch((e) => {
    logger.error(e);
  });
  markets = res?.data?.contracts?.Markets || mockData.contracts.Markets;
};

export const getMarkets = (): Markets => {
  return markets;
};
