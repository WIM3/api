export interface Markets {
  [market: string]: {
    [pair: string]: string;
  };
}

export interface Amm {
  id: string;
  priceFeedKey: string;
  fundingPeriod: number;
  price: number;
}

export interface DefaultModelResponse {
  id: string;
  value: string;
}
