export interface Markets {
  [market: string]: {
    [pair: string]: string;
  };
}

export interface Amm {
  id: string;
  quoteAsset: string;
  priceFeedKey: string;
  fundingPeriod: number;
  fundingBufferPeriod: number;
  lastFunding: number;
  fundingRate: string;
  tradeLimitRatio: string;
  tradingVolume: string;
  underlyingPrice: string;
  dataFeedId?: string;
  price?: number;
  nextFunding?: number;
}

export interface PriceUpdate {
  timestamp: number;
  price: string;
}

export interface SubPriceFeed extends PriceUpdate {
  id: string;
  updates: PriceUpdate[];
}

export interface DbPriceFeed {
  key: string;
  history: PriceUpdate[];
}

export interface Position {
  timestamp: number;
  trader: string;
  amm: string;
  active: boolean;
  margin: string;
  openNotional: string;
  size: string;
  tradingVolume: string;
  leverage: string;
  entryPrice: string;
  underlyingPrice: string;
  fee: string;
  realizedPnl: string;
  unrealizedPnl: string;
  badDebt: string;
  liquidationPenalty: string;
  fundingPayment: string;
  totalPnlAmount: string;
}

export interface SubPosition extends Omit<Position, "active"> {
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
  entryPrice: string;
  underlyingPrice: string;
}

export interface HistoryEvent extends PositionEvent {
  price?: string;
  margin?: string;
  size?: string;
  fee?: string;
  realizedPnl?: string;
  unrealizedPnlAfter?: string;
  amount?: string;
  fundingPayment?: string;
  notification?: boolean;
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
