## Entities / Schemas

- Session：当前浏览器会话，绑定 `userid`
- UpstreamOrder：发送给上游接口的业务请求体
- UpstreamResponse：上游返回并解密后的 JSON 结构
- PayLaunch：Web 端可执行的支付启动信息

## Contracts (API)

### `GET /api/session`

返回当前登录状态。

示例响应：

```json
{
  "loggedIn": true,
  "userid": 123456
}
```

### `POST /api/login`

请求体：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| username | string | 是 | 非空 | 对应原接口 `phone` |
| password | string | 是 | 非空 | 对应原接口 `logpass` |

示例请求：

```json
{
  "username": "13800138000",
  "password": "secret"
}
```

示例响应：

```json
{
  "loggedIn": true,
  "userid": 123456,
  "profile": {
    "username": "13800138000",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.png"
  }
}
```

### `POST /api/logout`

清理当前会话。

示例响应：

```json
{
  "ok": true
}
```

### `GET /api/account`

读取账户信息。

示例响应：

```json
{
  "acbalance": "12.50元",
  "acid": 0
}
```

### `GET /api/bootstrap`

返回当前会话下首页所需的聚合数据。

示例响应：

```json
{
  "session": {
    "loggedIn": true,
    "userid": 123456
  },
  "account": {},
  "chargeStatus": {},
  "priceInfo": {},
  "records": [],
  "stations": {
    "granularity": "pile-detail",
    "note": "当前页面通过 getlist 获取地点汇总，再通过 getsublist(rid) 获取该地点下每一根充电桩的状态。",
    "locations": [],
    "totals": {
      "locationCount": 20,
      "chargingCount": 165,
      "freeCount": 12,
      "errorCount": 248,
      "totalCount": 425
    }
  },
  "recordMonth": {
    "yy": "2026",
    "mm": "03"
  }
}
```

### `GET /api/charge-status`

读取当前充电状态。

示例响应：

```json
{
  "charging": false,
  "raw": {
    "state": "0"
  }
}
```

### `POST /api/charge`

请求体：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| qrcode | string | 是 | 仅数字，长度 1-32 | Web 端传字符串，服务端转数字 |

示例请求：

```json
{
  "qrcode": "12345678"
}
```

示例响应：

```json
{
  "note": "充电成功",
  "data": {
    "result1": [
      {}
    ]
  }
}
```

### `GET /api/price-info`

读取价格信息。

### `GET /api/jacount`

读取电表信息。

### `GET /api/charge-list`

读取充电列表。

### `GET /api/stations`

读取地点状态总览和逐桩状态。

示例响应：

```json
{
  "granularity": "pile-detail",
  "note": "当前页面通过 getlist 获取地点汇总，再通过 getsublist(rid) 获取该地点下每一根充电桩的状态。",
  "locations": [
    {
      "rid": "359",
      "rname": "交大闵行-材料D楼（能源楼）",
      "chargingCount": 9,
      "freeCount": 1,
      "errorCount": 2,
      "totalCount": 12,
      "hasFree": true,
      "statusCode": "available",
      "statusLabel": "有空闲，可充电",
      "piles": [
        {
          "name": "材料D楼-01左#",
          "status": "空闲",
          "note": "空闲",
          "statusCode": "available",
          "statusLabel": "空闲"
        }
      ]
    }
  ],
  "totals": {
    "locationCount": 20,
    "chargingCount": 165,
    "freeCount": 12,
    "errorCount": 248,
    "totalCount": 425
  }
}
```

### `GET /api/charge-records?yy=2026&mm=03`

读取充电记录。

查询参数：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| yy | string | 是 | 四位年份 | |
| mm | string | 是 | 两位月份 | |

### `POST /api/pay/apply`

请求体：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| amount | number | 是 | 大于 0 | 充值金额 |

示例响应：

```json
{
  "raw": {
    "orderinfo": "app_id=...&biz_content=..."
  },
  "launch": {
    "orderInfo": "app_id=...&biz_content=...",
    "formFields": {
      "app_id": "...",
      "method": "alipay.trade.app.pay"
    },
    "gatewayUrl": "https://openapi.alipay.com/gateway.do",
    "queryUrl": "https://openapi.alipay.com/gateway.do?...",
    "method": "alipay.trade.app.pay",
    "productCode": "QUICK_MSECURITY_PAY",
    "strategy": "app-order-string",
    "message": "当前上游返回的是 App 支付签名串。Web 端将改用表单 POST 提交到支付宝网关并在移动端尝试拉起支付宝，但兼容性仍取决于设备、浏览器和支付宝客户端。"
  }
}
```

### `POST /api/pay/return`

请求体：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| returnContent | string | 是 | JSON 字符串或对象序列化结果 | 对应原接口 `returncontent` |

示例请求：

```json
{
  "returnContent": "{\"resultStatus\":\"9000\"}"
}
```

### `POST /api/message`

使用当前会话中的用户名和手机号读取用户消息。

示例响应：

```json
{
  "title": "...",
  "content": "..."
}
```

## Upstream Request Model

统一以 `order=<DES加密后的JSON字符串>` 形式 POST 到上游。

公共字段约束：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| ordertype | string | 是 | 非空 | 业务动作 |
| origin | string | 否 | 通常为 `cloud` | 原协议字段 |
| userid | number | 视接口而定 | 必须已登录 | 服务端自动注入 |

## Upstream Response Model

上游返回 XML，解出 `string.#text` 后得到 JSON 文本。

最小约束：

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| state | string | 是 | `"1"` 为成功 | |
| note | string | 否 | 失败时通常存在 | |
| data | object | 否 | 业务数据 | |

## Invariants

- 未登录时不得调用需要 `userid` 的接口
- `docharge` 在 Web 端必须传数值型二维码
- `payapply` 若金额小于 1.5，应在服务端提前拒绝
- 服务端不向浏览器暴露上游 DES 密钥实现细节以外的可变会话状态
- 支付流程兼容性取决于上游返回的 `orderInfo` 类型；当前默认视为 App 支付签名串
- 地点状态总览基于 `getlist` + `getsublist(rid)` 组合构建
- 浏览器扫码优先依赖 `BarcodeDetector`；不支持时保留手动输入作为退化路径

## Compatibility Notes

- Web 版新增的是 HTTP/JSON API，不影响原 React Native 逻辑
- 充值接口在 Web 中为兼容实现；若上游未来支持 WAP 支付，可保持前端 API 不变，仅替换服务端策略
