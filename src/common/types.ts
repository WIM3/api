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

export interface Position {
  id: string;
  timestamp: number;
  trader: string;
  amm: string;
  margin: string;
  openNotional: string;
  size: string;
  tradingVolume: string;
  leverage: string;
  entryPrice: string;
  fee: string;
  realizedPnl: string;
  unrealizedPnl: string;
  badDebt: string;
  liquidationPenalty: string;
  fundingPayment: string;
  totalPnlAmount: string;
  positionChanges: PositionChange[];
  positionLiquidations: PositionLiquidation[];
  marginChanges: MarginChange[];
}

export interface PositionChange {
  id: string;
  timestamp: number;
  trader: string;
  amm: string;
  margin: string;
  notional: string;
  exchangedSize: string;
  fee: string;
  sizeAfter: string;
  realizedPnl: string;
  unrealizedPnlAfter: string;
  badDebt: string;
  liquidationPenalty: string;
  spotPrice: string;
  fundingPayment: string;
}

export interface PositionLiquidation {
  id: string;
  timestamp: number;
  trader: string;
  amm: string;
  notional: string;
  size: string;
  liquidationFee: string;
  liquidator: string;
  badDebt: string;
}

export interface MarginChange {
  id: string;
  timestamp: number;
  sender: string;
  amm: string;
  amount: string;
  fundingPayment: string;
}

export interface DefaultModelResponse {
  id: string;
  value: string;
}
