@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua cai Node.js. Cai Node.js 22 LTS tu https://nodejs.org roi mo lai file nay.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);if(a<22||(a===22&&b<12)){console.error('Can Node.js 22.12 tro len');process.exit(1)}"
if errorlevel 1 (
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dang cai thu vien. Lan dau can ket noi Internet...
  call npm ci
  if errorlevel 1 (
    echo Cai dat chua thanh cong. Kiem tra Internet va thu lai.
    pause
    exit /b 1
  )
)
echo Mo http://localhost:5173 trong trinh duyet.
echo Giu cua so nay mo trong khi test. Nhan Ctrl+C de dung.
call npm run dev
pause
