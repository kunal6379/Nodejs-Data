@echo off
title Cloudflare Tunnel Setup
echo ========================================
echo    Cloudflare Tunnel Setup Script
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires Administrator privileges!
    echo Please run as Administrator and try again.
    echo.
    pause
    exit /b 1
)

echo Step 1: Downloading Cloudflare Tunnel...
echo.

REM Create temp directory if it doesn't exist
if not exist "%TEMP%\cloudflared" mkdir "%TEMP%\cloudflared"

REM Download cloudflared MSI
echo Downloading cloudflared-windows-amd64.msi...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi' -OutFile '%TEMP%\cloudflared\cloudflared-windows-amd64.msi'}"

REM Check if download was successful
if not exist "%TEMP%\cloudflared\cloudflared-windows-amd64.msi" (
    echo.
    echo ❌ Download failed!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ Download completed successfully!
echo.

echo Step 2: Installing Cloudflare Tunnel...
echo.

REM Install the MSI package silently
msiexec /i "%TEMP%\cloudflared\cloudflared-windows-amd64.msi" /quiet /norestart

REM Wait for installation to complete
timeout /t 10 /nobreak >nul

echo ✅ Installation completed!
echo.

echo Step 3: Installing Cloudflare Tunnel Service...
echo.

REM Install the cloudflared service with the provided token
cloudflared.exe service install eyJhIjoiNTk2NmVmODAwMmI3N2E2MDIyYWE4ZDY5NmY4MjkyMjYiLCJ0IjoiMzY1YzkzOWMtYWEyZC00ODQ0LWFhMWEtZTQ0YzQ2MzMwY2RkIiwicyI6Ik1URTFNREExTWpndFlqYzFZaTAwWXpFNExXSmxOakF0TVdRek9XTXlOV1JtTldaaiJ9

if %errorLevel% equ 0 (
    echo ✅ Cloudflare Tunnel service installed successfully!
    echo.
    echo The tunnel service is now running in the background.
    echo Your local services will be accessible through Cloudflare's network.
    echo.
) else (
    echo ❌ Service installation failed!
    echo Please check the token and try again.
    echo.
)

echo Step 4: Cleanup...
echo.

REM Clean up downloaded files
if exist "%TEMP%\cloudflared" (
    rmdir /s /q "%TEMP%\cloudflared"
    echo ✅ Temporary files cleaned up.
)

echo.
echo ========================================
echo           Setup Complete!
echo ========================================
echo.
echo Cloudflare Tunnel has been installed and configured.
echo.
echo To manage the service:
echo   Start:   net start cloudflared
echo   Stop:    net stop cloudflared
echo   Status:  sc query cloudflared
echo.
echo To uninstall:
echo   cloudflared.exe service uninstall
echo.
echo Your Windows Control API will now be accessible
echo through Cloudflare's secure tunnel!
echo.
pause