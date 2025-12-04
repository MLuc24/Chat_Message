@echo off
echo ========================================
echo   MESSENGER MICROSERVICE - QUICK START
echo ========================================
echo.

REM Check Docker
echo [1/5] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not running!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker is installed

REM Check Docker Compose
echo.
echo [2/5] Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed!
    pause
    exit /b 1
)
echo ✅ Docker Compose is installed

REM Check .env file
echo.
echo [3/5] Checking environment configuration...
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your configuration!
    echo    Especially change JWT_SECRET and POSTGRES_PASSWORD
    echo.
    pause
)
echo ✅ Environment file exists

REM Stop existing containers
echo.
echo [4/5] Stopping existing containers...
docker-compose down

REM Start services
echo.
echo [5/5] Starting all services...
echo This may take a few minutes for the first time...
echo.
docker-compose up --build -d

if errorlevel 1 (
    echo.
    echo ❌ Failed to start services!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================
echo.
echo 🌐 Services available at:
echo    - API Gateway:    http://localhost:8000
echo    - WebSocket:      http://localhost:9000
echo    - PostgreSQL:     localhost:5432
echo    - Redis:          localhost:6379
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo.
echo 📚 Read QUICKSTART.md for testing instructions
echo.
pause

REM Open browser to health check
start http://localhost:8000/api/health
