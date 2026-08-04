$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 3014
$url = "http://127.0.0.1:$port/"

function Test-SeriesScout {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -match "Series Scout"
  } catch {
    return $false
  }
}

if (-not (Test-SeriesScout)) {
  Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--hostname", "0.0.0.0", "--port", "$port") `
    -WorkingDirectory $projectPath `
    -WindowStyle Hidden

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-SeriesScout) { break }
  }
}

Start-Process $url
