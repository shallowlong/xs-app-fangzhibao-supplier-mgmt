require("dotenv").config();

const { getCurrentVersion } = require("../common/version");

const { logger } = require("../logger");
const { closeDBConnection, closeCustomConnectionPool } = require("../database");
const feishuUtil = require("../util/feishuUtil");

const app = require("../app");
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const http = require("http");
const server = http.createServer(app);
server.on("error", onError);
server.on("listening", onListening);
server.listen(port);

function normalizePort(val) {
	let port = parseInt(val, 10);
	if (isNaN(port)) return val; // named pipe
	if (port >= 0) return port; // port number
	return false;
}

function onError(error) {
	if (error.syscall !== "listen") throw error;

	let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			logger.error(bind + " requires elevated privileges");
			feishuUtil.warn(`服务器启动失败: ${bind} 需要提升权限`);
			process.exit(1);
		case "EADDRINUSE":
			logger.error(bind + " is already in use");
			feishuUtil.warn(`服务器启动失败: ${bind} 端口已被占用`);
			process.exit(1);
		default:
			throw error;
	}
}

function onListening() {
	let addr = server.address();
	let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
	logger.info(">>>> HTTP server is listening on " + bind);
	feishuUtil.warn(
		`纺支宝供应商管理系统启动成功，监听端口: ${bind}，当前版本: ${getCurrentVersion()}，当前PID: ${process.pid}`,
	);
}

let isCleaningUp = false;
async function cleanup(fromSignal) {
	if (fromSignal) {
		logger.info(
			">>>> cleanup, from signal: " +
				fromSignal +
				", isCleaningUp: " +
				isCleaningUp,
		);
	} else {
		logger.info(
			">>>> cleanup, from unknown signal, isCleaningUp: " + isCleaningUp,
		);
	}

	if (isCleaningUp) {
		logger.info(
			">>>> cleanup already in progress, skipping... from: " + fromSignal,
		);
		return;
	}
	isCleaningUp = true;

	logger.info(">>>> closing 2 database connections...");
	await closeCustomConnectionPool();
	await closeDBConnection();

	logger.info(">>>> closing the HTTP server...");
	server.close(async (err) => {
		if (err) {
			logger.error(
				err,
				"##### fail to close the HTTP server, exit with code 1",
			);
			process.exit(1);
		}
		logger.info("<<<< HTTP server closed, exit with code 0");
		process.exit(0);
	});
}

// 监听终止信号：SIGINT（Ctrl+C）、SIGTERM（kill命令）
process.on("SIGINT", () => cleanup("SIGINT"));
process.on("SIGTERM", () => cleanup("SIGTERM"));
// 处理未捕获的异常
process.on("uncaughtException", (err) => {
	logger.error(err, "###### uncaughtException, exit with code 1:");
	process.exit(1);
});
// 处理未捕获的Promise拒绝
process.on("unhandledRejection", (reason) => {
	logger.error(reason, "###### unhandledRejection, exit with code 1:");
	process.exit(1);
});
