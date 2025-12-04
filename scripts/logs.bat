@echo off
echo ========================================
echo   VIEWING SERVICE LOGS
echo ========================================
echo.
echo Press Ctrl+C to stop viewing logs
echo.

docker-compose logs -f
