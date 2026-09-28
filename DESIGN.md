---
name: 热创星
description: 面向热处理厂全员改善、三级审核与季度评优的企业微信小程序
colors:
  primary: "#B93C28"
  primary-deep: "#922D20"
  ink: "#20262D"
  ink-soft: "#5F666B"
  canvas: "#F3F2EE"
  surface: "#FBFAF7"
  line: "#DEDDD7"
  success: "#287253"
  warning: "#9F6A1F"
  danger: "#AA3424"
  info: "#375F76"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.3
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  status-success:
    backgroundColor: "#E5F1EA"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "23px"
---

# Design System: 热创星

## Overview

**Creative North Star: "厂区改善看板"**

热创星像一块被带进手机的厂区晨会看板：明亮、可靠、信息边界清楚。使用者可能站在强光和噪声环境中，单手完成拍照、提报或审核，因此界面采用浅色底、深色正文、克制的安全红动作色和明确的状态文字。

设计服务于任务。真实改善证据、审核范围和规则结果必须比品牌装饰更突出；页面使用熟悉的移动端导航、表单和列表，不为制造新奇而改变标准操作。

**Key Characteristics:**

- 高对比、浅色、适合明亮厂区
- 真实现场照片优先，前后证据并列
- 一套 Tabler 线性图标贯穿所有页面
- 安全红只用于主动作、当前选择和关键状态
- 44px 等效最小触控高度，短促状态反馈

## Colors

以带暖意的灰白表面承载长时间阅读，以氧化红表达行动，以钢蓝、绿色和琥珀色区分信息与状态。

### Primary

- **氧化安全红**：只用于主按钮、当前选择和品牌标记；它代表“采取行动”，不作大面积装饰。
- **深氧化红**：用于按下态、危险操作确认和高对比文字。

### Secondary

- **设备钢蓝**：用于精益类型、信息提示和非紧急数据层级。

### Neutral

- **炉体墨灰**：标题、正文和重要数值。
- **工位纸白**：卡片、表单和固定操作栏。
- **厂区暖灰**：页面底色，减少纯白眩光。
- **分隔灰**：边框、分隔线和输入框轮廓。

### Named Rules

**The Action Red Rule.** 同一屏内氧化红只服务一个主动作与少量当前状态，禁止把所有图标和标题染红。

**The State Has Words Rule.** 成功、待审、驳回和熔断必须同时出现文字与颜色，禁止只靠色相区分。

## Typography

**Display Font:** 系统无衬线字体栈
**Body Font:** 系统无衬线字体栈

**Character:** 中文系统字体在微信中加载稳定、字形熟悉，适合工厂一线快速扫读。所有数值启用等宽数字特性，方便对齐积分、金额和排名。

### Hierarchy

- **Headline**（800，20px，1.3）：首页主张与页面关键结论。
- **Title**（700，16px，1.35）：分区标题、提案名称和管理项名称。
- **Body**（400，14px，1.65）：说明、问题描述和改善措施，长段落控制在约 70 个中文字符的视觉宽度内。
- **Label**（600，12px，1.4）：字段标签、类型、状态和辅助元数据。

### Named Rules

**The One Family Rule.** 按钮、标签、数据与正文统一使用系统无衬线字体；禁止在产品界面中加入展示字体。

## Elevation

系统默认无阴影，通过暖灰画布、纸白表面和 1px 分隔线建立层级。固定底部操作栏可使用接近不透明的纸白背景；浮层只在删除、提交和不可逆审核确认时出现。

### Named Rules

**The Flat Factory Rule.** 静止表面保持平整；如果一个区域必须靠浓重阴影才能被理解，其信息层级需要重新组织。

## Components

### Buttons

- **Shape:** 稳定的中等圆角（12px），主要触控高度 44px。
- **Primary:** 氧化安全红底、工位纸白字，单屏只保留一个主要提交动作。
- **Hover / Focus:** 180ms 以内的透明度与轻微缩放反馈；键盘焦点使用完整轮廓，不移动布局。
- **Secondary:** 工位纸白底、分隔灰轮廓、炉体墨灰文字。

### Chips

- **Style:** 未选中为暖灰底与灰色轮廓；选中后使用浅红底、深红字和红色轮廓。
- **State:** 用于类型、层级、范围和筛选，不替代主按钮。

### Cards / Containers

- **Corner Style:** 主要容器 12px，重点图像或首页入口 16px。
- **Background:** 工位纸白；大列表优先使用一个完整容器加行分隔，不把每一行做成独立卡片。
- **Shadow Strategy:** 无阴影，使用色阶和 1px 轮廓。
- **Internal Padding:** 12px 至 16px，随信息密度变化。

### Inputs / Fields

- **Style:** 纸白底、1px 灰色轮廓、12px 圆角、44px 最小高度。
- **Focus:** 轮廓切换为安全红，不改变控件尺寸。
- **Error / Disabled:** 错误使用文字说明和浅红背景；禁用态降低对比但保持标签可读。

### Navigation

顶部栏使用居中标题与明确返回按钮；底部四项固定导航只承载首页、提案、积分和我的。当前项同时改变文字颜色与图标色调，后台子模块通过首页或我的进入。

### Photo Evidence Pair

改善详情将“改善前 / 改善后”置于同一信息层级。系统截图使用 contain 保留坐标和控件，现场照片使用 aspect-fill；点击始终可预览原图。

## Do's and Don'ts

### Do:

- **Do** 优先展示真实现场照片、真实组织名称和可追溯编号。
- **Do** 让拍照、保存草稿、提交、采纳与驳回在单手拇指可达区域完成。
- **Do** 在审核列表持续显示“热一组 / 生产工段 / 全厂”等权限范围。
- **Do** 为星级积分、候选门槛和移交结果展示文字依据。
- **Do** 使用同一套 Tabler 2px 线性图标，并保留 MIT 许可文件。

### Don't:

- **Don't** 出现默认 uni-app 模板感、通用后台拼装感和营销落地页式夸张包装。
- **Don't** 使用占位图、与业务无关的图库照片、卡通插画和卡通图标。
- **Don't** 混用图标家族、滥用渐变、玻璃拟态、霓虹色和无意义动效。
- **Don't** 把复杂流程藏在层层弹窗中，或依赖颜色作为状态的唯一提示。
- **Don't** 伪造来源；Excel 未包含的提案、积分和评优数据必须作为静态演示数据。
- **Don't** 使用彩色粗侧边条、渐变文字、嵌套卡片或大面积纯黑纯白。
