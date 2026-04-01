# CampusLifeForCharging

给平时主用苹果手机的用户提供一个更方便的校园充电网页入口。

## 使用方式

1. 先准备一台安卓手机，安装官方 App，在官方 App 里注册账号并完成充值。
2. 对于平时主用 iPhone、又不想随身带安卓手机的用户，可以直接用苹果手机浏览器访问你部署好的服务网址。
3. 在网页里完成日常使用：登录、查看状态、扫码或输入编号发起充电。
4. 充值仍回到官方 App 完成。

## 部署

需要 Node.js 18+。

```sh
npm install
cp .env.example .env
npm start
```

默认访问地址是 `http://127.0.0.1:8787`。如果需要公网访问，把 `.env` 里的 `HOST` 改成 `0.0.0.0`。

## 反馈

- 源码仓库：<https://github.com/JfanLiu/CampusLifeForCharging>
- 问题反馈：<https://github.com/JfanLiu/CampusLifeForCharging/issues>

## 参考项目

- AltCampusLife: <https://github.com/creeper12356/AltCampusLife>
