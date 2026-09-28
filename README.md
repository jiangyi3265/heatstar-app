# heatstar-app

热创星员工端，用于现场人员提交改善提案、跟踪审核、参与积分评优和查看个人数据。

## 项目简介

本仓库是热创星全员持续改善平台的员工端前端。它基于原 uni-app 工程中的移动端页面拆分而来，面向一线员工、班组长、评审员和参与评优人员，支持精益提案、六源改善、工具开发、OPL 单点课程提交，改善前后照片上传，审核待办处理，积分榜、分享会、候选名单和评优结果查看。

## 技术栈

- Vue 3
- uni-app
- Vite
- JavaScript
- H5
- 微信小程序构建目标
- Tabler Icons SVG 资源
- 通过 `heatstar-backend` 提供的 REST API 同步业务数据

## 关联仓库

| 项目 | 说明 | GitHub |
| --- | --- | --- |
| heatstar-backend | 后端服务 | [heatstar-backend](https://github.com/jiangyi3265/heatstar-backend) |
| heatstar-admin | 管理后台 | [heatstar-admin](https://github.com/jiangyi3265/heatstar-admin) |
| heatstar-app | 员工端 | [heatstar-app](https://github.com/jiangyi3265/heatstar-app) |

## 快速启动

先启动 `heatstar-backend`，再运行员工端：

```bash
pnpm install
pnpm dev:h5
```

构建微信小程序包：

```bash
pnpm dev:mp-weixin
```

本地 H5 会自动连接 `http://127.0.0.1:8765/api`。发布微信小程序前，需要在 `manifest.json` 填写正式 AppID，并在微信公众平台配置后端 API 域名。

## 项目结构

- `pages/index/`：员工端首页和快捷入口。
- `pages/proposal/`：提案类型选择、表单、列表和详情。
- `pages/review/`：班组长、评审员相关审核待办与详情。
- `pages/points/`：积分榜、分享会、候选名单和评优结果。
- `pages/profile/`：个人中心、登录状态和个人操作入口。
- `pages/admin/notices.vue`、`pages/admin/export.vue`：员工端复用的公告与个人导出页面。
- `components/`、`utils/`、`static/`：通用组件、业务工具和静态素材。

## 简历描述示例

参与热创星员工端开发，完成现场提案提交、照片证据上传、审核待办、积分评优和个人中心等移动端业务功能，并通过 uni-app 同时支持 H5 与微信小程序场景。
