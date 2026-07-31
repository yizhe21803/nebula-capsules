@echo off
cd /d "%~dp0"
echo.
echo 画境观屿 - Nebula Capsules
echo 正在启动本地预览...
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。请先安装 Node.js 18 或更高版本。
  pause
  exit /b 1
)
node scripts\serve.mjs
pause
