@echo off
echo Testing OpenRouter API...
echo.

if "%OPENROUTER_API_KEY%"=="" (
    echo Error: OPENROUTER_API_KEY environment variable is not set or empty.
    exit /b 1
)

curl -X POST "https://openrouter.ai/api/v1/chat/completions" ^
  -H "Authorization: Bearer %OPENROUTER_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -H "HTTP-Referer: https://smaartminds.com" ^
  -H "X-Title: SMAART Test" ^
  -d "{\"model\": \"openai/gpt-oss-120b:free\", \"messages\": [{\"role\": \"user\", \"content\": \"Say hello in one sentence\"}]}"

echo.
echo.
echo Test complete!
pause
