# Monitor the latest APK workflow run and download APK when finished
$ErrorActionPreference = "Continue"

Write-Host "Monitoring GitHub Actions Build..." -ForegroundColor Cyan

$timeoutSeconds = 180
$elapsed = 0

while ($elapsed -lt $timeoutSeconds) {
    $url = "https://api.github.com/repos/suryamanikanta2007-oss/udhaya_netra/actions/runs?per_page=5"
    $runs = Invoke-RestMethod -Uri $url -Headers @{"User-Agent"="Mozilla/5.0"}
    $apkRun = $runs.workflow_runs | Where-Object { $_.name -eq "Build Udhaya Netram Android APK" } | Select-Object -First 1

    if ($apkRun) {
        Write-Host "[$elapsed s] Run ID: $($apkRun.id) | Status: $($apkRun.status) | Conclusion: $($apkRun.conclusion)" -ForegroundColor Yellow
        if ($apkRun.status -eq "completed") {
            Write-Host "Build Finished with conclusion: $($apkRun.conclusion)" -ForegroundColor $(if ($apkRun.conclusion -eq "success") { "Green" } else { "Red" })
            break
        }
    }
    Start-Sleep -Seconds 10
    $elapsed += 10
}
