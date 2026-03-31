## Current Phase

实现完成，进入交付与后续增强阶段

## Done

- 识别 React Native 项目中的原生依赖与 Web 改造边界
- 从打包产物中提取上游协议、DES 密钥、XML/GBK 解码流程和接口地址
- 确认登录、账户、充电、充值相关接口入口
- 建立 `docs/web-service/` 文档骨架
- 完成 `web/server` 的上游协议封装、会话管理、静态资源服务和 REST API
- 完成 `web/public` 的单页 Web 前端，覆盖登录、余额、状态、记录、扫码、充值和高级工具
- 新增地点状态总览接口与前端视图，覆盖所有地点和每一根充电桩的当前状态
- 已本地验证 `GET /`、`GET /api/session` 和 `GET /api/charge-list` 可正常响应
- 已本地验证 `GET /api/stations` 返回 20 个地点的实时汇总数据
- 已识别并验证隐藏接口 `getsublist(rid)`，可返回地点下逐桩状态
- 补充 `README.md` 中的 Web 运行与部署说明

## In Progress

- 无

## Blockers

- 上游当前仅明确支持 App 支付签名串，Web 标准收银台能力存在限制
- 逐桩数据需要对每个地点追加一次 `getsublist(rid)` 请求，刷新成本明显高于地点汇总

## Open Risks

- 进程内会话在服务重启后会失效
- 若服务器与上游网络不通，所有业务接口都会失败
- 原版充值流程经反编译确认依赖 Alipay SDK `payV2(...)`；在不改上游支付产品类型的前提下，Web 端无法稳定实现真实付款
- 浏览器扫码能力依赖客户端实现，部分环境只能走手动输入

## Next Steps

- 如需生产部署，可将会话从内存迁移到 Redis 或数据库
- 如上游后续支持 WAP 支付，可仅替换服务端支付策略而保持前端 API 不变
- 如需更强的扫码兼容性，可引入专门的前端解码库替代 `BarcodeDetector`
