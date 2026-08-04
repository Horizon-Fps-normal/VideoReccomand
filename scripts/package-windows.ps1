$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$package = Get-Content -Raw -Encoding utf8 (Join-Path $projectRoot "package.json") | ConvertFrom-Json
$electronVersion = $package.devDependencies.electron.TrimStart("^")
$outputDir = Join-Path $projectRoot "release"
$tempRoot = Join-Path $env:TEMP "series-scout-packaging-$PID"
$appStage = Join-Path $tempRoot "app"
$unpacked = Join-Path $tempRoot "win-unpacked"
$asarPath = Join-Path $tempRoot "app.asar"

function Assert-InProject([string] $path) {
  $resolved = [IO.Path]::GetFullPath($path)
  if ($resolved -notlike "$projectRoot\*") { throw "Refusing a path outside the project: $resolved" }
  return $resolved
}

try {
  & npm.cmd run build

  if (Test-Path -LiteralPath $outputDir) {
    Remove-Item -LiteralPath (Assert-InProject $outputDir) -Recurse -Force
  }
  New-Item -ItemType Directory -Path $appStage -Force | Out-Null

  Copy-Item -LiteralPath (Join-Path $projectRoot "desktop") -Destination (Join-Path $appStage "desktop") -Recurse
  New-Item -ItemType Directory -Path (Join-Path $appStage "dist") -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot "dist\client") -Destination (Join-Path $appStage "dist\client") -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "dist\server") -Destination (Join-Path $appStage "dist\server") -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "dist\.openai") -Destination (Join-Path $appStage "dist\.openai") -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "package.json") -Destination (Join-Path $appStage "package.json")

  & (Join-Path $projectRoot "node_modules\.bin\asar.cmd") pack $appStage $asarPath

  $electronDist = Join-Path $projectRoot "node_modules\electron\dist"
  if (-not (Test-Path -LiteralPath (Join-Path $electronDist "electron.exe"))) {
    $electronZip = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA "electron\Cache") -Recurse -Filter "electron-v$electronVersion-win32-x64.zip" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $electronZip) { throw "Electron $electronVersion runtime was not found. Run npm install again with network access." }
    New-Item -ItemType Directory -Path $unpacked -Force | Out-Null
    Expand-Archive -LiteralPath $electronZip.FullName -DestinationPath $unpacked -Force
  } else {
    New-Item -ItemType Directory -Path $unpacked -Force | Out-Null
    Copy-Item -Path (Join-Path $electronDist "*") -Destination $unpacked -Recurse -Force
  }

  New-Item -ItemType Directory -Path (Join-Path $unpacked "resources") -Force | Out-Null
  Copy-Item -LiteralPath $asarPath -Destination (Join-Path $unpacked "resources\app.asar") -Force
  Rename-Item -LiteralPath (Join-Path $unpacked "electron.exe") -NewName "Series Scout.exe"

  & npm.cmd exec electron-builder -- --prepackaged $unpacked --win nsis --config.directories.output=$outputDir
  $installer = Get-ChildItem -LiteralPath $outputDir -Filter "Series-Scout-Setup-*.exe" -File | Select-Object -First 1
  if (-not $installer) { throw "electron-builder finished without producing a Series Scout installer" }
  Write-Output "Installer created: $($installer.FullName)"
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
