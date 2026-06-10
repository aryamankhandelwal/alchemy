@echo off
cd /d "%~dp0"
echo === Starting dev server === > dev-log.txt 2>&1
echo Current dir: %CD% >> dev-log.txt 2>&1
echo. >> dev-log.txt 2>&1
echo --- Testing node.exe --- >> dev-log.txt 2>&1
"C:\Program Files\nodejs\node.exe" --version >> dev-log.txt 2>&1
echo. >> dev-log.txt 2>&1
echo --- Launching Vite --- >> dev-log.txt 2>&1
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" >> dev-log.txt 2>&1
echo. >> dev-log.txt 2>&1
echo === Exited with code %ERRORLEVEL% === >> dev-log.txt 2>&1
pause
