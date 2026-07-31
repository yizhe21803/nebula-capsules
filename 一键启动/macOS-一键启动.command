#!/bin/bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

wait_before_exit() {
  echo
  read -r -p "按回车键关闭此窗口……" _
}

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js。"
  echo "请先安装 Node.js 18 或更高版本，然后重新双击本文件。"
  wait_before_exit
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "当前 Node.js 版本过低：$(node -v)"
  echo "请升级到 Node.js 18 或更高版本。"
  wait_before_exit
  exit 1
fi

echo "正在启动：画境观屿 · 宇宙胶囊"
echo "浏览器将自动打开。运行期间请保留此终端窗口。"
echo "停止服务：在此窗口按 Control + C。"
echo

node scripts/serve.mjs
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo
  echo "启动失败，退出代码：$STATUS"
  wait_before_exit
fi

exit "$STATUS"
