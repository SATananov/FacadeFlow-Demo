@echo off
setlocal

cd /d "%~dp0"
if errorlevel 1 goto path_error

if not exist "START_FACADEFLOW_LOCAL.cmd" goto launcher_error
if not exist "public\branding\nadezhda-shortcut.ico" goto icon_error

set "FACADEFLOW_ROOT=%~dp0"
powershell.exe -NoProfile -Command "$desktop=[Environment]::GetFolderPath('Desktop'); $link=Join-Path $desktop 'FacadeFlow Demo.lnk'; if(Test-Path -LiteralPath $link){$answer=Read-Host 'Shortcutat sashtestvuva. Da bade li zamenen? [Y/N]'; if($answer -notmatch '^\s*[Yy]\s*$'){exit 2}}; $shell=New-Object -ComObject WScript.Shell; $shortcut=$shell.CreateShortcut($link); $shortcut.TargetPath=Join-Path $env:FACADEFLOW_ROOT 'START_FACADEFLOW_LOCAL.cmd'; $shortcut.WorkingDirectory=$env:FACADEFLOW_ROOT.TrimEnd('\'); $shortcut.IconLocation=(Join-Path $env:FACADEFLOW_ROOT 'public\branding\nadezhda-shortcut.ico') + ',0'; $shortcut.Description='FacadeFlow Demo - Nadezhda'; $shortcut.Save()"
set "SHORTCUT_EXIT=%ERRORLEVEL%"
if "%SHORTCUT_EXIT%"=="0" goto success
if "%SHORTCUT_EXIT%"=="2" goto cancelled
goto shortcut_error

:success
echo Desktop shortcutat e sazdaden uspeshno.
exit /b 0

:cancelled
echo Sazdavaneto na shortcut e otkazano.
exit /b 0

:path_error
echo Ne mozhe da se otvori papkata na proekta.
pause
exit /b 1

:launcher_error
echo Lipsva START_FACADEFLOW_LOCAL.cmd.
pause
exit /b 1

:icon_error
echo Lipsva ikonata public\branding\nadezhda-shortcut.ico.
pause
exit /b 1

:shortcut_error
echo Desktop shortcutat ne mozha da bade sazdaden.
pause
exit /b %SHORTCUT_EXIT%
