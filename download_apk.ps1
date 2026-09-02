# Get jobs of the failed run
$runId = "33624931591"
$url = "https://api.github.com/repos/suryamanikanta2007-oss/udhaya_netra/actions/runs/$runId/jobs"
$jobs = Invoke-RestMethod -Uri $url -Headers @{"User-Agent"="Mozilla/5.0"}
foreach ($j in $jobs.jobs) {
    Write-Host "Job: $($j.name) - $($j.conclusion)" -ForegroundColor Yellow
    foreach ($step in $j.steps) {
        Write-Host "  Step: $($step.name) -> $($step.conclusion) (number: $($step.number))"
    }
}
