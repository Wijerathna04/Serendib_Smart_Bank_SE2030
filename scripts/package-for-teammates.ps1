# Packaging Script for Teammates
# Packs the clean codebase into a zip archive excluding build outputs and local environment files.

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Path $PSScriptRoot -Parent
$outputZip = Join-Path -Path $projectDir -ChildPath "Serendib_Smart_Bank_SE2030_Package.zip"

Write-Host "Packaging Serendib Smart Bank codebase into $outputZip..."

$excludePatterns = @(
    "*\.git\*",
    "*\.env",
    "*\target\*",
    "*\node_modules\*",
    "*\dist\*",
    "*\startup-error.txt"
)

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$filesToZip = Get-ChildItem -Path $projectDir -Recurse | Where-Object {
    $itemPath = $_.FullName
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($itemPath -like $pattern) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

Write-Host "Creating ZIP archive with $($filesToZip.Count) items..."
Compress-Archive -Path $filesToZip.FullName -DestinationPath $outputZip -Force
Write-Host "Package successfully created at: $outputZip"
