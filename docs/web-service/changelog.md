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
