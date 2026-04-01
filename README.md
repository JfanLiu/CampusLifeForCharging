# AltCampusLife 
> 东晟校园生活开源优化版

## 📝介绍
AltCampusLife是一个开源的电动车充电客户端App，与东晟校园生活完全兼容，支持Android, iOS（准备上架AppStore🍎）。

![ic_launcher](https://github.com/user-attachments/assets/b1cfe3a4-8e45-4ceb-a8eb-dfe4af9f2afc)

- 🤗集成扫码、充电、充值于一个页面，简单易用
- 📷支持扫码充电，且可开启闪光灯
- 🛜任何网络环境下均可使用，无需SJTU校园网
- 👨‍💻除了涉及服务端具体API的代码之外，完全开源，功能可拓展定制


## 📥安装
### Android
Android apk可以从 https://github.com/creeper12356/AltCampusLife/releases 下载
### iOS
iOS 版本不能在 Windows 上直接构建，需要使用 macOS + Xcode。

如果只是安装到自己的 iPhone 上进行测试，可以在 Xcode 中使用个人 Apple ID 签名后直接安装到真机。

如果要分发给其他人长期安装，则通常需要 Apple Developer Program，并通过 TestFlight / App Store 发布。
## ⚙从源代码运行
### Web
#### 环境配置
- Node.js 18+

#### 调试运行
在项目根目录下执行：
```sh
npm run web:install
npm run web:start
```

默认会在 `http://localhost:8787` 启动 Web 服务。
也可以直接进入 `web/` 目录运行；独立说明见 `web/README.md`。

#### 部署说明
- `web/` 是独立目录，不依赖 React Native 的 Metro 或原生编译环境
- Node 服务会同时提供静态前端页面和 `/api/*` 代理接口
- 生产环境建议通过 Nginx / Caddy 反向代理到该 Node 进程，并启用 HTTPS
- `web/.env.example` 提供了独立运行时配置模板，服务会自动读取 `web/.env`
- 当前会话默认会持久化到 `web/data/sessions.json`，服务重启后会自动恢复未过期会话

#### 功能覆盖
- 登录、余额查询、充电状态查询
- 所有地点的充电状态总览
- 所有地点下每一根充电桩的当前状态（空闲、充电中、故障）
- 手动输入二维码充电
- 浏览器扫码充电（优先使用浏览器内置条码识别能力）
- 充值入口、月度记录查询、价格信息、电表信息、用户消息、充电列表

#### 已知限制
- 浏览器扫码依赖 `BarcodeDetector`，部分浏览器只能退回手动输入
- 现有充值接口返回的是 `alipay.trade.app.pay` 类型的 App 支付订单；原版客户端通过 Alipay SDK 完成支付，这类订单无法在纯 Web 中稳定完成付款
- 若要实现真正的 Web 充值，需要上游改为返回 `alipay.trade.wap.pay` 或其他网页支付链路
- 逐桩状态依赖隐藏接口 `getsublist(rid)`，页面加载会比仅看地点汇总更慢一些
- 若部署在容器中，应将 `web/data/` 挂载到持久化存储，否则容器重建后仍会丢失会话

### Android
#### 环境配置
##### 安装Node.js
从[官网](https://nodejs.org/en/download/package-manager)下载Node.js并安装。
##### 安装Java Development Kit
JDK可以选择[OracleJDK](https://www.oracle.com/in/java/technologies/downloads/)或[OpenJDK](https://openjdk.org/)，React Native官方推荐JDK17。
##### 配置Android开发环境
配置Android开发环境需要安装[Android Studio](https://developer.android.com/studio)，安装了Android Studio之后需要下载安装：
- Android SDK
- Android SDK Platform
- Android NDK
- Android Virtual Device(AVD)
具体的配置过程因开发操作系统和版本而不同，具体教程可以参考: https://reactnative.dev/docs/set-up-your-environment#installing-dependencies

#### 调试运行
在项目根目录下执行：
```sh
npm i
npm start
```
执行`npm start`后会出现Metro的LOGO界面和四个选项：
```sh
i - run on iOS
a - run on Android
d - open Dev Menu
r - reload app
```
键入`a`后，如果环境配置正确，将启动Android虚拟机，并在虚拟机上运行应用。此外，Metro服务器支持对于JavaScript/TypeScript代码的热更新，即修改代码后保存即可生效，在虚拟机中看到修改代码后的结果。

#### 构建Android apk 
在项目根目录下执行以下命令以构建Android安装包（不含签名证书）
```sh
npm i
# 将React Native代码打包到Android应用中
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
# 生成apk文件
cd android/
./gradlew assembleRelease 
```
注：在Windows中，最后一步需要使用`./gradlew.bat`脚本，而不是`./gradlew`。
构建后的apk文件位于`android/app/build/outputs/apk/release`目录。

### iOS
#### 环境配置
- macOS
- Xcode
- Node.js 18+
- CocoaPods

#### 调试运行
在项目根目录下执行：
```sh
npm i
cd ios
pod install
```

执行完成后，使用 Xcode 打开 `ios/AltCampusLife.xcworkspace`，然后：
- 在 `Signing & Capabilities` 中选择自己的 Team
- 将 Bundle Identifier 改成你自己的唯一包名
- 连接 iPhone 后选择真机运行

#### 说明
- 当前仓库已经包含 iOS 原生工程目录 `ios/`
- 如果只是本机测试安装，不一定要先上架 App Store
- 支付等原生能力是否完全可用，还需要在真机上进一步验证

## 🎉致谢
向在本项目开发过程中提供支持的工具/软件表示感谢：
- [Visual Studio Code](https://code.visualstudio.com/)
- [JADX](https://github.com/skylot/jadx)
- [抓包精灵](https://github.com/huolizhuminh/NetWorkPacketCapture)
- [easyappicon](https://easyappicon.com/)
- [Apifox](https://apifox.com/)
- [HTML Color Picker](https://www.w3schools.com/colors/colors_picker.asp)
- ChatGPT & Copilot
- ...
