const { existsSync, mkdirSync } = require("fs");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";
const logLevel = isProduction ? "info" : "debug";

function ensureLogDir() {
	const logDir = path.join(__dirname, "logs");
	if (!existsSync(logDir)) {
		mkdirSync(logDir, { recursive: true });
	}
	return logDir;
}

function createWinstonLogger() {
	const logDir = ensureLogDir();

	const winston = require("winston");
	const DailyRotateFile = require("winston-daily-rotate-file");

	const transports = [
		// 文件日志，按日期轮转
		new DailyRotateFile({
			filename: path.join(logDir, "winston-application-%DATE%.log"),
			datePattern: "YYYY-MM-DD",
			maxSize: "10m",
			maxFiles: "30d",
			level: logLevel,
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.json(),
			),
		}),
	];

	if (!isProduction) {
		transports.push(
			new winston.transports.Console({
				level: logLevel,
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
					winston.format.printf(
						({ level, message, timestamp, ...metadata }) => {
							let msg = `${timestamp} [${level}]: ${message}`;
							if (Object.keys(metadata).length > 0) {
								msg += ` ${JSON.stringify(metadata)}`;
							}
							return msg;
						},
					),
				),
			}),
		);
	}

	const logger = winston.createLogger({
		level: logLevel,
		transports: transports,
		exitOnError: false,
	});

	return logger;
}

const logger = createWinstonLogger();

const morganStream = {
	write: (message) => {
		logger.info({ type: "express-morgan-log", msg: message.trim() });
	},
};

module.exports = { logger, morganStream };
