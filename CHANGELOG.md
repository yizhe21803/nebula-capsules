# Changelog

## 1.1.2 - 2026-08-01

- 胶囊内宇宙动效改为页面载入后自动播放，无需点击触发。
- 自动引力轨迹持续驱动星云流动；鼠标与触摸仅临时增强互动。
- 系统启用“减少动态效果”时改为低幅度慢速播放，不再完全静止。
- 保留全局暂停按钮与离屏渲染暂停。

## 1.1.1 - 2026-08-01

- 修复默认 4173 端口被占用时服务直接崩溃的问题。
- 启动时自动寻找后续可用端口并打开浏览器。
- 新增 macOS `start.command` 与 Windows `start-windows.bat` 一键启动文件。
- 明确禁止直接通过 `file://` 打开 `index.html`。
- Node.js 最低版本调整为 18。

## 1.1.0 - 2026-07-31

- 按参考界面重构胶囊：左侧固定奶油白留白信息区，右侧实时宇宙材质。
- 所有核心品牌文字替换为“画境观屿”。
- 新增胶囊右上角微型圆点控件与柔和材质过渡。
- 保留桌面双列、移动端单列和沉浸式预览。

## 1.0.0 - 2026-07-31

- Initial open-source release.
- Added six WebGL cosmic-fluid presets.
- Added pointer and touch gravity interaction.
- Added full-screen viewer and randomization control.
- Added responsive layout, reduced-motion handling, off-screen rendering pause, and Canvas 2D fallback.
- Added tests, documentation, issue templates, MIT license, and GitHub Pages workflow.
