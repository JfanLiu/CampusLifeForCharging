# CampusLifeForCharging

面向手机浏览器、尤其是 iPhone 用户的校园电动车充电网页方案。

这个项目把日常最常用的能力留在 Web 里：

- 登录校园充电账户
- 查看余额与当前充电状态
- 查看所有地点和各充电桩状态
- 扫码或手动输入编号发起充电
- 查看月度充电记录

充值目前仍需在官方 App 中完成。网页端主要负责“查”和“用”，避免把充值做成一个看起来能点、实际上付不通的入口。

## 适合谁用

- 想给自己或身边同学部署一个更顺手的手机网页入口
- 主要使用 iPhone，希望减少对官方 App 的依赖
- 想在浏览器里快速看哪里有空位、余额够不够、当前是不是在充电

## 功能说明

### 网页中可完成

- 账号登录
- 余额查询
- 当前充电状态查询
- 地点与充电桩状态查看
- 扫码充电
- 手动输入编号充电
- 月度记录查询

### 仍需官方 App 完成

- 充值
- 依赖官方支付流程的操作

## 快速开始

环境要求：

- Node.js 18+

安装依赖：

```sh
npm install
```

复制环境变量模板：

```sh
cp .env.example .env
```

启动服务：

```sh
npm start
```

默认地址：

- 本机开发：`http://127.0.0.1:8787`
- 如果要对外访问，可将 `.env` 中的 `HOST` 改成 `0.0.0.0`

## 常用命令

```sh
npm start
npm run dev
npm run check
```

## 运行时配置

服务会自动读取根目录下的 `.env`。

常用配置项：

| Key | Default | 说明 |
| --- | --- | --- |
| `APP_NAME` | `CampusLifeForCharging Web` | 页面与服务显示名称 |
| `HOST` | `127.0.0.1` | 监听地址 |
| `PORT` | `8787` | 监听端口 |
| `SESSION_FILE` | `data/sessions.json` | 会话持久化文件 |
| `REQUEST_TIMEOUT_MS` | `20000` | 请求官方服务的超时时间 |

## 部署建议

- 建议部署在自己的服务器上，通过公网 IP 或域名访问
- 生产环境建议使用 Nginx / Caddy 反向代理，并启用 HTTPS
- 如果使用容器，请把 `data/` 挂到持久化存储，避免会话丢失
- 可使用 `GET /api/health` 做健康检查

示例：

```sh
curl http://127.0.0.1:8787/api/health
```

## 项目结构

- `public/`：静态前端页面
- `server/`：Node HTTP 服务与官方接口代理
- `.env.example`：运行配置模板

## 已知限制

- 充值仍需回到官方 App 完成
- 某些浏览器不支持网页扫码，此时请手动输入编号
- 地点页会展示逐桩状态，数据量较大时刷新可能稍慢

## 反馈

- 源码仓库：<https://github.com/JfanLiu/CampusLifeForCharging>
- 问题反馈：<https://github.com/JfanLiu/CampusLifeForCharging/issues>

## 参考项目

本项目基于对校园充电协议的兼容实现继续演化而来，Web 方案参考并继承了原始项目的部分思路：

- AltCampusLife: <https://github.com/creeper12356/AltCampusLife>

当前这个公开分支已经整理成纯 Web 结构，不再包含 Android / iOS 工程。
