import axios from "axios";

import { SUBGRAPH_LIMIT, SUBGRAPH_FREQUENCY, SUBGRAPH_URL } from "../common/constants";
import { Amm } from "../common/types";
import { sleep } from "../common/utils";

let amms: Amm[] = [];

const getAmmsFromSubgraph = async (): Promise<Amm[]> => {
  let amms: Amm[] = [];
  let last = "";

  while (true) {
    const res = (
      await axios.post(
        SUBGRAPH_URL,
        {
          query: `query GetAmms {
              amms (first: ${SUBGRAPH_LIMIT}, where: { id_gt: "${last}" }) {
                id
                priceFeedKey
                fundingPeriod
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

    const tmp: Amm[] = res.data.amms;
    amms = amms.concat(tmp);

    if (tmp.length < SUBGRAPH_LIMIT) break;
    last = tmp[tmp.length - 1].id;
  }
  return amms;
};

export const getAmm = (address: string): Amm | undefined => {
  return amms.find((amm) => {
    return amm.id === address.toLowerCase();
  });
};

export const run = async () => {
  while (true) {
    amms = await getAmmsFromSubgraph();
    await sleep(SUBGRAPH_FREQUENCY);
  }
};
