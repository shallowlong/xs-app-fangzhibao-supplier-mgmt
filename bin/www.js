require("dotenv").config();

const app = require("../app");
const http = require("http");

const { getCurrentVersion } = require("../common/version");
const { closeCustomConnectionPool, closeDBConnection } = require("../database");
const { logger } = require("../logger");

const {
	normalizePort,
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
const port = normalizePort(process.env.PORT || "3000");

server.on("error", function (error) {
	onServerError(error, port);
});

server.on("listening", function () {
	logListening(server, version, startTime, APP_NAME);
});

server.listen(port);

app.initApp()
	.then(function () {
		logInitComplete(version, startTime, APP_NAME);
	})
	.catch(function (err) {
		logger.error(err, "##### initApp 未预期失败");
	});

const closeFns = [
	{ name: "自定义连接池", fn: closeCustomConnectionPool },
	{ name: "Sequelize 连接", fn: closeDBConnection },
];
const cleanup = createCleanup(server, closeFns);
setupProcessHandlers(cleanup);
