import axios from "axios";
import { BigNumber as BN } from "bignumber.js";

import {
  SUBGRAPH_LIMIT,
  SUBGRAPH_FREQUENCY,
  MAX_POSITIONS,
  POSITION_SUBGRAPH,
  STATUS,
} from "../common/constants";
import {
  DbPosition,
  SubPosition,
  Position,
  PositionChange,
  MarginChange,
  HistoryEvent,
} from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";
import { savePosition } from "../model/positions";

let positions = new Map<string, Omit<DbPosition, "key">>();

const getPositionsFromSubgraph = async (): Promise<SubPosition[]> => {
  let subPositions: SubPosition[] = [];
  let last = "";

  while (true) {
    const res = (
      await axios.post(
        POSITION_SUBGRAPH,
        {
          query: `query GetPositions {
              positions (first: ${SUBGRAPH_LIMIT}, where: { id_gt: "${last}" }) {
                id
                timestamp
                trader
                amm
                margin
                openNotional
                size
                tradingVolume
                leverage
                entryPrice
                fee
                realizedPnl
                unrealizedPnl
                badDebt
                liquidationPenalty
                fundingPayment
                totalPnlAmount
                positionChanges (first: ${SUBGRAPH_LIMIT}, orderBy: timestamp) {
                  timestamp
                  margin
                  notional
                  exchangedSize
                  fee
                  sizeAfter
                  realizedPnl
                  unrealizedPnlAfter
                  badDebt
                  liquidationPenalty
                  spotPrice
                  fundingPayment
                }
                marginChanges (first: ${SUBGRAPH_LIMIT}, orderBy: timestamp) {
                  timestamp
                  amount
                  fundingPayment
                }
              }
            }`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
    ).data;
    if (res.errors) throw res.errors[0].message;

    const tmp: SubPosition[] = res.data.positions;
    subPositions = subPositions.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return subPositions;
};

const getNewOrderedEvents = (
  posChanges: PositionChange[],
  mgnChanges: MarginChange[],
  timestamp: number
): (PositionChange | MarginChange)[] => {
  const events: (PositionChange | MarginChange)[] = [];

  // filtering out only those that are new
  for (const posChange of posChanges) {
    if (posChange.timestamp > timestamp) {
      posChange.type = STATUS.Chng;
      events.push(posChange);
    }
  }
  for (const mgnChange of mgnChanges) {
    if (mgnChange.timestamp > timestamp) {
      mgnChange.type = STATUS.Mgn;
      events.push(mgnChange);
    }
  }

  // sorting aggregated events based on timestamp
  return events.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
};

const processPositionChange = (change: PositionChange, oldPosition?: Position): PositionChange => {
  // TODO: confirm if this is correct
  // exchangedSize lower than 0 should mean the position is closing
  // old position not existing or having size lower than 0 should mean new one is opening
  // liquidationPenalty greater than 0 should mean the position is being liquidated
  if (new BN(change.exchangedSize).lt(0)) {
    change.type = STATUS.Close;
  } else if (!oldPosition || new BN(oldPosition.size).lt(0)) {
    change.type = STATUS.Open;
  } else if (new BN(change.liquidationPenalty).gt(0)) {
    change.type = STATUS.Liq;
  }
  return change;
};

export const getPositions = (): Map<string, Omit<DbPosition, "key">> => {
  return positions;
};

export const getPositionsByUser = (user: string): Omit<DbPosition, "key">[] => {
  return [...positions.values()].filter(
    (obj: Omit<DbPosition, "key">) => obj.position.trader === user
  );
};

export const getRecentlyOpenedPositionsByAmm = (amm: string): HistoryEvent[] => {
  const recentlyOpened: HistoryEvent[] = [];
  const filteredPositions = [...positions.values()].filter(
    (obj: Omit<DbPosition, "key">) => obj.position.amm === amm
  );

  for (const position of filteredPositions) {
    for (const event of position.history) {
      if (event.type === STATUS.Open) recentlyOpened.push(event);
    }
  }

  // sorting recently opened based on timestamp and returning only last few
  const sortedPositions = recentlyOpened.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
  return sortedPositions.length > MAX_POSITIONS
    ? sortedPositions.slice(0 - MAX_POSITIONS)
    : sortedPositions;
};

export const run = async (positionsFromDb: Map<string, Omit<DbPosition, "key">>) => {
  // initializing positions from DB so that it does not need to start over
  positions = positionsFromDb;

  while (true) {
    const subPositions = await getPositionsFromSubgraph().catch((e) => {
      logger.error(e);
    });

    if (subPositions) {
      for (const subPosition of subPositions) {
        // checking if it already exists in memory
        const old = positions.get(subPosition.id);
        const history = old ? old.history : [];
        const { id, positionChanges, marginChanges, ...newPosition } = subPosition;

        // if they are exactly the same based on their timestamp, we can skip
        if (old && newPosition.timestamp === old.position.timestamp) continue;

        // processing of position related events
        const events = getNewOrderedEvents(
          subPosition.positionChanges,
          subPosition.marginChanges,
          old ? old.position.timestamp : 0
        );
        for (const event of events) {
          if (event.type === STATUS.Mgn) {
            const newEvent = <MarginChange>event;
            history.push({
              timestamp: newEvent.timestamp,
              type: newEvent.type,
              amount: newEvent.amount,
              fundingPayment: newEvent.fundingPayment,
              notification: true,
            });
          } else {
            const newEvent = processPositionChange(<PositionChange>event, old?.position);
            history.push({
              timestamp: newEvent.timestamp,
              type: newEvent.type,
              margin: newEvent.margin,
              size: newEvent.sizeAfter,
              fee: newEvent.fee,
              realizedPnl: newEvent.realizedPnl,
              unrealizedPnlAfter: newEvent.unrealizedPnlAfter,
              fundingPayment: newEvent.fundingPayment,
              notification: true,
            });
          }
        }

        // TODO: confirm if this is correct
        // position should be considered active if it has not been liquidated or closed as the last event
        const active =
          history[0] &&
          history[history.length - 1].type !== STATUS.Liq &&
          history[history.length - 1].type !== STATUS.Close;

        positions.set(subPosition.id, { position: { ...newPosition, active }, history });
        savePosition({ key: subPosition.id, position: { ...newPosition, active }, history }).catch(
          (e) => {
            logger.error(e);
          }
        );
      }
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
