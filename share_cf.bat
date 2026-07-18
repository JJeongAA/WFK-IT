@echo off
cd /d "%~dp0"
echo ==================================================
echo    Secret Letter  -  SHARE TO PHONE (Cloudflare)
echo ==================================================
echo.
echo [1/3] Installing Flask...
python -m pip install -r requirements.txt
echo.
echo [2/3] Starting the server...
start "letter-server" python app.py
timeout /t 3 >nul
echo.
echo [3/3] Creating a public link (Cloudflare)...
echo.
echo   ################################################################
echo   #  Look for the address:   https://XXXX.trycloudflare.com     #
echo   #  Send THAT to your friend (or open it on your phone).        #
echo   #  KEEP THIS WINDOW OPEN the whole time you share!             #
echo   ################################################################
echo.
cloudflared.exe tunnel --url http://localhost:5000
echo.
echo Tunnel closed. You can also close the 'letter-server' window now.
pause
