# Aggiunge un'immagine a background_img/ pronta per essere scelta come copertina.
#   - nome normalizzato (minuscolo, trattini, niente accenti/spazi)
#   - png/jpg/bmp/tiff: orientamento EXIF applicato, ridimensionata a MaxWidth e salvata come .jpg
#     sotto MaxKB (qualita' ridotta a gradini se serve)
#   - webp/avif/gif: copiate cosi' come sono (Windows non le sa rielaborare): avviso se pesanti
#   - rigenera background_img/manifest.json
# Uso: powershell -ExecutionPolicy Bypass -File add-cover.ps1 -Source "C:\foto\locandina.png" [-Name notte-horror] [-Force]
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [string]$Name,
  [int]$MaxWidth = 1600,
  [int]$Quality = 82,
  [int]$MaxKB = 400,
  [switch]$Force
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$destDir = Join-Path $repo "background_img"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }

if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "File non trovato: $Source" }
$srcItem = Get-Item -LiteralPath $Source
$ext = $srcItem.Extension.ToLower()
$raster = @(".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")
$passthrough = @(".webp", ".avif", ".gif")
if (($raster + $passthrough) -notcontains $ext) { throw "Formato non supportato ($ext). Usa jpg, png, webp, avif o gif." }

# nome: minuscolo, senza accenti, solo [a-z0-9-]
$base = if ($Name) { $Name } else { [IO.Path]::GetFileNameWithoutExtension($srcItem.Name) }
$norm = $base.Normalize([Text.NormalizationForm]::FormD)
$sb = New-Object Text.StringBuilder
foreach ($c in $norm.ToCharArray()) {
  if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($c) }
}
$slug = ($sb.ToString().ToLower() -replace "[^a-z0-9]+", "-").Trim("-")
if (-not $slug) { throw "Impossibile ricavare un nome valido da '$base': passa -Name." }

$outExt = if ($raster -contains $ext) { ".jpg" } else { $ext }
$outName = $slug + $outExt
$outPath = Join-Path $destDir $outName
if ((Test-Path -LiteralPath $outPath) -and -not $Force) {
  Write-Output "EXISTS: $outName esiste gia' in background_img/. Usa -Name per un altro nome o -Force per sovrascrivere."
  exit 2
}

if ($passthrough -contains $ext) {
  Copy-Item -LiteralPath $Source -Destination $outPath -Force
  $kb = [math]::Round((Get-Item -LiteralPath $outPath).Length / 1KB)
  Write-Output "ADDED: $outName | copiata senza modifiche | $kb KB"
  if ($kb -gt $MaxKB) { Write-Output "WARN: pesa $kb KB (consigliato < $MaxKB KB). Per questo formato non posso ridurla: usa un tool esterno o converti in jpg." }
}
else {
  $loaded = [System.Drawing.Image]::FromFile($srcItem.FullName)
  $bmp = New-Object System.Drawing.Bitmap($loaded)
  # orientamento EXIF (foto da telefono)
  try {
    if ($loaded.PropertyIdList -contains 0x0112) {
      switch ($loaded.GetPropertyItem(0x0112).Value[0]) {
        3 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
  } catch { }
  $loaded.Dispose()

  $w = $bmp.Width; $h = $bmp.Height
  if ($w -gt $MaxWidth) {
    $nh = [int][math]::Round($h * $MaxWidth / $w)
    $resized = New-Object System.Drawing.Bitmap($MaxWidth, $nh)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Black)
    $g.DrawImage($bmp, 0, 0, $MaxWidth, $nh)
    $g.Dispose(); $bmp.Dispose()
    $bmp = $resized; $w = $MaxWidth; $h = $nh
  }

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $q = $Quality
  $kb = 0
  while ($true) {
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$q)
    $bmp.Save($outPath, $codec, $params)
    $kb = [math]::Round((Get-Item -LiteralPath $outPath).Length / 1KB)
    if ($kb -le $MaxKB -or $q -le 50) { break }
    $q -= 6
  }
  $bmp.Dispose()
  Write-Output "ADDED: $outName | ${w}x${h} | $kb KB | qualita' $q"
  if ($kb -gt $MaxKB) { Write-Output "WARN: pesa $kb KB anche a qualita' $q (consigliato < $MaxKB KB). Riduci -MaxWidth." }
  if ($h -gt $w) { Write-Output "WARN: immagine verticale ($w x $h): la copertina e' orizzontale (16:9 / 4:3) e verra' ritagliata." }
}

node (Join-Path $PSScriptRoot "update-manifest.js")
if ($LASTEXITCODE -ne 0) { throw "Aggiornamento del manifest non riuscito" }
