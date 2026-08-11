param(
    [string]$Remote = 'origin'
)

$ErrorActionPreference = 'Stop'

Write-Host 'A publicacao do site agora e feita pela Vercel automaticamente'
Write-Host 'quando voce da push na branch master.'
Write-Host ''
Write-Host '  git push origin master'
Write-Host ''
Write-Host 'A branch gh-pages foi removida e o script de deploy manual (npm run deploy)'
Write-Host 'esta desativado.'
