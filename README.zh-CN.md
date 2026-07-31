# 画境观屿 · Nebula Capsules（星云胶囊）

一个零运行时依赖的 WebGL 开源视觉项目。胶囊左侧保留奶油白文字区域，右侧实时生成宇宙星云、流体颜色与星尘。

![Nebula Capsules 预览](assets/preview.svg)

## 最简单的本地启动方式

### macOS

解压后，双击项目根目录中的：

```text
start.command
```

程序会自动寻找可用端口并打开浏览器。第一次运行若被 macOS 阻止，可右键 `start.command`，选择“打开”。

### Windows

双击：

```text
start-windows.bat
```

### 使用终端

```bash
cd nebula-capsules
npm start
```

浏览器会自动打开。默认从 `4173` 端口开始；若端口已占用，程序会自动尝试 `4174`、`4175` 等端口。

> 不要直接双击 `index.html`。项目使用 JavaScript ES Modules，必须通过本地 HTTP 服务运行。

## 运行要求

- Node.js 18 或更高版本
- Chrome、Safari、Edge 或 Firefox 的现代版本
- 推荐启用 WebGL2；不支持时自动使用 Canvas 2D 降级效果

## 检查与测试

```bash
npm run check
npm test
```

## 自定义颜色

打开 `src/presets.js`，修改任意预设的 `colors`、`seed` 和 `speed`。

## 开源协议

MIT License，允许个人和商业项目使用、修改与再发布，但需保留版权与许可声明。
