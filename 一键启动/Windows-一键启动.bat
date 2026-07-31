@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0\.."

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  echo 请先安装 Node.js 18 或更高版本，然后重新双击本文件。
  echo.
  pause
  exit /b 1
)

for /f %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 (
  echo 当前 Node.js 版本过低：
  node -v
  echo 请升级到 Node.js 18 或更高版本。
  echo.
  pause
  exit /b 1
)

echo 正在启动：画境观屿 · 宇宙胶囊
echo 浏览器将自动打开。运行期间请保留此窗口。
echo 停止服务：关闭此窗口，或按 Ctrl+C。
echo.

node scripts\serve.mjs
if errorlevel 1 (
  echo.
  echo 启动失败。
  pause
)

endlocal
