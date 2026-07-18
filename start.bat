@echo off
cd /d "%~dp0"
echo ==================================================
echo    Secret Letter / bimil-pyeonji  -  START
echo ==================================================
echo.
echo [1/2] Installing Flask (first time may take a while)...
python -m pip install -r requirements.txt
echo.
echo [2/2] Starting the website...
echo Your browser will open in 3 seconds.
echo To STOP: just close this black window.
echo.
start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:5000"
python app_student.py
