require("dotenv").config();

const app = require("../app");
const http = require("http");

const { getCurrentVersion } = require("../common/version");
const { closeCustomConnectionPool, closeDBConnection } = require("../database");

const {
	normalizePort,
	startupLog,
	logListening,
	logInitComplete,
	onServerError,
	createCleanup,
	setupProcessHandlers,
} = require("./startup");

const APP_NAME = "纺支宝供应商管理系统";

const startTime = startupLog(APP_NAME);
const version = getCurrentVersion();

const server = http.createServer(app);
const port = normalizePort(process.env.PORT || "3000");

server.on("error", function (error) {
	onServerError(error, port);
});

server.on("listening", function () {
	logListening(server, version, startTime, APP_NAME);
	logInitComplete(version, startTime, APP_NAME);
});

server.listen(port);

const closeFns = [
	{ name: "自定义连接池", fn: closeCustomConnectionPool },
	{ name: "Sequelize 连接", fn: closeDBConnection },
];
const cleanup = createCleanup(server, closeFns);
setupProcessHandlers(cleanup);
