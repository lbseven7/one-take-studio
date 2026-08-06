param(
    [string]$Remote = 'origin'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$site = Join-Path $root 'one-take-studio'
$destDir = 'docs'

if (-not (Test-Path -LiteralPath $site)) {
    throw "Pasta do site não encontrada: $site"
}

Set-Location $root

git fetch $Remote | Out-Null

$wt = Join-Path $env:TEMP ("takeum-wt-" + [guid]::NewGuid().ToString('N'))

try {
    git worktree add --detach $wt "$Remote/gh-pages"

    $dest = Join-Path $wt $destDir
    if (Test-Path -LiteralPath $dest) {
        Remove-Item -LiteralPath $dest -Recurse -Force
    }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Get-ChildItem -LiteralPath $site -Force | Copy-Item -Destination $dest -Recurse -Force

    git -C $wt add -A "$destDir"
    if (git -C $wt diff --cached --quiet) {
        Write-Host 'Nada para publicar.'
    }
    else {
        $sha = git rev-parse --short origin/master
        git -C $wt commit -m "deploy: $sha" | Out-Null
        git -C $wt push $Remote HEAD:gh-pages
        Write-Host "Deploy publicado: deploy: $sha"
    }
}
finally {
    if (Test-Path -LiteralPath $wt) {
        git worktree remove --force $wt 2>$null
    }
}
