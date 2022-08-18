import axios from "axios";

import { EVM } from "../common/constants";
import { Markets } from "../common/types";
import { logger } from "../common/logger";

// TODO: remove after testing
// based on this - https://github.com/bbenligiray/data-feed-reader-example/tree/avalanche-testnet#dapi-names
const mockData = {
  contracts: {
    InsuranceFund: "0x8C29F6F7fc1999aB84b476952E986F974Acb3824",
    L2PriceFeed: "0xb0C0387bC0eBe8C8A6Cc7f089B12aB1a063AAfFb",
    ClearingHouse: "0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd",
    Markets: {
      Amberdata: {
        BTCUSDC: "0x0",
        SOLUSDC: "0x0",
        AVAXUSDC: "0x0",
      },
      "S&P Platts": {
        BATCH04: "0x0",
        BATCP04: "0x0",
        CNCAD00: "0x0",
        ACRCA00: "0x0",
      },
      "S&P Indices": {
        "Bitcoin Index": "0x0",
        "Ethereum Index": "0x0",
      },
    },
  },
  accounts: [],
  network: "fuji",
  externalContracts: {
    foundationGovernance: "0x371D128A0a286800d3A5E830F1D26dFf237A3279",
    arbitrageur: "0x1A48776f436bcDAA16845A378666cf4BA131eb0F",
    usdc: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
    tether: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
    ambBridgeOnXDai: "0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59",
    multiTokenMediatorOnXDai: "0xf6A78083ca3e2a662D6dd1703c939c8aCE2e268d",
    proxyAdmin: "0x29853EcF31eaedcD9074a11A85A8C8b689165F0b",
    referral: "0xF1d5BA04a25A6D88c468af932BFe2B1e78db7B45",
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
