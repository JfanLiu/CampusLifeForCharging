- Date: 2026-03-30
- Summary: 新增 Web 版本设计文档与实现计划
- Touchpoints: `docs/web-service/plan.md`, `docs/web-service/model.md`, `docs/web-service/task.md`, `docs/web-service/changelog.md`
- Behavior: 定义 Web 前后端一体方案、上游协议模型、任务状态与风险边界

- Date: 2026-03-30
- Summary: 完成可部署的 Web 版本实现
- Touchpoints: `web/package.json`, `web/package-lock.json`, `web/server/*`, `web/public/*`, `README.md`, `docs/web-service/*`
- Behavior: 新增独立 Node Web 服务、静态前端页面、上游代理接口、浏览器扫码、充值兼容跳转和部署说明

- Date: 2026-03-31
- Summary: 修正 Web 支付跳转策略并新增地点状态总览
- Touchpoints: `web/server/upstream.js`, `web/server/index.js`, `web/public/index.html`, `web/public/styles.css`, `web/public/app.js`, `README.md`, `docs/web-service/*`
- Behavior: 将支付宝兼容方案改为网关表单 POST，新增 `/api/stations` 与地点级状态卡片，并明确上游暂不提供逐桩明细

- Date: 2026-03-31
- Summary: 识别隐藏逐桩接口并补齐 Web 逐桩状态展示
- Touchpoints: `web/server/upstream.js`, `web/public/app.js`, `web/public/styles.css`, `README.md`, `docs/web-service/*`
- Behavior: 通过 `getsublist(rid)` 拉取地点下逐桩状态，页面可展示每一根充电桩当前是否空闲、充电中或故障

- Date: 2026-03-31
- Summary: 查实充值链路依赖原生 Alipay SDK 并修正 Web 提示
- Touchpoints: `web/server/upstream.js`, `web/public/app.js`, `README.md`, `docs/web-service/*`
- Behavior: 经反编译确认原版充值调用 `payV2(...)`，Web 端不再把 App 支付订单误导成可直接付款的网页入口
