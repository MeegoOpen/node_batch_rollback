# Feishu Project App Node Batch Rollback

一个基于 Lark Project CLI 的前端插件项目，用于在工作项页面提供“批量驳回”等批处理能力，同时支持配置化管理和 PC / 移动端入口。

## 功能概览
- 批量驳回：在工作项上下文中选择多个节点并统一驳回（`features/opt`、`features/optWeb`）。
- 配置管理：为不同工作项类型配置“驳回记录字段”及字段映射（`features/config`）。
- 半 UI 化：组件逐步替换为 `@douyinfe/semi-ui`（Tooltip、Spin、Skeleton、Checkbox、Row、Col、Form 等）。

## 技术栈
- React 18、TypeScript（TSConfig 已配置）
- `@douyinfe/semi-ui` 组件库
- Lark Project CLI（开发服务器、调试二维码）
- Axios / Lodash / Moment

## 目录结构
```text
├── config/                # 项目配置
│   ├── env-config.json
│   └── plugin-base.config.json
├── plugin.config.json     # 页面入口与资源配置
├── src/
│   ├── api/               # 服务与接口封装
│   │   ├── services.ts
│   │   ├── request.tsx
│   │   └── index.tsx
│   ├── features/          # 功能模块
│   │   ├── config/        # 配置页面（含 WorkObjectTask、conf 等）
│   │   ├── opt/           # PC 端批量驳回页面（渲染 <OptForm from="pc" />）
│   │   └── optWeb/        # 移动端批量驳回入口（设置存储为 mobile 并渲染 <OptForm from="mobile" />）
│   ├── sdk.tsx            # 与 Lark/Meego 侧 SDK 交互
│   └── utils/             # 工具方法（上下文、存储等）
```

## 快速开始
### 环境要求
- Node.js 16+（推荐 18+）
- npm（或可使用 yarn/pnpm，但脚本以 npm 为主）

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
# 使用 node 脚本启动（推荐）
npm run dev

# 或使用 CLI 直接启动（需要本地安装 lpm）
npm run dev2
```

启动成功后，终端会展示一个二维码：
- 使用 Lark App 扫码即可在 App 内调试插件。
- 本地预览地址为 `https://localhost:3339/`（开发服务器已安装并信任本地 CA 证书）。

## 页面入口（plugin.config.json）
`plugin.config.json` 的 `resources` 字段声明了构建入口：
- `button_batch_opt_mobile` → `./src/features/optWeb/index.tsx`
- `button_batch_opt_pc` → `./src/features/opt/index.tsx`
- `config_batch_opt_web` → `./src/features/config/index.tsx`

其中：
- `opt/index.tsx` 渲染 `<OptForm from="pc" />`。
- `optWeb/index.tsx` 在渲染前设置设备类型为 `mobile`，并渲染 `<OptForm from="mobile" />`。
- `config/index.tsx` 加载 SDK 上下文并渲染配置页面。

## 关键模块说明
- `features/opt/form.tsx`
  - 主体表单组件 `OptForm`，包含节点选择、全选、提交/取消等交互。
  - 使用 `FormApi`（`@douyinfe/semi-ui/lib/es/form`）管理表单校验与重置。
  - 使用 `Spin`/`Skeleton` 控制加载态；`Checkbox.Group` 展示节点列表；`Row`/`Col` 布局。
  - 移动端与 PC 端通过 `from` 属性区分样式和按钮布局。

- `features/config/WorkObjectTask.tsx`
  - 负责加载空间、工作对象、字段列表，并为配置页提供“驳回记录字段”和字段映射选择。
  - 使用 `ArrayField` 管理配置项列表；`Tooltip` 提示文案；`IconDelete`/`IconPlusCircle` 操作卡片。

- `src/api/services.ts`
  - `getFieldsList`、`getWorkItemFieldDetail`、`updateChangeField`、`submitNodeRollback` 等 API 封装。


## 点位说明
配置点位，节点-更多点位，节点流转点位



