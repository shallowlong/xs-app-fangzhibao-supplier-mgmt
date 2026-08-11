---
alwaysApply: true
---

# 纺支宝供应商管理系统 — 技术栈与项目概述

## 项目定位

用于检查纺支宝 ERP 内置的供货商信息是否存在更新的 WebApp。

## 核心技术栈

| 类别        | 技术                                    | 版本             |
| ----------- | --------------------------------------- | ---------------- |
| 运行时      | Node.js (纯 JavaScript, CommonJS)       | -                |
| 模块系统    | CommonJS (`require`/`module.exports`)   | -                |
| Web 框架    | Express                                 | ^5.1.0           |
| 模板引擎    | EJS                                     | ^3.1.10          |
| ORM         | Sequelize (连接池)                      | ^6.37.8          |
| 数据库      | MySQL (mysql2 + 自定义连接池)           | ^3.22.5          |
| 认证        | JWT (jsonwebtoken)                      | ^9.0.2           |
| 会话        | express-session + express-mysql-session | ^1.18.2 / ^3.0.3 |
| 密码加密    | bcryptjs                                | ^3.0.2           |
| 日志        | Winston + winston-daily-rotate-file     | ^3.19.0 / ^5.0.0 |
| HTTP 日志   | Morgan                                  | ~1.10.1          |
| HTTP 客户端 | Axios                                   | ^1.17.0          |
| 日期处理    | Day.js                                  | ^1.11.21         |
| 文件上传    | express-fileupload                      | ^1.5.2           |
| Excel 解析  | xlsx                                    | ^0.18.5          |
| 限流        | express-rate-limit                      | ^8.5.2           |

## 关键约束

- [必须] 使用 CommonJS 模块语法 (`require()` / `module.exports`)，禁止 `import` / `export`
- [必须] 异步操作使用 `async/await`，禁止 `.then()/.catch()` 链式调用
- [必须] 数据库连接有两套：Sequelize ORM 连接 + 自定义 mysql2 连接池（用于 session store）
- [必须] 敏感配置通过 `.env` 环境变量管理，禁止硬编码
- [必须] JWT 认证通过 `routes/authRoute.js` 中间件进行
