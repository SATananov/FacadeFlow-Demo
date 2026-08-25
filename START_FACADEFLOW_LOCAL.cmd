@echo off
setlocal

cd /d "%~dp0"
if errorlevel 1 goto path_error

if not exist "package.json" goto package_error

where node >nul 2>&1
if errorlevel 1 goto node_error

where npm.cmd >nul 2>&1
if errorlevel 1 goto npm_error

if not exist "node_modules" goto dependencies_error

echo FacadeFlow Demo
echo Lokalno prilozhenie - bez vrazka s mashina.
echo.

node --version

call npm.cmd run build
if errorlevel 1 goto build_error

echo.
echo FacadeFlow se startira lokalno.
echo Zatvaryane na app prozoretsa shte spre lokalniya server.
echo.

node "scripts\windows-local-app.mjs"
set "APP_EXIT=%ERRORLEVEL%"

if not "%APP_EXIT%"=="0" goto server_error
exit /b 0

:path_error
echo Ne mozhe da se otvori papkata na proekta.
pause
exit /b 1

:package_error
echo Lipsva package.json v papkata na proekta.
pause
exit /b 1

:node_error
echo Lipsva Node.js ili ne e dobaven v PATH.
pause
exit /b 1

:npm_error
echo Lipsva npm.cmd ili ne e dobaven v PATH.
pause
exit /b 1

:dependencies_error
echo Lipsva papkata node_modules.
echo Otvorete terminal v proekta i izpalnete npm install.
pause
exit /b 1

:build_error
echo Production build se provali.
pause
exit /b 1

:server_error
echo Upravlyavanoto lokalno prilozhenie priklyuchi s greshka.
pause
exit /b %APP_EXIT%
