import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, SUBGRAPH_URL } from "../common/constants";
import { Position, SubPosition } from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";
import { savePosition } from "../model/positions";

let positions = new Map<string, Position>();

const getPositionsFromSubgraph = async (): Promise<SubPosition[]> => {
  let positions: SubPosition[] = [];
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
                positionLiquidations (first: ${SUBGRAPH_LIMIT}, orderBy: timestamp) {
                  timestamp
                  notional
                  size
                  liquidationFee
                  liquidator
                  badDebt
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
    positions = positions.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return positions;
};

export const getPositions = (): Map<string, Position> => {
  return positions;
};

export const run = async (positionsFromDb: Map<string, Position>) => {
  // initializing positions from DB so that it does not need to start over
  positions = positionsFromDb;

  while (true) {
    const subPositions = await getPositionsFromSubgraph().catch((e) => {
      logger.error(e);
    });

    if (subPositions) {
      for (const subPosition of subPositions) {
        // checking if it already exists in memory
        const oldPosition = positions.get(subPosition.id);
        const { id, positionChanges, positionLiquidations, marginChanges, ...newPosition } =
          subPosition;

        // if they are exactly the same based on their timestamp, we can skip
        if (oldPosition && newPosition.timestamp === oldPosition.timestamp) continue;

        positions.set(subPosition.id, newPosition);
        savePosition({ key: subPosition.id, position: newPosition }).catch((e) => {
          logger.error(e);
        });

        // TODO: add processing of events
      }
    }

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
