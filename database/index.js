const { dbConfig, customPoolConfig } = require("./config");
const { logger } = require("../logger");

const isProduction = process.env.NODE_ENV === "production";

const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");
const customConnectionPool = mysql.createPool(customPoolConfig);

const sequelize = new Sequelize(
	dbConfig.database,
	dbConfig.username,
	dbConfig.password,
	dbConfig,
);

const db = {
	sequelize,
	customConnectionPool,
	models: {},
};

// ==================== 模型加载（顶层同步，无需异步） ====================

db.models.User = require("./models/User")(sequelize, Sequelize.DataTypes);
db.models.SupplierStore = require("./models/SupplierStore")(
	sequelize,
	Sequelize.DataTypes,
);
db.models.SupplierSheet = require("./models/SupplierSheet")(
	sequelize,
	Sequelize.DataTypes,
);
db.models.SupplierStoreHistory = require("./models/SupplierStoreHistory")(
	sequelize,
	Sequelize.DataTypes,
);

db.User = db.models.User;
db.SupplierStore = db.models.SupplierStore;
db.SupplierSheet = db.models.SupplierSheet;
db.SupplierStoreHistory = db.models.SupplierStoreHistory;

// ==================== 数据库连接管理 ====================

function testDBConnection() {
	return sequelize.authenticate();
}

function closeCustomConnectionPool() {
	return customConnectionPool.end();
}

function closeDBConnection() {
	return sequelize.close();
}

// ===================== 表同步与用户初始化 =====================

function syncModels() {
	return sequelize.sync({ alter: !isProduction, force: false });
}

function initUser() {
	const userModel = db.models.User;
	return userModel.findOrCreate({
		where: { username: process.env.DB_DEFAULT_USER },
		defaults: {
			password: process.env.DB_DEFAULT_PASS,
		},
	});
}

// ===================== 异步初始化 =====================

async function initDatabase() {
	logger.info(">>> testDBConnection");
	await testDBConnection();
	logger.info(">>>> sequelize database connection is successful");

	logger.info(">>> syncModels");
	await syncModels();

	logger.info(">>> initUser");
	await initUser();

	logger.info(">>>> database initialized");
}

db.testDBConnection = testDBConnection;
db.closeCustomConnectionPool = closeCustomConnectionPool;
db.closeDBConnection = closeDBConnection;
db.syncModels = syncModels;
db.initUser = initUser;
db.initDatabase = initDatabase;

module.exports = db;
