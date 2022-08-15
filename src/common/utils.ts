import { BigNumber as BN } from "bignumber.js";

/**
 * Timeout function
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Convert 10.999 to 10999000
 */
export const toBaseUnitBN = (rawAmt: string | number, decimals: number) => {
  const raw = new BN(rawAmt);
  const base = new BN(10);
  const decimalsBN = new BN(decimals);
  return raw.times(base.pow(decimalsBN)).integerValue();
};

/**
 * Convert 10999000 to 10.999
 */
export const toTokenUnitsBN = (tokenAmount: string | number, tokenDecimals: number) => {
  const amt = new BN(tokenAmount);
  const digits = new BN(10).pow(new BN(tokenDecimals));
  return amt.div(digits);
};
