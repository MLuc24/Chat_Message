@echo off
echo ========================================
echo   MESSENGER API QUICK TEST
echo ========================================
echo.

set BASE_URL=http://localhost:8000/api

echo [1/5] Testing API Gateway health...
curl -s %BASE_URL%/health
echo.
echo.

echo [2/5] Testing Auth Service...
curl -s %BASE_URL%/auth/health
echo.
echo.

echo [3/5] Registering test user...
curl -X POST %BASE_URL%/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}"
echo.
echo.

echo [4/5] Logging in...
curl -X POST %BASE_URL%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
echo.
echo.

echo [5/5] Testing User Service...
curl -s %BASE_URL%/users/health
echo.
echo.

echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. Check API.md for full API documentation
echo 2. Use Postman for detailed testing
echo 3. Test WebSocket at http://localhost:9000
echo.
pause
