# Test Login API

Write-Host "Testing Login API..." -ForegroundColor Cyan

# Test data
$loginData = @{
    email = "alice@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "`nRequest Body:" -ForegroundColor Yellow
Write-Host $loginData

Write-Host "`nTesting via Gateway (http://localhost:8000/api/auth/login)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData

    Write-Host "`nSuccess! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`nError via Gateway:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n---`n"

Write-Host "Testing directly to Auth Service (http://localhost:3001/auth/login)..." -ForegroundColor Yellow

try {
    # Get auth-service container IP
    $containerIp = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' messenger-auth-service
    
    Write-Host "Auth Service IP: $containerIp"
    
    $response = Invoke-RestMethod -Uri "http://${containerIp}:3001/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData

    Write-Host "`nSuccess! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`nError accessing Auth Service directly:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}
