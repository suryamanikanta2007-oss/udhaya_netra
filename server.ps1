# ==============================================================================
# UDHAYA NETRAM - LOCALHOST WEB SERVER (PowerShell / .NET HTTP Listener)
# Serves static files from /public and provides /api/config & /api/upload-pdf
# ==============================================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$envPath = Join-Path $scriptDir ".env"
$publicDir = Join-Path $scriptDir "public"
$uploadsDir = Join-Path $publicDir "uploads"

if (-not (Test-Path $publicDir)) {
    $publicDir = $scriptDir
    $uploadsDir = Join-Path $scriptDir "uploads"
}

if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
}

# Parse .env file
$envConfig = @{}
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            $envConfig[$key] = $val
        }
    }
}

$port = if ($envConfig.ContainsKey("PORT") -and $envConfig["PORT"]) { $envConfig["PORT"] } else { 3000 }
$url = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
} catch {
    Write-Host "[!] Port $port may be in use. Trying port 8080..." -ForegroundColor Yellow
    $port = 8080
    $url = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  UDHAYA NETRAM - LOCAL DEVELOPMENT SERVER" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "[OK] Server is running at: $url" -ForegroundColor Cyan
Write-Host "[OK] Serving static files from: $publicDir" -ForegroundColor Gray
Write-Host "[OK] Uploads directory ready: $uploadsDir" -ForegroundColor Gray
Write-Host "[OK] Loaded configuration from: $envPath" -ForegroundColor Gray
Write-Host "Press Ctrl+C in this terminal to stop the server." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# MIME types dictionary
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".pdf"  = "application/pdf"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }

        $localPath = $request.Url.LocalPath

        # 1. API Config Endpoint
        if ($localPath -eq "/api/config") {
            $json = ConvertTo-Json $envConfig
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.OutputStream.Close()
            continue
        }

        # 2. Direct PDF Upload Endpoint (POST /api/upload-pdf)
        if ($localPath -eq "/api/upload-pdf" -and $request.HttpMethod -eq "POST") {
            try {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $uploadData = ConvertFrom-Json $body

                $origName = if ($uploadData.filename) { $uploadData.filename } else { "epaper.pdf" }
                $cleanBase = [System.IO.Path]::GetFileNameWithoutExtension($origName) -replace '[^a-zA-Z0-9_\-]', '_'
                $safeName = "epaper_" + (Get-Date -Format "yyyyMMdd_HHmmss") + "_" + $cleanBase + ".pdf"
                $destPath = Join-Path $uploadsDir $safeName

                # Decode Base64 data
                $base64Str = $uploadData.data
                if ($base64Str.Contains(",")) {
                    $base64Str = $base64Str.Substring($base64Str.IndexOf(",") + 1)
                }
                $pdfBytes = [System.Convert]::FromBase64String($base64Str)
                [System.IO.File]::WriteAllBytes($destPath, $pdfBytes)

                $resultUrl = "/uploads/" + $safeName
                $resObj = @{
                    success = $true
                    url = $resultUrl
                    filename = $safeName
                    size = $pdfBytes.Length
                }
                $jsonRes = ConvertTo-Json $resObj
                $buf = [System.Text.Encoding]::UTF8.GetBytes($jsonRes)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $buf.Length
                $response.OutputStream.Write($buf, 0, $buf.Length)
            } catch {
                $errObj = @{ success = $false; error = $_.Exception.Message }
                $errJson = ConvertTo-Json $errObj
                $buf = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.StatusCode = 500
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $buf.Length
                $response.OutputStream.Write($buf, 0, $buf.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # 3. Static File Serving
        $relPath = $localPath.TrimStart('/')
        if (-not $relPath) {
            $relPath = "index.html"
        }

        $filePath = Join-Path $publicDir $relPath
        if (-not (Test-Path $filePath) -or (Get-Item $filePath).PSIsContainer) {
            $filePath = Join-Path $publicDir "index.html"
        }

        if (Test-Path $filePath) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $fileBytes.Length
            $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }

        $response.OutputStream.Close()
    } catch {
        # Continue on any loop error
    }
}
