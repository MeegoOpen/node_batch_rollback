# Node Operator Standalone

一个基于 Gin 的服务，提供节点操作配置的保存/查询能力，以及到飞书项目平台的反向代理。已将所有接口的响应结构统一为 `code/data/msg`。

## 特性
- 统一响应结构：`{"code": 0|1, "data": any, "msg": ""|error}`
- 原生 CORS 支持（与路由中间件一致）
- 反向代理到 `https://project.feishu.cn`，自动注入 `X-Plugin-Token`
- 提供精简版子工程 `proxy_only/`，仅保留代理与 CORS 能力

## 统一响应规范
- 成功：`code=0`，`msg=""`，`data`为真实返回数据（结构体或数组），当无数据时为空对象 `{}`。
- 失败：`code=1`，`msg`为错误信息，`data`为 `{}`。
- HTTP 状态码：保留原有使用习惯（参数错误返回 400，服务错误返回 500 等）。如需统一为 200，可在 `JSONError` 中调整。

示例：

```json
// 成功
{
  "code": 0,
  "data": { "project_key": "demo", "list": [] },
  "msg": ""
}

// 失败
{
  "code": 1,
  "data": {},
  "msg": "project_key is required"
}
```

## CORS 配置
服务在路由中维护了统一的 CORS 头：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, x-user-key,locale`
- `Access-Control-Expose-Headers: Content-Length`
- `Access-Control-Allow-Credentials: true`

`OPTIONS` 请求将直接返回 `204`。

## 目录结构
- `cmd/server/main.go`：主服务入口
- `configs/config.yaml`：服务与数据库配置
- `internal/handler/`：HTTP 路由与处理器（含统一响应封装）
- `internal/service/`：业务服务层
- `internal/dao/`：数据访问层
- `internal/model/`：数据模型
- `pkg/config/`：配置加载
- `pkg/database/`：数据库初始化
- `proxy_only/`：精简仅代理的子工程

## 配置与启动
1) 配置文件 `configs/config.yaml`（默认使用 sqlite 数据库）：

```yaml
server:
  port: 8081

database:
  driver: "sqlite"
  dbname: "node_operator.db"

feishu:
  api_host: "https://project.feishu.cn"
  plugin_id: "<your-plugin-id>"
  plugin_secret: "<your-plugin-secret>"
```

2) 构建与运行：
- `go build -o node_operator_standalone cmd/server/main.go`
- `./node_operator_standalone`
- 或使用脚本：`./scripts/run.sh`

数据库首次运行会自动进行模型迁移（`internal/model`）。

## 接口说明

### 保存配置
- `POST /api/v1/node-operator/settings`
- 请求体：
```json
{
  "project_key": "demo",
  "list": [ { "field_name": "name", "field_value": "value" } ],
  "user_key": "u1",
  "tenant_key": "t1"
}
```
- 响应：`{"code":0,"data":{},"msg":""}`

### 查询配置
- `GET /api/v1/node-operator/settings?project_key=demo`
- 响应：
```json
{
  "code": 0,
  "data": {
    "project_key": "demo",
    "list": [
      {"field_name":"name","field_value":"value"}
    ]
  },
  "msg": ""
}
```

### 反向代理
- `ANY /proxy/*path`
- 行为：将请求转发到 `https://project.feishu.cn/*path`，若飞书 token 获取成功，将在请求头注入 `X-Plugin-Token: <token>`。
- 注意：被代理服务的响应不做结构改造，保持原样直通；本服务内部错误会按统一结构返回。

## 子工程：proxy_only
一个最小化的 Gin 工程，仅保留代理与 CORS。

- 路径：`proxy_only/`
- 环境变量：
  - `PORT`（默认 `8080`）
  - `PROXY_TARGET`（默认 `https://project.feishu.cn`）
  - `FEISHU_API_HOST`（默认 `https://project.feishu.cn`）
  - `FEISHU_PLUGIN_ID` / `FEISHU_PLUGIN_SECRET`（可选，用于获取 Token）
- 构建与运行：
  - `cd proxy_only && go mod tidy`
  - `go build -o proxy_only_server cmd/server/main.go`
  - `./proxy_only_server`

示例请求：

```bash
curl -i "http://localhost:8080/proxy/open_api/your_path"
```

## 常见问题
- Token 获取失败：检查 `FEISHU_PLUGIN_ID/SECRET` 是否正确，网络是否可达。
- 数据库错误：确认 `configs/config.yaml` 的数据库配置，sqlite 文件是否有权限。
- 代理 4xx/5xx：通常是下游服务返回，查看被代理服务的响应详情。

