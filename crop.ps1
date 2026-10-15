Add-Type -AssemblyName System.Drawing

$pngs = Get-ChildItem -Filter "*.png"
$file = $null
foreach ($p in $pngs) {
    if ($p.Length -gt 1000000) {
        $file = $p
        break
    }
}

if ($file -eq $null) {
    Write-Output "No large PNG found"
    exit
}

Write-Output "Target image: $($file.Name)"
$img = [System.Drawing.Image]::FromFile($file.FullName)

$yPos = 820
$hSize = 255
$wSize = 308

# 1. Beef Bowl
$rect1 = New-Object System.Drawing.Rectangle(36, $yPos, $wSize, $hSize)
$bmp1 = New-Object System.Drawing.Bitmap($wSize, $hSize)
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$wSize,$hSize)), $rect1, [System.Drawing.GraphicsUnit]::Pixel)
$g1.Dispose()
$bmp1.Save((Join-Path (Get-Location) "menu_beefbowl.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp1.Dispose()

# 2. Chicken Rice
$rect2 = New-Object System.Drawing.Rectangle(358, $yPos, $wSize, $hSize)
$bmp2 = New-Object System.Drawing.Bitmap($wSize, $hSize)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$wSize,$hSize)), $rect2, [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()
$bmp2.Save((Join-Path (Get-Location) "menu_chickenrice.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp2.Dispose()

# 3. Salad Wrap
$rect3 = New-Object System.Drawing.Rectangle(680, $yPos, $wSize, $hSize)
$bmp3 = New-Object System.Drawing.Bitmap($wSize, $hSize)
$g3 = [System.Drawing.Graphics]::FromImage($bmp3)
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g3.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$wSize,$hSize)), $rect3, [System.Drawing.GraphicsUnit]::Pixel)
$g3.Dispose()
$bmp3.Save((Join-Path (Get-Location) "menu_saladwrap.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp3.Dispose()

$img.Dispose()
Write-Output "EXTRACTED_SUCCESSFULLY"
