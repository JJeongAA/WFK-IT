@echo off
cd /d "%~dp0"
echo ==================================================
echo    Secret Letter  -  SHARE TO PHONE
echo ==================================================
echo.
echo [1/3] Installing Flask...
python -m pip install -r requirements.txt
echo.
echo [2/3] Starting the server...
start "letter-server" python app.py
timeout /t 3 >nul
echo.
echo [3/3] Creating a public link...
echo.
echo   ##################################################################
echo   #                                                                #
echo   #   EASIEST:  point your phone CAMERA at the QR code below,      #
echo   #            then tap the link that pops up.                     #
echo   #                                                                #
echo   #   OR copy the address that ends with  .lhr.life               #
echo   #        example:   https://abc123.lhr.life                      #
echo   #                                                                #
echo   #   Do NOT copy the QR, and ignore any 'localhost' address.      #
echo   #                                                                #
echo   ##################################################################
echo.
ssh -o StrictHostKeyChecking=accept-new -R 80:localhost:5000 nokey@localhost.run
echo.
echo Tunnel closed. You can also close the 'letter-server' window now.
pause
