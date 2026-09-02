# Fetch job logs using redirect
$ErrorActionPreference = "Continue"

$jobsUrl = "https://api.github.com/repos/suryamanikanta2007-oss/udhaya_netra/actions/runs/33625936656/jobs"
$jobs = Invoke-RestMethod -Uri $jobsUrl -Headers @{"User-Agent"="Mozilla/5.0"}
$jobId = $jobs.jobs[0].id
Write-Host "Fetching logs for Job ID: $jobId"

$logUrl = "https://api.github.com/repos/suryamanikanta2007-oss/udhaya_netra/actions/jobs/$jobId/logs"
try {
    $wc = New-Object Net.WebClient
    $wc.Headers.Add("User-Agent", "Mozilla/5.0")
    $logContent = $wc.DownloadString($logUrl)
    $lines = $logContent -split "`n"
    Write-Host "Total Log Lines: $($lines.Count)"
    
    # Filter for ERROR, FAILED, or FAILURE
    $errLines = $lines | Select-String -Pattern "error:|FAILED|Exception|AAPT:" -Context 2,2
    foreach ($m in $errLines) {
        Write-Host $m.ToString() -ForegroundColor Red
    }
} catch {
    Write-Host "Log fetch error: $($_.Exception.Message)"
}
