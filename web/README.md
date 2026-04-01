# AltCampusLife Web

独立部署的 Web 子项目，负责：

- 登录校园账户
- 查询余额、充电状态、月度记录
- 浏览所有地点与逐桩状态
- 浏览器扫码或手动输入编号发起充电

不负责：

- 在 Web 中完成真实充值付款

当前上游返回的是支付宝 App 支付订单，原版客户端通过原生 Alipay SDK `payV2(...)` 完成支付。Web 端只能提示限制，不能稳定代替原生充值。

## 目录

- `public/`：无需构建的静态前端
- `server/`：Node HTTP 服务、会话管理和上游代理
- `.env.example`：运行时配置模板

## 环境要求

- Node.js 18+

## 快速开始

在 `web/` 目录下：

```sh
npm install
npm start
```

首次运行前复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

或在类 Unix 环境下：

```sh
cp .env.example .env
```

或在仓库根目录下：

```sh
npm run web:install
npm run web:start
```

默认监听 `http://0.0.0.0:8787`。

## 常用脚本

- `npm start`：启动生产模式服务
- `npm run dev`：使用 `node --watch` 启动开发模式
- `npm run check`：执行前后端脚本语法检查

## 运行时配置

服务会自动读取 `web/.env`，未设置时回退到默认值。

| Key | Default | Notes |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | HTTP 监听地址 |
| `PORT` | `8787` | HTTP 监听端口 |
| `SESSION_TTL_MS` | `604800000` | 会话 TTL，默认 7 天 |
| `SESSION_PERSIST_ENABLED` | `true` | 是否把会话落盘 |
| `SESSION_FILE` | `data/sessions.json` | 会话持久化文件，相对 `web/` 目录解析 |
| `SESSION_WRITE_DEBOUNCE_MS` | `500` | 会话文件写入防抖毫秒数 |
| `REQUEST_TIMEOUT_MS` | `20000` | 上游请求超时 |
| `MIN_PAY_AMOUNT` | `1.5` | 服务端最小充值金额校验 |

## 会话行为

- 登录后会下发带 `Max-Age` 的 HttpOnly Cookie
- 服务器默认将会话写入 `web/data/sessions.json`
- 服务重启后会从该文件恢复未过期会话
- 如果删除 `data/` 或清理浏览器 Cookie，用户需要重新登录

## 运维建议

- 生产环境通过 Nginx / Caddy 反向代理到 Node 进程，并启用 HTTPS
- 将 `web/data/` 挂到持久化磁盘，避免容器重建后会话丢失
- 使用 `/api/health` 做健康检查

示例：

```sh
curl http://127.0.0.1:8787/api/health
```

## 已知限制

- 充值仍需回原生 App 完成
- 浏览器扫码依赖 `BarcodeDetector`，部分环境只能手动输入
- 逐桩状态依赖 `getsublist(rid)`，刷新会比地点汇总慢
