## Background / Problem

现有项目同时包含 React Native 客户端与 `web/` 目录。虽然 Web 版本已经可以独立运行，但此前仍更像“主仓库里的一个功能目录”，缺少独立项目常见的治理要素，例如环境变量模板、独立运行说明、持久化会话和运维健康检查。

## Scope

- 将 `web/` 收口为单仓库中的独立子项目
- 增加 `web/.env.example` 与自动读取 `web/.env` 的配置机制
- 将会话从纯内存扩展为默认可持久化到本地文件
- 提供独立的 `web/README.md`、根目录快捷脚本和健康检查接口
- 保持现有 Web 前端、上游协议和页面功能不变

## Non-goals

- 不拆分为独立 Git 仓库
- 不改动 React Native 客户端业务逻辑
- 不引入 Redis、数据库或新的外部基础设施依赖
- 不改变 Web 当前“充值需回原生 App”的产品边界

## Constraints

- 仍需兼容当前仓库结构，避免影响 React Native 工程
- 配置机制应尽量轻量，不增加必须的新依赖
- 会话持久化应能在本地目录中工作，并在服务重启后恢复
- 部署方式需兼容 Windows 本地开发与 Linux 服务器运行
- 文档需让 `web/` 在脱离根 README 的情况下也能被独立部署

## High-level Plan

1. 扩展 `web/server/config.js`，支持从 `web/.env` 读取运行时配置
2. 为 `SessionStore` 增加本地文件持久化与进程退出时刷新逻辑
3. 新增 `GET /api/health` 作为基础健康检查
4. 为 `web/` 增加独立 README、环境变量模板和忽略规则
5. 在根目录补充便捷脚本与入口说明，维持单仓库开发体验

## Verification

- `web/.env.example` 可作为独立部署模板使用
- `npm run web:check` 可通过
- Web 服务启动后，`GET /` 和 `GET /api/health` 可正常响应
- 会话文件写入后，服务重启可恢复未过期会话
- 根目录脚本可直接启动和检查 `web/`

## Rollback

- 所有变更仅影响 `web/` 目录和根目录脚本/文档，不影响 React Native 功能
- 若要回滚，可移除新增的 `web/.env.example`、`web/README.md`、持久化会话逻辑和根目录快捷脚本
- 即使禁用会话持久化，也可通过设置 `SESSION_PERSIST_ENABLED=false` 退回到纯内存模式
