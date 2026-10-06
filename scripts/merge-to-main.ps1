<#
 FINAL STEP (run as the repo owner after all 6 member branches are pushed).
 Merges every member branch into main, then adds the shared/core files so main equals the final project.
 Usage:  powershell -ExecutionPolicy Bypass -File merge-to-main.ps1 -Source "C:\path\Serendib_FINAL" -Dest "C:\path\Serendib_Work"
 Normal pushes only (no force).
#>
param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Dest
)
$ErrorActionPreference = 'Stop'
function Run { & git @args; if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed" } }
Set-Location $Dest
if (-not (Test-Path .git)) { throw 'Dest is not a git repository.' }
Run fetch --all --prune
Run switch main
Run pull --ff-only
$branches = @('feature/user-bill-payment','feature/account-management','feature/fund-transfer','feature/loan-management','feature/beneficiary-transactions','feature/card-feedback-reporting')
foreach ($b in $branches) {
  Write-Host "Merging $b" -ForegroundColor Cyan
  Run merge --no-ff -X theirs "origin/$b" -m "Merge $b into main"
}
# shared/core files: mirror the FINAL project (keeps .git, skips secrets and build output)
& robocopy $Source $Dest /MIR /XD .git node_modules target dist .vercel /XF .env /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
Run add -A
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { Run commit -m 'Add shared/core configuration, common UI, database scripts and docs' } else { Write-Host 'Nothing more to add.' }
Run push origin main
Write-Host 'Done. main now contains every member branch plus the shared files.' -ForegroundColor Green
