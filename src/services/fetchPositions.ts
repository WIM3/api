import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, SUBGRAPH_URL, STATUS } from "../common/constants";
import { DbPosition, SubPosition, PositionChange, MarginChange } from "../common/types";
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
        SUBGRAPH_URL,
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
      // TODO: replace with proper status definition
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

export const getPositions = (): Map<string, Omit<DbPosition, "key">> => {
  return positions;
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
            const newEvent = <PositionChange>event;
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
        const status = history[0] ? history[history.length - 1].type : STATUS.None;

        positions.set(subPosition.id, { position: { ...newPosition, status }, history });
        savePosition({ key: subPosition.id, position: { ...newPosition, status }, history }).catch(
          (e) => {
            logger.error(e);
          }
        );
      }
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
