# Revives the agora autonomous-run supervisor if it is not running. Registered as
# the Windows scheduled task "AgoraRunWatchdog" (every 10 minutes). The one brake
# it honors is the repo-root STOP file: with STOP present it never starts
# anything, and the supervisor itself exits immediately under STOP too. To stop
# the whole system: create STOP. To stop the watchdog itself:
#   schtasks /delete /tn AgoraRunWatchdog /f

$repo = "C:\Users\samwu\agora"
if (Test-Path (Join-Path $repo "STOP")) { exit 0 }

$running = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -like "python*" -and $_.CommandLine -match "autonomous-loop\.py" -and $_.CommandLine -match "agora" }
if ($running) { exit 0 }

$logDir = Join-Path $repo ".loop-logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
Add-Content (Join-Path $logDir "watchdog.log") "$(Get-Date -Format s) supervisor absent, reviving"

Start-Process -FilePath "python" `
    -ArgumentList "scripts\autonomous-loop.py", "--prompt", ".claude\prompt-run.md" `
    -WorkingDirectory $repo -WindowStyle Minimized
