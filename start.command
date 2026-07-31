#!/bin/zsh
set -u
cd -- "$(dirname "$0")"
clear
printf '\n画境观屿 · Nebula Capsules\n'
printf '正在启动本地预览……\n\n'

if ! command -v node >/dev/null 2>&1; then
  printf '未检测到 Node.js。请先安装 Node.js 18 或更高版本。\n'
  printf '安装后重新运行 start.command。\n\n'
  read -k 1 '?按任意键关闭窗口……'
  exit 1
fi

node scripts/serve.mjs
status=$?
printf '\n服务已停止，退出码：%s\n' "$status"
read -k 1 '?按任意键关闭窗口……'
exit "$status"
