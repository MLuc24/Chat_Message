@echo off
echo ========================================
echo Seeding All Databases
echo ========================================
echo.

echo [1/3] Seeding Auth Service...
cd services\auth-service
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo Error seeding auth service
    exit /b %errorlevel%
)
cd ..\..
echo.

echo [2/3] Seeding User Service...
cd services\user-service
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo Error seeding user service
    exit /b %errorlevel%
)
cd ..\..
echo.

echo [3/3] Seeding Chat Service...
cd services\chat-service
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo Error seeding chat service
    exit /b %errorlevel%
)
cd ..\..
echo.

echo ========================================
echo ✅ All databases seeded successfully!
echo ========================================
echo.
echo You can now login with:
echo   Email: alice@example.com
echo   Password: password123
echo.
echo Other test users:
echo   - bob@example.com
echo   - charlie@example.com
echo   - diana@example.com
echo   - edward@example.com
echo.
pause
