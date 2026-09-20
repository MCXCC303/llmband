# LLMBand 手环端快应用

模板驱动的多供应商用量看板。只依赖快照 v2 的通用组件树(widgets)渲染,
不感知任何具体供应商;供应商内容完全由插件端预设模板决定。

**手环侧预设套接**:框架只提供样式/排版约束(`common/theme.js`)与组件渲染注册表
(`common/widgets.js`);开发者在 `src/presets/registry.js` 登记显示方式,即插即用。
规范见 `../docs/BAND_PRESETS.md`。

## 开发 / 构建

``bash
npm install
npm run start     # 开发(watch)
npm run build     # 构建(产物在 build/)
npm run release   # 打包 rpk
``

## 结构

``
src/
├── manifest.json            # package: io.github.mcxcc303.llmband
├── app.ux                   # 全局配置(mock/snapshotUrl/transport)
├── presets/registry.js      # 手环端预设套接(开发者登记显示方式)
├── pages/dashboard/         # 表盘页:时钟(沿用原项目)+ swiper 每供应商一页 + widgets 通用渲染
└── common/
    ├── snapshot.js          # 快照 v2 校验(含 series/display 透传)
    ├── theme.js             # 框架样式/排版约束目录(三层合并:默认<快照 display<registry)
    ├── widgets.js           # 组件渲染注册表(balance/kv/bar/ring/bars/note)
    ├── clock-arc.js         # 弧形时钟(窄屏;宽屏用平面时钟)
    ├── pricing.js           # 峰谷时段 → 时钟配色(沿用原项目)
    ├── interconnect-client.js / http-client.js / mock-client.js
    └── cache.js / sync-config.js / screen.js
``

## 快照契约

`v: 2`,`providers[]` 每项含 `status / balance / display / widgets[]`,
widgets 按 `type` 渲染:`balance(大字) / kv(键值行) / bar(进度条) / ring(弧形环) / bars(多日柱状图) / note(提示)`。
契约定义见 `../wasm/core/src/snapshot.rs`。
