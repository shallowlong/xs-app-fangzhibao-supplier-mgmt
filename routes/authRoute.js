const { logger } = require("../logger");

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
	const jwt_token = req.cookies.jwt_token; // 从 Cookie 提取
	if (!jwt_token) {
		logger.info("no token found in cookie, redirect to login page");
		return res.redirect("/login");
	}

	try {
		// 验证令牌
		if (jwt.verify(jwt_token, JWT_SECRET)) {
			next();
		} else {
			logger.error("token verification failed");
			return res.redirect("/login");
		}
	} catch (error) {
		logger.error(error, "###### authenticateToken error");
		return res.redirect("/login");
	}
};

module.exports = authenticateToken;
