@echo off
echo Testing OpenRouter API...
echo.

curl -X POST "https://openrouter.ai/api/v1/chat/completions" ^
  -H "Authorization: Bearer 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" ^
  -H "Content-Type: application/json" ^
  -H "HTTP-Referer: https://smaartminds.com" ^
  -H "X-Title: SMAART Test" ^
  -d "{\"model\": \"openai/gpt-oss-120b:free\", \"messages\": [{\"role\": \"user\", \"content\": \"Say hello in one sentence\"}]}"

echo.
echo.
echo Test complete!
pause
