require("dotenv").config();

const app = require("../app");
const http = require("http");

const { getCurrentVersion } = require("../common/version");
const { closeCustomConnectionPool, closeDBConnection } = require("../database");

const {
	startupLog,
	logListening,
	logInitComplete,
	onServerError,
	createCleanup,
	setupProcessHandlers,
} = require("./startup");

const APP_NAME = "纺支宝ERP——供货商管理";

const startTime = startupLog(APP_NAME);
const version = getCurrentVersion();

const server = http.createServer(app);
let hasListened = false;

server.on("error", function (error) {
	onServerError(error, undefined);
});

server.on("listening", function () {
	if (hasListened) {
		logger.warn("#### listening 事件重复触发");
		return;
	}
	hasListened = true;

	logListening(server, version, startTime, APP_NAME);

	app.initApp()
		.then(function () {
			logInitComplete(version, startTime, APP_NAME);
		})
		.catch(function (err) {
			const { logger } = require("../logger");
			logger.error(err, "##### initApp 未预期失败");
		});
});

server.listen();

const closeFns = [
	{ name: "自定义连接池", fn: closeCustomConnectionPool },
	{ name: "Sequelize 连接", fn: closeDBConnection },
];
const cleanup = createCleanup(server, closeFns);
setupProcessHandlers(cleanup);
