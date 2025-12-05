# Test Seed Data Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Seed Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login as Alice
Write-Host "[1] Testing Login with Alice..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"email":"alice@example.com","password":"password123"}'
    
    if ($response.success) {
        Write-Host "✅ Alice login successful!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name)" -ForegroundColor Gray
        Write-Host "   Email: $($response.data.user.email)" -ForegroundColor Gray
        $aliceToken = $response.data.tokens.accessToken
    } else {
        Write-Host "❌ Alice login failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Login as Bob
Write-Host "[2] Testing Login with Bob..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"email":"bob@example.com","password":"password123"}'
    
    if ($response.success) {
        Write-Host "✅ Bob login successful!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name)" -ForegroundColor Gray
        Write-Host "   Email: $($response.data.user.email)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Bob login failed!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Alice's conversations
if ($aliceToken) {
    Write-Host "[3] Getting Alice's conversations..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $aliceToken"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:8000/api/chat/conversations" `
            -Method Get `
            -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ Found $($response.data.length) conversations!" -ForegroundColor Green
            foreach ($conv in $response.data) {
                if ($conv.type -eq "direct") {
                    Write-Host "   [Direct] Chat with: $($conv.otherUser.name)" -ForegroundColor Gray
                } else {
                    Write-Host "   [Group] $($conv.name)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "❌ Failed to get conversations!" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:5173" -ForegroundColor White
Write-Host "3. Login with alice@example.com / password123" -ForegroundColor White
Write-Host ""
