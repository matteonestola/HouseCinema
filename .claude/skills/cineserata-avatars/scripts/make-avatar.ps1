# Ritaglia un'immagine in un avatar quadrato (JPEG 192x192) in assets/avatars/<id>.jpg
# Uso: powershell -ExecutionPolicy Bypass -File make-avatar.ps1 -Source "C:\foto\pollo.png" -Id iron-chicken [-X 430 -Y 0 -Size 700]
#   -X -Y -Size: riquadro quadrato da ritagliare nei pixel dell'originale (default: quadrato centrale piu' grande)
#   -Id: solo a-z 0-9 e trattini, max 16 caratteri (vincolo di firestore.rules sul campo avatar)
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Id,
  [int]$X = -1,
  [int]$Y = -1,
  [int]$Size = 0,
  [int]$Out = 192,
  [string]$OutDir
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if ($Id -notmatch "^[a-z0-9-]{1,16}$") { throw "Id non valido '$Id': solo a-z, 0-9 e trattini, massimo 16 caratteri." }
if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "File non trovato: $Source" }

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
if (-not $OutDir) { $OutDir = Join-Path $repo "assets\avatars" }
New-Item -ItemType Directory -Force $OutDir | Out-Null

$src = [System.Drawing.Image]::FromFile((Get-Item -LiteralPath $Source).FullName)
if ($Size -le 0) {
  $Size = [math]::Min($src.Width, $src.Height)
  $X = [int](($src.Width - $Size) / 2)
  $Y = [int](($src.Height - $Size) / 2)
}
if ($X -lt 0) { $X = 0 }
if ($Y -lt 0) { $Y = 0 }
if ($X + $Size -gt $src.Width -or $Y + $Size -gt $src.Height) {
  $w = $src.Width; $h = $src.Height; $src.Dispose()
  throw "Il riquadro $X,$Y,$Size esce dall'immagine ($w x $h)."
}

$dst = New-Object System.Drawing.Bitmap($Out, $Out)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $Out, $Out)), $X, $Y, $Size, $Size, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $src.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$p = New-Object System.Drawing.Imaging.EncoderParameters(1)
$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]86)
$path = Join-Path $OutDir ($Id + ".jpg")
$dst.Save($path, $codec, $p); $dst.Dispose()
$kb = [math]::Round((Get-Item -LiteralPath $path).Length / 1KB)
Write-Output "AVATAR: $Id.jpg | ${Out}x${Out} | $kb KB | ritaglio $X,$Y,$Size | $path"
