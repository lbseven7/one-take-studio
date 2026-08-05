# Convert SVGs to PNG and JPG using ImageMagick (Windows PowerShell)
# Usage: run this script in PowerShell after installing ImageMagick (ensure 'magick' is in PATH)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$inputDir = Join-Path $scriptDir "kit\images"
$outDir = Join-Path $scriptDir "kit\assets"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$sizes = @( @{w=1080;h=1080}, @{w=1280;h=720}, @{w=1080;h=1920} )
$svgs = Get-ChildItem -Path $inputDir -Filter '*.svg'

foreach ($svg in $svgs) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($svg.Name)
  foreach ($s in $sizes) {
    $outPng = Join-Path $outDir "${base}-${($s.w)}x${($s.h)}.png"
    $outJpg = Join-Path $outDir "${base}-${($s.w)}x${($s.h)}.jpg"
    Write-Output "Converting $($svg.Name) -> $([System.IO.Path]::GetFileName($outPng))"
    magick convert "$($svg.FullName)" -background none -resize "${($s.w)}x${($s.h)}^" -gravity center -extent "${($s.w)}x${($s.h)}" "$outPng"
    Write-Output "Converting $($svg.Name) -> $([System.IO.Path]::GetFileName($outJpg))"
    magick convert "$($svg.FullName)" -background white -resize "${($s.w)}x${($s.h)}^" -gravity center -extent "${($s.w)}x${($s.h)}" -flatten "$outJpg"
  }
}
Write-Output "All conversions complete. Output in: $outDir"