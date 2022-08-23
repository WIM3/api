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
}

export interface SubPosition extends Position {
  id: string;
  positionChanges: PositionChange[];
  positionLiquidations: PositionLiquidation[];
  marginChanges: MarginChange[];
}

export interface DbPosition {
  key: string;
  position: Position;
}

export interface PositionChange {
  timestamp: number;
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
  timestamp: number;
  notional: string;
  size: string;
  liquidationFee: string;
  liquidator: string;
  badDebt: string;
}

export interface MarginChange {
  timestamp: number;
  amount: string;
  fundingPayment: string;
}
