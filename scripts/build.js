const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { getCurrentVersion } = require("../common/version.js");

const filesToZip = [
	"bin/",
	"common/",
	"database/",
	"public/",
	"routes/",
	"services/",
	"submodules/",
	"util/",
	"views/",
	"app.js",
	"logger.js",
	"package.json",
	{ source: ".env.production", target: ".env", rename: true },
];

const outputDir = path.join(__dirname, "..", "dist");
fs.mkdirSync(outputDir, { recursive: true });

async function createZip(version) {
	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, "-")
		.slice(0, 19);
	const outputZip = path.join(
		outputDir,
		`fangzhibao-supplier-mgmt-v${version}-${timestamp}.zip`,
	);

	const output = fs.createWriteStream(outputZip);
	const archive = archiver("zip", {
		zlib: { level: 9 },
	});

	return new Promise((resolve, reject) => {
		output.on("close", function () {
			console.log(`✅ 成功创建ZIP文件：${outputZip}`);
			console.log(
				`📦 压缩大小：${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`,
			);
			resolve(outputZip);
		});

		archive.on("error", function (err) {
			reject(err);
		});

		archive.pipe(output);

		// 在forEach循环中区分处理普通文件/目录和需要重命名的文件
		filesToZip.forEach((item) => {
			if (typeof item === "object" && item.rename) {
				const sourcePath = path.resolve(__dirname, "..", item.source);
				if (fs.existsSync(sourcePath)) {
					archive.file(sourcePath, { name: item.target });
					console.log(
						`📄 已将${item.source}重命名为${item.target}并添加到ZIP`,
					);
				} else {
					console.log(
						`⚠️ 警告: ${item.source} 不存在，跳过重命名操作`,
					);
				}
			} else {
				const fullPath = path.resolve(__dirname, "..", item);
				if (fs.existsSync(fullPath)) {
					const stats = fs.statSync(fullPath);
					if (stats.isDirectory()) {
						archive.directory(fullPath, item);
						console.log(`📂 添加目录: ${item}`);
					} else {
						archive.file(fullPath, { name: item });
						console.log(`📄 添加文件: ${item}`);
					}
				} else {
					console.log(`⚠️ 警告: ${item} 不存在，跳过添加`);
				}
			}
		});

		archive.finalize();
	});
}

async function main() {
	console.log("🚀 开始打包项目...\n");

	try {
		// 检查 archiver 是否安装
		try {
			require.resolve("archiver");
		} catch (e) {
			console.error("❌ 错误: 请先安装 archiver 依赖");
			console.log("💡 运行命令: npm install --save-dev archiver");
			process.exit(1);
		}

		const version = getCurrentVersion();
		console.log(`📌 当前版本: ${version}\n`);

		console.log("📦 开始创建压缩包...\n");

		// 创建 zip 包
		await createZip(version);

		console.log("\n✨ 打包成功！");
	} catch (error) {
		console.error("\n❌ 打包失败:", error.message);
		process.exit(1);
	}
}

main();
