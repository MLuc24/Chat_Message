@echo off
echo ========================================
echo   STOPPING MESSENGER SERVICES
echo ========================================
echo.

docker-compose down

echo.
echo ✅ All services stopped
echo.
pause
