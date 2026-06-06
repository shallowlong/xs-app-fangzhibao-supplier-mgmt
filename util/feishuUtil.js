const path = require("path");

// 直接通过文件路径引用子模块（不通过 package.json 依赖）
const { FeishuNotifier } = require(
	path.join(__dirname, "../submodules/xs-feishu-notifier/dist/index.cjs"),
);
const { logger } = require("../logger");

const feishuUtil = new FeishuNotifier({
	webhookUrl: process.env.FEISHU_WEBHOOK_URL,
	logger: logger,
	appName: "xs-app-fangzhibao-supplier-mgmt",
	rateLimitPerSecond: 2,
	rateLimitPerMinute: 50,
	maxQueueSize: 100,
	maxMessageSize: 20 * 1024 - 1,
	skipPeakTime: 1,
	retryInterval: 5000,
});

module.exports = feishuUtil;
