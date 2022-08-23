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
  status: string;
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

export interface SubPosition extends Omit<Position, "status"> {
  id: string;
  positionChanges: PositionChange[];
  marginChanges: MarginChange[];
}

export interface DbPosition {
  key: string;
  position: Position;
  history: HistoryEvent[];
}

export interface PositionEvent {
  timestamp: number;
  type: string;
}

export interface HistoryEvent extends PositionEvent {
  margin?: string;
  size?: string;
  fee?: string;
  realizedPnl?: string;
  unrealizedPnlAfter?: string;
  amount?: string;
  fundingPayment: string;
  notification: boolean;
}

export interface PositionChange extends PositionEvent {
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

export interface MarginChange extends PositionEvent {
  amount: string;
  fundingPayment: string;
}
