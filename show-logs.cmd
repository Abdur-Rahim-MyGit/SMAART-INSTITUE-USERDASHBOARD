@echo off
chcp 65001 >nul
title Backend Live Logs - SMAART User Dashboard
echo ============================================================
echo  Live backend logs - every API request, login, error and
echo  OTP code as it happens. Routine health checks are hidden.
echo  Leave this window open while testing; closing it does not
echo  affect the server.
echo  (Requires the Docker backend to be running.)
echo ============================================================
echo.
docker exec smaart-institue-userdashboard-backend-1 sh -c "L=/usr/src/app/logs/combined.log; tail -40 $L | grep -v 'GET /api/health' | sed -n 's/.*message.:.\(.*\).,.service.*timestamp.:.[0-9-]* \([0-9:]*\).*/[\2] \1/p' | tr -d '\'; echo; echo '--- Live (leave this window open) ---'; last=$(wc -l < $L); while true; do cur=$(wc -l < $L); if [ $cur -gt $last ]; then sed -n $((last+1)),${cur}p $L | grep -v 'GET /api/health' | sed -n 's/.*message.:.\(.*\).,.service.*timestamp.:.[0-9-]* \([0-9:]*\).*/[\2] \1/p' | tr -d '\'; last=$cur; fi; sleep 1; done"
echo.
echo Log viewer stopped (is the Docker backend running?).
pause
