const path = require("path");

const createHttpError = require("http-errors");
const express = require("express");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { logger, morganStream } = require("./logger");

const MySQLStore = require("express-mysql-session")(session);
const { customConnectionPool, initDatabase } = require("./database");
const sessionStore = new MySQLStore({}, customConnectionPool);

const isProduction = process.env.NODE_ENV === "production";
const { getCurrentVersion } = require("./common/version");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
isProduction && app.set("trust proxy", 1);
app.use(morgan(process.env.MORGAN_OPTION, { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
	fileUpload({
		defParamCharset: "utf8",
	}),
);
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: sessionStore,
		cookie: {
			maxAge: 60 * 60 * 1000, // 默认1小时
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
		},
	}),
);
app.use((req, res, next) => {
	res.locals.isProduction = isProduction;
	res.locals.currentVersion = getCurrentVersion();
	next();
});

const mainRoute = require("./routes/mainRoute");
const loginRoute = require("./routes/loginRoute");
const historyRoute = require("./routes/historyRoute");
app.use("/login", loginRoute);
app.use("/history", historyRoute);
app.use("/", mainRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createHttpError(404));
});

// error handler
app.use(function (err, req, res, next) {
	res.locals.isProduction = isProduction;
	res.locals.message = err.message;
	res.locals.error = !isProduction ? err : {};

	res.status(err.status || 500);
	res.render("error");
});

// ===================== 异步初始化 =====================

async function initApp() {
	await initDatabase();
	const version = getCurrentVersion();
	logger.info(`>>>> app initialized, version: v${version}`);
}

app.initApp = initApp;

module.exports = app;
