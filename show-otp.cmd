@echo off
chcp 65001 >nul
title OTP Codes - SMAART User Dashboard
echo ============================================================
echo  OTP viewer - recent codes first, then every new one live.
echo  Each code shows the student email and name it belongs to.
echo  Codes expire after ~3 minutes - always use the newest one.
echo  Leave this window open while testing.
echo  (Requires the Docker backend to be running.)
echo  LOCAL TESTING ONLY - OTP logging is removed before launch.
echo ============================================================
echo.
echo --- Recent codes ---
docker exec smaart-institue-userdashboard-backend-1 sh -c "L=/usr/src/app/logs/combined.log; grep -E 'OTP Code|OTP email to|Name:' $L | tail -9 | sed -n 's/.*message.:.\(.*\).,.service.*/  \1/p'; echo; echo '--- Waiting for new codes (leave this window open) ---'; last=$(wc -l < $L); while true; do cur=$(wc -l < $L); if [ $cur -gt $last ]; then sed -n $((last+1)),${cur}p $L | grep -E 'OTP Code|OTP email to|Name:' | sed -n 's/.*message.:.\(.*\).,.service.*/  \1/p'; last=$cur; fi; sleep 1; done"
echo.
echo Viewer stopped (is the Docker backend running?).
pause
