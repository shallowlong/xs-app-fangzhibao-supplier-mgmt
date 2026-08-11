const { logger } = require("../logger");

let _feishuUtil = null;
function getFeishuUtil() {
	if (!_feishuUtil) {
		_feishuUtil = require("../util/feishuUtil");
	}
	return _feishuUtil;
}

function normalizePort(val) {
	let port = parseInt(val, 10);
	if (isNaN(port)) return val; // named pipe
	if (port >= 0) return port; // port number
	return false;
}

function startupLog(appName) {
	const startTime = Date.now();
	const env = process.env.NODE_ENV || "development";

	logger.info(`===== ${appName} 启动开始 =====`);
	logger.info(
		`时间: ${new Date(startTime).toISOString()}, 环境: ${env}, PID: ${process.pid}`,
	);
	return startTime;
}

function logListening(server, version, startTime, appName) {
	const addr = server.address();
	const bind =
		typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
	const elapsed = Date.now() - startTime;

	logger.info(`>>>> 端口已监听（初始化中…）: ${bind} (耗时 ${elapsed}ms)`);

	getFeishuUtil().warn(
		`${appName} 端口已监听，版本: v${version}，监听: ${bind}，PID: ${process.pid}，耗时: ${elapsed}ms`,
	);
}

function logInitComplete(version, startTime, appName) {
	const elapsed = Date.now() - startTime;

	logger.info(`===== ${appName} 启动完成 =====`);
	logger.info(`总耗时: ${elapsed}ms, 版本: v${version}, PID: ${process.pid}`);

	getFeishuUtil().warn(
		`${appName} 启动完成，版本: v${version}，PID: ${process.pid}，总耗时: ${elapsed}ms`,
	);
}

function onServerError(error, port) {
	if (error.syscall !== "listen") throw error;

	const bind =
		typeof port === "string" ? `Pipe ${port}` : `Port ${port ?? "?"}`;

	switch (error.code) {
		case "EACCES":
			logger.error(`${bind} 需要提升权限`);
			getFeishuUtil().warn(`${bind} 需要提升权限`);
			process.exit(1);
		case "EADDRINUSE":
			logger.error(`${bind} 已被占用`);
			getFeishuUtil().warn(`${bind} 已被占用`);
			process.exit(1);
		default:
			throw error;
	}
}

function createCleanup(server, closeFns) {
	let isCleaningUp = false;

	return function cleanup(fromSignal) {
		logger.info(
			`>>>> cleanup 触发, signal: ${fromSignal ?? "unknown"}, isCleaningUp: ${isCleaningUp}`,
		);

		if (isCleaningUp) {
			logger.info(`>>>> cleanup 已在执行, 跳过 (signal: ${fromSignal})`);
			return;
		}

		logger.info(`>>>> cleanup 开始执行`);
		isCleaningUp = true;

		// 5s 硬超时兜底
		const forceExitTimer = setTimeout(function () {
			logger.error(
				`##### cleanup 超时 5s, 强制退出 (signal: ${fromSignal})`,
			);
			process.exit(1);
		}, 5000);

		// 先关 HTTP server（立刻拒绝新连接）
		logger.info(">>>> 关闭 HTTP server...");
		server.close(function (err) {
			if (err) {
				logger.error(err, "##### HTTP server 关闭失败");
			} else {
				logger.info("<<<< HTTP server 已关闭");
			}
		});

		// 再依次关闭数据库连接
		if (closeFns && closeFns.length > 0) {
			logger.info(">>>> 关闭数据库连接...");
			closeFns
				.reduce(function (chain, item) {
					return chain.then(function () {
						logger.info(`>>>> 关闭 ${item.name}...`);
						return item.fn();
					});
				}, Promise.resolve())
				.then(function () {
					logger.info("<<<< 数据库连接已关闭");
				})
				.catch(function (dbErr) {
					logger.error(dbErr, "##### 数据库连接关闭失败");
				})
				.finally(function () {
					logger.info("<<<< cleanup 完成, 退出 (code 0)");
					clearTimeout(forceExitTimer);
					process.exit(0);
				});
		} else {
			// 无 DB 连接时，等待 HTTP server 关闭后退出
			setTimeout(function () {
				clearTimeout(forceExitTimer);
				process.exit(0);
			}, 2000);
		}
	};
}

function setupProcessHandlers(cleanupFn) {
	process.on("SIGINT", function () {
		cleanupFn("SIGINT");
	});
	process.on("SIGTERM", function () {
		cleanupFn("SIGTERM");
	});

	process.on("uncaughtException", function (err) {
		logger.error(err, "###### uncaughtException, exit 1");
		process.exit(1);
	});

	process.on("unhandledRejection", function (reason) {
		logger.error(reason, "###### unhandledRejection, exit 1");
		process.exit(1);
	});
}

module.exports = {
	normalizePort,
	startupLog,
	logListening,
	logInitComplete,
	onServerError,
	createCleanup,
	setupProcessHandlers,
};
