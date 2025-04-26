// server/src/utils/logger.js
const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
