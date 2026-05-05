Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LITELLM_CONFIG = Join-Path $SCRIPT_DIR "litellm-config.yaml"
$LITELLM_PORT   = 4000

# ── helpers ──────────────────────────────────────────────────────────────────

function Test-PortOpen([int]$port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    } catch { return $false }
}

function Test-CommandExists([string]$cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Set-Status([string]$msg, [System.Drawing.Color]$color) {
    $lblStatus.Text      = $msg
    $lblStatus.ForeColor = $color
    $form.Refresh()
}

# ── form ─────────────────────────────────────────────────────────────────────

$form                  = New-Object System.Windows.Forms.Form
$form.Text             = "Claude Code — Offline Launcher"
$form.Size             = New-Object System.Drawing.Size(480, 390)
$form.StartPosition    = "CenterScreen"
$form.FormBorderStyle  = "FixedDialog"
$form.MaximizeBox      = $false
$form.Font             = New-Object System.Drawing.Font("Segoe UI", 9)
$form.BackColor        = [System.Drawing.Color]::FromArgb(30, 30, 30)
$form.ForeColor        = [System.Drawing.Color]::WhiteSmoke

function New-Label([string]$text, [int]$x, [int]$y, [int]$w = 130, [int]$h = 20) {
    $l = New-Object System.Windows.Forms.Label
    $l.Text = $text; $l.Location = New-Object System.Drawing.Point($x, $y)
    $l.Size = New-Object System.Drawing.Size($w, $h); $l.ForeColor = [System.Drawing.Color]::Silver
    return $l
}

function New-TextBox([string]$default, [int]$x, [int]$y, [int]$w = 300) {
    $t = New-Object System.Windows.Forms.TextBox
    $t.Text = $default; $t.Location = New-Object System.Drawing.Point($x, $y)
    $t.Size = New-Object System.Drawing.Size($w, 22)
    $t.BackColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
    $t.ForeColor = [System.Drawing.Color]::WhiteSmoke
    $t.BorderStyle = "FixedSingle"
    return $t
}

$yBase = 20
$xLabel = 20; $xField = 155

# Ollama base URL
$form.Controls.Add((New-Label "Ollama URL:" $xLabel $yBase))
$txtOllamaUrl = New-TextBox "http://localhost:11434" $xField $yBase
$form.Controls.Add($txtOllamaUrl)
$yBase += 38

# LiteLLM port
$form.Controls.Add((New-Label "LiteLLM port:" $xLabel $yBase))
$txtPort = New-TextBox "4000" $xField $yBase 80
$form.Controls.Add($txtPort)
$yBase += 38

# Model
$form.Controls.Add((New-Label "Ollama model:" $xLabel $yBase))
$txtModel = New-TextBox "glm4" $xField $yBase
$form.Controls.Add($txtModel)
$yBase += 38

# Timeout
$form.Controls.Add((New-Label "Timeout (ms):" $xLabel $yBase))
$txtTimeout = New-TextBox "600000" $xField $yBase 120
$form.Controls.Add($txtTimeout)
$yBase += 38

# Working dir
$form.Controls.Add((New-Label "Working dir:" $xLabel $yBase))
$txtDir = New-TextBox (Get-Location).Path $xField $yBase
$form.Controls.Add($txtDir)
$yBase += 50

# Status label
$lblStatus = New-Object System.Windows.Forms.Label
$lblStatus.Text      = "Ready."
$lblStatus.Location  = New-Object System.Drawing.Point($xLabel, $yBase)
$lblStatus.Size      = New-Object System.Drawing.Size(435, 20)
$lblStatus.ForeColor = [System.Drawing.Color]::Silver
$form.Controls.Add($lblStatus)
$yBase += 30

# Pull model button
$btnPull = New-Object System.Windows.Forms.Button
$btnPull.Text      = "Pull Model"
$btnPull.Location  = New-Object System.Drawing.Point($xLabel, $yBase)
$btnPull.Size      = New-Object System.Drawing.Size(100, 34)
$btnPull.BackColor = [System.Drawing.Color]::FromArgb(60, 60, 80)
$btnPull.ForeColor = [System.Drawing.Color]::WhiteSmoke
$btnPull.FlatStyle = "Flat"
$form.Controls.Add($btnPull)

# Start proxy button
$btnProxy = New-Object System.Windows.Forms.Button
$btnProxy.Text      = "Start Proxy"
$btnProxy.Location  = New-Object System.Drawing.Point(($xLabel + 115), $yBase)
$btnProxy.Size      = New-Object System.Drawing.Size(100, 34)
$btnProxy.BackColor = [System.Drawing.Color]::FromArgb(60, 80, 60)
$btnProxy.ForeColor = [System.Drawing.Color]::WhiteSmoke
$btnProxy.FlatStyle = "Flat"
$form.Controls.Add($btnProxy)

# Launch Claude button
$btnLaunch = New-Object System.Windows.Forms.Button
$btnLaunch.Text      = "Launch Claude Code"
$btnLaunch.Location  = New-Object System.Drawing.Point(($xLabel + 230), $yBase)
$btnLaunch.Size      = New-Object System.Drawing.Size(160, 34)
$btnLaunch.BackColor = [System.Drawing.Color]::FromArgb(80, 80, 160)
$btnLaunch.ForeColor = [System.Drawing.Color]::White
$btnLaunch.FlatStyle = "Flat"
$form.Controls.Add($btnLaunch)

# ── prerequisite check on load ────────────────────────────────────────────────

$form.Add_Shown({
    $missing = @()
    if (-not (Test-CommandExists "ollama"))  { $missing += "ollama" }
    if (-not (Test-CommandExists "litellm")) { $missing += "litellm" }
    if (-not (Test-CommandExists "claude"))  { $missing += "claude" }
    if ($missing.Count -gt 0) {
        Set-Status "Missing: $($missing -join ', '). See README for install steps." ([System.Drawing.Color]::OrangeRed)
    } else {
        Set-Status "All prerequisites found. Ready to launch." ([System.Drawing.Color]::LightGreen)
    }
})

# ── Pull model ────────────────────────────────────────────────────────────────

$btnPull.Add_Click({
    $model = $txtModel.Text.Trim()
    if (-not $model) { Set-Status "Enter a model name first." ([System.Drawing.Color]::OrangeRed); return }
    Set-Status "Pulling $model — a terminal window will open..." ([System.Drawing.Color]::Khaki)
    Start-Process "cmd.exe" -ArgumentList "/k ollama pull $model" -WindowStyle Normal
})

# ── Start LiteLLM proxy ───────────────────────────────────────────────────────

$btnProxy.Add_Click({
    $port    = $txtPort.Text.Trim()
    $model   = $txtModel.Text.Trim()
    $baseUrl = $txtOllamaUrl.Text.Trim()

    if (Test-PortOpen ([int]$port)) {
        Set-Status "Port $port already in use — proxy may already be running." ([System.Drawing.Color]::Khaki)
        return
    }

    # Write litellm config dynamically (overrides file on disk with current GUI values)
    $yaml = @"
model_list:
  - model_name: $model
    litellm_params:
      model: ollama/$model
      api_base: $baseUrl

general_settings:
  master_key: sk-offline-local
"@
    Set-Content -Path $LITELLM_CONFIG -Value $yaml -Encoding utf8

    Set-Status "Starting LiteLLM proxy on port $port..." ([System.Drawing.Color]::Khaki)
    Start-Process "cmd.exe" -ArgumentList "/k litellm --config `"$LITELLM_CONFIG`" --port $port" -WindowStyle Normal

    # Poll until proxy is up (max 30 s)
    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 800
        if (Test-PortOpen ([int]$port)) {
            Set-Status "Proxy is running on port $port." ([System.Drawing.Color]::LightGreen)
            return
        }
    }
    Set-Status "Proxy did not respond within 30 s — check the terminal." ([System.Drawing.Color]::OrangeRed)
})

# ── Launch Claude Code ────────────────────────────────────────────────────────

$btnLaunch.Add_Click({
    $port    = $txtPort.Text.Trim()
    $model   = $txtModel.Text.Trim()
    $timeout = $txtTimeout.Text.Trim()
    $workDir = $txtDir.Text.Trim()

    if (-not (Test-PortOpen ([int]$port))) {
        Set-Status "Proxy not reachable on port $port — start it first." ([System.Drawing.Color]::OrangeRed)
        return
    }

    $env = @(
        "ANTHROPIC_BASE_URL=http://localhost:$port",
        "ANTHROPIC_AUTH_TOKEN=sk-offline-local",
        "ANTHROPIC_CUSTOM_MODEL_OPTION=$model",
        "ANTHROPIC_CUSTOM_MODEL_OPTION_NAME=Ollama $model",
        "ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION=Local Ollama instance",
        "API_TIMEOUT_MS=$timeout",
        "CLAUDE_CODE_ATTRIBUTION_HEADER=0"
    )
    $envStr = ($env | ForEach-Object { "set `"$_`" && " }) -join ""

    $cmd = "${envStr}cd /d `"$workDir`" && claude"
    Start-Process "cmd.exe" -ArgumentList "/k $cmd" -WindowStyle Normal
    Set-Status "Claude Code launched in new terminal." ([System.Drawing.Color]::LightGreen)
})

[void]$form.ShowDialog()
