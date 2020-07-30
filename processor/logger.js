// / /////////////////////////////////////////////////////////////////////////////
// / ///////////////////////Winston Logger///////////////////////////////////////
// / ////////////////////////////////////////////////////////////////////////////
const winston = require('winston')
const { combine, timestamp, label, prettyPrint, colorize, json } = winston.format

const logger = winston.createLogger({
  exitOnError: false,
  format: combine(
      timestamp(),
      prettyPrint(),
      colorize()
    ),
  level: 'info',
    // format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

  // ////////////////////////////////////////////////////////////////////////////////////
  // ///////////////////////////////////////////////////////////////////////////////////
  // ///////////////////////////////////////////////////////////////////////////////////

module.exports = {
  logger
}
