@echo off
cd /d "%~dp0"
echo Rebuilding Alchemy frontend for pyserver...

where npm >nul 2>&1
if %ERRORLEVEL%==0 (
  call npm run build
  if %ERRORLEVEL%==0 goto done
  echo npm run build failed, trying esbuild...
)

set ESBUILD=node_modules\@esbuild\win32-x64\esbuild.exe
if not exist "%ESBUILD%" (
  echo esbuild not found at %ESBUILD%
  exit /b 1
)

if not exist dist\assets mkdir dist\assets

for /f "tokens=3 delims=^=" %%A in ('findstr /C:"src=" dist\index.html') do set SCRIPT=%%A
set SCRIPT=%SCRIPT:"=%
set SCRIPT=%SCRIPT:/assets/=%
if "%SCRIPT%"=="" set SCRIPT=index-app.js

"%ESBUILD%" src\main.tsx --bundle --format=esm --jsx=automatic --minify --define:process.env.NODE_ENV='"production"' --alias:@=./src --loader:.svg=dataurl --outfile=dist\assets\%SCRIPT%
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

:done
findstr /C:"Initiatives" dist\assets\*.js >nul
if %ERRORLEVEL%==0 (
  echo OK — Initiatives tab is in the bundle.
) else (
  echo WARN — "Initiatives" not found in dist bundle.
)
echo Restart pyserver and hard-refresh the browser.
