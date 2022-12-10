import log4js from "log4js";

import { EVM } from "./constants";

const level = EVM === "local" ? "debug" : "info";

log4js.configure({
  appenders: { default: { type: "console" } },
  categories: { default: { appenders: ["default"], level } },
});

export const logger: log4js.Logger = log4js.getLogger();
