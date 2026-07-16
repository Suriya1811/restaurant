$files = @(
    'FunctionMaster.jsx',
    'TableTypeMaster.jsx',
    'TaxMaster.jsx',
    'GroupMaster.jsx',
    'WaiterMaster.jsx',
    'CaptainMaster.jsx',
    'StaffMaster.jsx',
    'TableMaster.jsx',
    'ProductMaster.jsx',
    'MaintainCoupon.jsx'
)

$dir = 'c:\Works\Mahix\restaurant\frontend\src\pages\dashboard'
$importLine = "import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';"

foreach ($file in $files) {
    $path = Join-Path $dir $file
    if (-not (Test-Path $path)) { Write-Host "SKIP (not found): $file"; continue }
    
    $content = Get-Content $path -Raw -Encoding UTF8
    
    # Check if already has the import
    if ($content -match 'exportUtils') {
        Write-Host "ALREADY DONE: $file"
        continue
    }
    
    # Add import after SaveConfirmationModal import
    $content = $content -replace "(import SaveConfirmationModal from '[^']+';)", "`$1`n$importLine"
    
    # Replace empty Excel onClick - matches btn-export excel line followed by onClick={() => {}}
    $content = $content -replace '(className="btn-export excel"\s*)\r?\n(\s*)onClick=\{[^}]*\}', '$1' + "`n" + '$2onClick={handleExcelExport}'
    
    # Replace empty PDF onClick  
    $content = $content -replace '(className="btn-export pdf"\s*)\r?\n(\s*)onClick=\{[^}]*\}', '$1' + "`n" + '$2onClick={handlePDFExport}'
    
    # Replace window.print() onClick
    $content = $content -replace '(className="btn-export print"\s*)\r?\n(\s*)onClick=\{[^}]*window\.print\(\)[^}]*\}', '$1' + "`n" + '$2onClick={handlePrint}'
    
    Set-Content $path $content -Encoding UTF8 -NoNewline
    Write-Host "PATCHED: $file"
}
