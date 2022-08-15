import { Market } from "../common/types";

const markets: Market[] = [
  {
    name: "Amberdata",
    pairs: [
      {
        name: "Bitcoin",
        pair: "BTC/USD",
      },
      {
        name: "Solana",
        pair: "SOL/USD",
      },
      {
        name: "Avalanche",
        pair: "AVAX/USD",
      },
    ],
  },
  {
    name: "S&P Platts",
    pairs: [
      {
        name: "Battery metal - Cobalt Hydroxide CIF China",
        pair: "$/lb",
      },
      {
        name: "Battery metal - Lithium Carbonate CIF North Asia",
        pair: "$/mt",
      },
      {
        name: "Carbon - Platts CRC",
        pair: "$/mtCO2e",
      },
    ],
  },
  {
    name: "S&P Indices",
    pairs: [
      {
        name: "S&P Bitcoin Index",
        pair: "SPBTC/USD",
      },
      {
        name: "S&P Ethereum Index",
        pair: "SPETH/USD",
      },
    ],
  },
];

export const getMarkets = () => {
  return markets;
};
