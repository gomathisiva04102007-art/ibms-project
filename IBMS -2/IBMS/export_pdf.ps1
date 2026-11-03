$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$docxPath = Join-Path $scriptDir "Billing_and_Invoice_Management_System_Project_Report.docx"
$pdfPath = Join-Path $scriptDir "Billing_and_Invoice_Management_System_Project_Report.pdf"

Write-Host "Opening Microsoft Word COM Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    Write-Host "Opening DOCX: $docxPath"
    $doc = $word.Documents.Open($docxPath)
    
    Write-Host "Exporting to PDF: $pdfPath"
    # wdExportFormatPDF = 17
    $doc.ExportAsFixedFormat($pdfPath, 17)
    $doc.Close([ref]$false)
    Write-Host "PDF Export completed successfully."
}
finally {
    $word.Quit([ref]$false)
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

if (Test-Path $pdfPath) {
    $item = Get-Item $pdfPath
    Write-Host ("Exported PDF Size: {0:N2} KB" -f ($item.Length / 1KB))
} else {
    Write-Error "PDF file was not created."
}
