$ErrorActionPreference = 'Stop'

# Configuração
$ApiKey = if ($env:API_KEY -and $env:API_KEY.Trim().Length -gt 0) { $env:API_KEY } else { 'minha_chave_super_secreta' }
$Headers = @{ 'X-API-Key' = $ApiKey; 'Accept' = 'application/json' }

$OriginLat = -23.5213483
$OriginLon = -46.7075223
$Radii = @(100, 300, 500)

function Get-Lat([object]$item) {
  if ($null -ne $item.coords -and $item.coords.PSObject.Properties.Name -contains 'lat') { return $item.coords.lat }
  elseif ($item.PSObject.Properties.Name -contains 'lat') { return $item.lat }
  else { return $null }
}

function Get-Lon([object]$item) {
  if ($null -ne $item.coords -and $item.coords.PSObject.Properties.Name -contains 'lon') { return $item.coords.lon }
  elseif ($item.PSObject.Properties.Name -contains 'lon') { return $item.lon }
  else { return $null }
}

foreach ($r in $Radii) {
  $Uri = "http://localhost:3000/v1/chargers?lat=$OriginLat&lon=$OriginLon&radiusKm=$r&limit=200"
  try {
    $Resp = Invoke-RestMethod -Uri $Uri -Headers $Headers -Method Get -TimeoutSec 30

    # Normalizar resposta: pode ser um objeto com .items, um array direto, ou um único objeto
    if ($Resp -is [System.Collections.IEnumerable] -and -not ($Resp -is [string])) {
      $Items = @($Resp)
    } elseif ($Resp.PSObject.Properties.Name -contains 'items') {
      $Items = @($Resp.items)
    } else {
      $Items = @($Resp)
    }

    $Total = ($Items | Measure-Object).Count
    Write-Host "=== radius $r km -> total: $Total ==="

    $Items |
      Select-Object -First 5 `
        @{n='chargeBoxId'; e={ $_.chargeBoxId }}, `
        @{n='lat'; e={ Get-Lat $_ }}, `
        @{n='lon'; e={ Get-Lon $_ }}, `
        @{n='distanceKm'; e={ $_.distanceKm }}, `
        @{n='overallStatus'; e={ $_.overallStatus }}, `
        @{n='wsOnline'; e={ $_.wsOnline }} |
      Format-Table -AutoSize
  }
  catch {
    Write-Host ("Erro radius {0}: {1}" -f $r, $_.Exception.Message)
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  }
}