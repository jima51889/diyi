param(
  [int]$Port = 4180
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Output "UI preview server running at http://127.0.0.1:$Port/"

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relative)) {
      $relative = 'ui-preview.html'
    }

    $target = Join-Path $root $relative
    $resolvedRoot = [System.IO.Path]::GetFullPath($root)
    $resolvedTarget = [System.IO.Path]::GetFullPath($target)

    if (!$resolvedTarget.StartsWith($resolvedRoot)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }

    if (!(Test-Path -LiteralPath $resolvedTarget -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($resolvedTarget)
    $ext = [System.IO.Path]::GetExtension($resolvedTarget).ToLowerInvariant()
    $context.Response.ContentType = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.css' { 'text/css; charset=utf-8' }
      '.js' { 'application/javascript; charset=utf-8' }
      '.jpg' { 'image/jpeg' }
      '.jpeg' { 'image/jpeg' }
      '.png' { 'image/png' }
      default { 'application/octet-stream' }
    }
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  } catch {
    if ($context) {
      $context.Response.StatusCode = 500
      $context.Response.Close()
    }
  }
}
