# Generates placeholder PNG assets from embedded base64 and writes to app folders
$base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
$data = [System.Convert]::FromBase64String($base64)

$targets = @(
  "mobile/citizen_app/assets/drrmo_seal.png",
  "mobile/responder_app/assets/drrmo_seal.png",
  "frontend/admin-app/public/drrmo-seal.png",
  "frontend/barangay-app/public/drrmo-seal.png",
  "frontend/drrmo-officer-app/public/drrmo-seal.png",
  "frontend/admin-app/public/Image/login_backgroundimage.png",
  "frontend/barangay-app/public/Image/login_backgroundimage.png",
  "frontend/drrmo-officer-app/public/Image/login_backgroundimage.png"
)

$root = $PSScriptRoot

foreach ($t in $targets) {
  $full = Join-Path $root $t
  $dir = Split-Path $full -Parent
  if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  [System.IO.File]::WriteAllBytes($full, $data)
  Write-Host "Wrote: $t"
}

Write-Host "All placeholder assets created at $root." 