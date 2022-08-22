import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, SUBGRAPH_URL } from "../common/constants";
import { Position } from "../common/types";
import { sleep } from "../common/utils";
import { logger } from "../common/logger";

let positions: Position[] = [];

const getPositionsFromSubgraph = async (): Promise<Position[]> => {
  let positions: Position[] = [];
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
                positionChanges (first: ${SUBGRAPH_LIMIT}) {
                  id
                  timestamp
                  trader
                  amm
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
                positionLiquidations (first: ${SUBGRAPH_LIMIT}) {
                  id
                  timestamp
                  trader
                  amm
                  notional
                  size
                  liquidationFee
                  liquidator
                  badDebt
                }
                marginChanges (first: ${SUBGRAPH_LIMIT}) {
                  id
                  timestamp
                  sender
                  amm
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

    const tmp: Position[] = res.data.positions;
    positions = positions.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return positions;
};

export const getPositions = (): Position[] => {
  return positions;
};

// TODO: needs to be properly adjusted
export const run = async () => {
  while (true) {
    const newPositions = await getPositionsFromSubgraph().catch((e) => {
      logger.error(e);
    });
    if (newPositions) positions = newPositions;

    await sleep(SUBGRAPH_FREQUENCY);
  }
};
