@echo off
REM Test Login Debug Logging Script (Windows)
REM This script demonstrates the debug logging for login function

echo ==========================================
echo Testing Login Debug Logging
echo ==========================================
echo.

set API_URL=http://localhost:3001
if not "%1"=="" set API_URL=%1

echo API URL: %API_URL%
echo.

REM Test 1: Successful Login
echo ==========================================
echo Test 1: Successful Login
echo ==========================================
echo.

echo Creating test user...
curl -X POST "%API_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"debug-test@example.com\",\"password\":\"Test123!@#\",\"name\":\"Debug Test User\"}"
echo.

timeout /t 2 /nobreak >nul

echo Attempting login with correct credentials...
curl -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "X-Request-Id: test-req-001" ^
  -d "{\"email\":\"debug-test@example.com\",\"password\":\"Test123!@#\"}"
echo.
echo.

REM Test 2: Failed Login - Wrong Password
echo ==========================================
echo Test 2: Failed Login - Wrong Password
echo ==========================================
echo.

echo Attempting login with wrong password...
curl -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "X-Request-Id: test-req-002" ^
  -d "{\"email\":\"debug-test@example.com\",\"password\":\"WrongPassword123\"}"
echo.
echo.

REM Test 3: Failed Login - User Not Found
echo ==========================================
echo Test 3: Failed Login - User Not Found
echo ==========================================
echo.

echo Attempting login with non-existent user...
curl -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "X-Request-Id: test-req-003" ^
  -d "{\"email\":\"nonexistent@example.com\",\"password\":\"SomePassword123\"}"
echo.
echo.

REM Instructions for viewing logs
echo ==========================================
echo View Debug Logs
echo ==========================================
echo.
echo To view the debug logs, run one of these commands:
echo.
echo 1. View all logs:
echo    docker logs messenger-auth-service
echo.
echo 2. View only login logs:
echo    docker logs messenger-auth-service 2^>^&1 ^| findstr "[LOGIN]"
echo.
echo 3. View logs for specific request:
echo    docker logs messenger-auth-service 2^>^&1 ^| findstr "test-req-001"
echo.
echo 4. View successful logins:
echo    docker logs messenger-auth-service 2^>^&1 ^| findstr "User logged in"
echo.
echo 5. View failed logins:
echo    docker logs messenger-auth-service 2^>^&1 ^| findstr "Login failed"
echo.
echo 6. Follow logs in real-time:
echo    docker logs -f messenger-auth-service
echo.

echo ==========================================
echo Test completed!
echo ==========================================
