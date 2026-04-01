## Current Phase

独立子项目治理收口已完成，进入可部署状态

## Done

- 为 `web/` 增加独立运行时配置模板 `web/.env.example`
- 在 `web/server/config.js` 中实现自动读取 `web/.env`
- 将会话从纯内存扩展为默认文件持久化，并支持进程退出前刷新
- 新增 `GET /api/health` 健康检查接口
- 新增 `web/README.md`，补齐独立部署与运维说明
- 为根仓库增加 `web:install`、`web:start`、`web:dev`、`web:check` 快捷脚本
- 更新根 README 与 `docs/web-service/*` 文档

## In Progress

- 无

## Blockers

- 无外部阻塞；真实登录恢复仍需要带有效账号的人工验证

## Open Risks

- 文件持久化会话适合单机部署；若后续扩展到多实例，仍需迁移到 Redis 或数据库
- 若部署目录不可写，会话会回退为仅内存有效且日志中出现持久化警告
- 当前健康检查只验证进程与会话存储信息，不验证上游实时可用性

## Next Steps

- 如需生产部署，为 `web/data/` 配置持久化磁盘
- 如需多实例部署，再单独规划会话后端迁移
