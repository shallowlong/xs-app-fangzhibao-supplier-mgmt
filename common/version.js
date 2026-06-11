const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "..", "package.json");

/**
 * 缓存的版本信息对象
 * 避免运行时频繁读取文件系统
 */
let cachedVersionInfo = null;

/**
 * 初始化版本信息缓存
 * 在应用启动时调用一次，后续直接读取缓存
 * @returns {Object} 版本信息对象
 */
function initVersionCache() {
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(packageJsonPath, "utf-8"),
		);
		const version = packageJson.version || "1.0.0";
		const [major, minor, patch] = parseVersion(version);

		cachedVersionInfo = {
			version,
			major,
			minor,
			patch,
			full: `v${version}`,
		};

		return cachedVersionInfo;
	} catch (error) {
		console.error("初始化版本信息失败:", error.message);
		cachedVersionInfo = {
			version: "1.0.0",
			major: 1,
			minor: 0,
			patch: 0,
			full: "v1.0.0",
		};
		return cachedVersionInfo;
	}
}

/**
 * 读取当前版本号（从缓存或文件）
 * @returns {string} 当前版本号 (x.y.z)
 */
function getCurrentVersion() {
	if (cachedVersionInfo) {
		return cachedVersionInfo.version;
	}
	// 首次调用时初始化缓存
	const info = initVersionCache();
	return info.version;
}

/**
 * 解析版本号为数字数组
 * @param {string} version - 版本号字符串
 * @returns {number[]} [major, minor, patch]
 */
function parseVersion(version) {
	const parts = version.split(".").map(Number);
	return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * 递增版本号
 * @param {string} version - 当前版本号
 * @param {string} level - 更新级别: 'patch' | 'minor' | 'major'
 * @returns {string} 新版本号
 */
function incrementVersion(version, level = "patch") {
	const [major, minor, patch] = parseVersion(version);

	switch (level) {
		case "major":
			return `${major + 1}.0.0`;
		case "minor":
			return `${major}.${minor + 1}.0`;
		case "patch":
		default:
			return `${major}.${minor}.${patch + 1}`;
	}
}

/**
 * 更新 package.json 中的版本号
 * 更新后会清空缓存，下次读取时重新加载
 * @param {string} newVersion - 新版本号
 * @returns {boolean} 是否更新成功
 */
function updatePackageVersion(newVersion) {
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(packageJsonPath, "utf-8"),
		);
		packageJson.version = newVersion;
		fs.writeFileSync(
			packageJsonPath,
			JSON.stringify(packageJson, null, "\t") + "\n",
			"utf-8",
		);
		// 清空缓存，下次读取时重新加载
		cachedVersionInfo = null;
		return true;
	} catch (error) {
		console.error("更新版本号失败:", error.message);
		return false;
	}
}

/**
 * 获取完整的版本信息对象（从缓存读取，高性能）
 * @returns {Object} 版本信息对象
 */
function getVersionInfo() {
	if (cachedVersionInfo) {
		return cachedVersionInfo;
	}
	// 首次调用时初始化缓存
	return initVersionCache();
}

module.exports = {
	getCurrentVersion,
	parseVersion,
	incrementVersion,
	updatePackageVersion,
	getVersionInfo,
	initVersionCache,
};
