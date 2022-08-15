import log4js from "log4js";

log4js.configure({
  appenders: { default: { type: "console" } },
  categories: { default: { appenders: ["default"], level: "info" } },
});

export const logger: log4js.Logger = log4js.getLogger();
