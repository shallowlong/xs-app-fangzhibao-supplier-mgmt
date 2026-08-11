---
alwaysApply: true
---

# 纺支宝供应商管理系统 — 代码风格规范

## 格式化（Prettier 配置为准）

- [必须] **缩进**：Tab 制表符，宽度 4
- [必须] **引号**：双引号 (`singleQuote: false`)
- [必须] **分号**：每条语句末尾加分号 (`semi: true`)
- [必须] **尾逗号**：所有多行结构末尾加逗号 (`trailingComma: "all"`)
- [必须] **箭头函数参数**：始终加括号 (`arrowParens: "always"`)
- [必须] **换行符**：LF (`endOfLine: "lf"`)
- [必须] **字符串拼接**：包含变量的字符串使用模板字面量（`` ` ` ``），禁止使用 `+` 拼接

```js
// ✅ 正确：模板字面量
const msg = `用户 ${name} 登录成功，耗时 ${elapsed}ms`;

// ❌ 错误：字符串拼接
const msg = "用户 " + name + " 登录成功，耗时 " + elapsed + "ms";
```

## 命名规范

| 类型       | 命名方式                             | 示例                                 |
| ---------- | ------------------------------------ | ------------------------------------ |
| 文件名     | camelCase 或 kebab-case              | `supplierService.js`, `authRoute.js` |
| 函数/变量  | camelCase                            | `getAllSuppliers`, `isValid`         |
| 路由文件   | PascalCase 或 camelCase + Route 后缀 | `mainRoute.js`, `loginRoute.js`      |
| 数据库模型 | PascalCase 单数                      | `User`, `SupplierStore`              |
| 常量/配置  | camelCase                            | `dbConfig`, `customPoolConfig`       |

## 模块导出规范

- [必须] 所有需要 `module.exports` 的方法/变量在文件最底部统一声明导出
- [必须] 文件内部定义的函数/变量统一使用驼峰命名法（camelCase）

```js
// ✅ 正确：方法定义在文件内部，module.exports 集中在底部
function getUserById(id) { ... }
function createUser(data) { ... }

module.exports = { getUserById, createUser };
```

## 目录约定

| 目录               | 职责                           |
| ------------------ | ------------------------------ |
| `routes/`          | 路由定义 + EJS 页面渲染逻辑    |
| `services/`        | 业务逻辑封装（供应商信息处理） |
| `database/`        | Sequelize ORM + 自定义连接池   |
| `database/models/` | Sequelize 模型定义             |
| `util/`            | 工具函数（飞书通知等）         |
| `common/`          | 公共模块（版本管理等）         |
| `public/`          | 静态资源                       |
| `views/`           | EJS 模板文件                   |

## 数据库规范

- [必须] 同时维护两套连接：Sequelize ORM（`dbConfig`）和自定义 mysql2 连接池（`customPoolConfig`）
- [必须] 自定义连接池用于 `express-mysql-session` 的 session 存储
- [必须] 关闭时先关闭自定义连接池，再关闭 Sequelize 连接
- [必须] 模型文件放在 `database/models/` 下，每个模型一个文件

## 禁止事项

- [必须] 禁止提交 `console.log`，使用 `logger` 模块替代
- [必须] 禁止在路由文件中编写复杂业务逻辑，必须通过 `services/` 封装
- [必须] 禁止硬编码数据库密码、Session Secret 等敏感信息
