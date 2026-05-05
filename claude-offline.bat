@echo off
setlocal EnableDelayedExpansion
title Claude Code -- Offline Setup ^& Launch
color 0A

echo.
echo  =========================================================
echo   Claude Code - Offline Mode  ^|  GLM-4 via Ollama
echo  =========================================================
echo.

:: ─────────────────────────────────────────────────────────────────────────────
:: Helper: refresh PATH from registry (picks up newly installed tools)
:: ─────────────────────────────────────────────────────────────────────────────
goto :main

:RefreshPath
    for /f "usebackq delims=" %%A in (
        `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('PATH','Machine')"`
    ) do set "_M=%%A"
    for /f "usebackq delims=" %%A in (
        `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('PATH','User')"`
    ) do set "_U=%%A"
    set "PATH=!_M!;!_U!"
    exit /b 0

:: ─────────────────────────────────────────────────────────────────────────────
:: Helper: wait until a TCP port accepts connections
::   %1 = port   %2 = max attempts (each ~2 s)
:: ─────────────────────────────────────────────────────────────────────────────
:WaitPort
    set "_p=%~1" & set "_max=%~2" & set "_i=0"
    :_wp
        powershell -NoProfile -Command ^
            "try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('127.0.0.1',%_p%);$c.Close();exit 0}catch{exit 1}" >nul 2>&1
        if not errorlevel 1 exit /b 0
        set /a "_i+=1"
        if !_i! geq %_max% exit /b 1
        timeout /t 2 /nobreak >nul
    goto _wp

:: ─────────────────────────────────────────────────────────────────────────────
:main
:: ─────────────────────────────────────────────────────────────────────────────

:: ── 1. Ollama ─────────────────────────────────────────────────────────────────
echo  [1/5] Ollama
where ollama >nul 2>&1
if errorlevel 1 (
    echo       Not found - installing via winget ^(user scope, no admin needed^)...
    winget install --id Ollama.Ollama --scope user --silent ^
        --accept-source-agreements --accept-package-agreements
    call :RefreshPath
    where ollama >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [FAIL] Ollama still not found after install.
        echo         Download manually: https://ollama.com/download/windows
        echo         Then re-run this script.
        echo.
        pause
        exit /b 1
    )
)
echo       OK

:: ── 2. Python ─────────────────────────────────────────────────────────────────
echo  [2/5] Python
where python >nul 2>&1
if errorlevel 1 (
    echo       Not found - installing via winget...
    winget install --id Python.Python.3.12 --scope user --silent ^
        --accept-source-agreements --accept-package-agreements
    call :RefreshPath
    where python >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [FAIL] Python still not found after install.
        echo         Download manually: https://python.org/downloads
        echo         Make sure to check "Add to PATH" during install.
        echo.
        pause
        exit /b 1
    )
)
echo       OK

:: ── 3. LiteLLM ───────────────────────────────────────────────────────────────
echo  [3/5] LiteLLM proxy
python -c "import litellm" >nul 2>&1
if errorlevel 1 (
    echo       Not found - running: pip install litellm[proxy]
    echo       ^(this takes 1-3 minutes^)...
    pip install "litellm[proxy]" -q
    python -c "import litellm" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [FAIL] LiteLLM install failed.
        echo         Try manually: pip install "litellm[proxy]"
        echo.
        pause
        exit /b 1
    )
)
:: Add Python user Scripts dir to PATH so litellm.exe is findable
for /f "usebackq delims=" %%A in (
    `python -c "import sysconfig; print(sysconfig.get_path('scripts','nt_user'))" 2^>nul`
) do set "PATH=%%A;!PATH!"
echo       OK

:: ── 4. Node.js + Claude Code ──────────────────────────────────────────────────
echo  [4/5] Claude Code CLI
where claude >nul 2>&1
if errorlevel 1 (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo       Node.js not found - installing via winget...
        winget install --id OpenJS.NodeJS.LTS --scope user --silent ^
            --accept-source-agreements --accept-package-agreements
        call :RefreshPath
        where npm >nul 2>&1
        if errorlevel 1 (
            echo.
            echo  [FAIL] Node.js still not found after install.
            echo         Download manually: https://nodejs.org
            echo.
            pause
            exit /b 1
        )
    )
    echo       Installing Claude Code CLI...
    npm install -g @anthropic-ai/claude-code
    call :RefreshPath
    where claude >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [FAIL] claude command not found after npm install.
        echo         Close this window, open a new terminal, and re-run.
        echo.
        pause
        exit /b 1
    )
)
echo       OK

:: ── 5. Start Ollama + pull GLM-4 ─────────────────────────────────────────────
echo  [5/5] GLM-4 model
tasklist /fi "imagename eq ollama.exe" 2>nul | find /i "ollama.exe" >nul
if errorlevel 1 (
    echo       Starting Ollama service...
    start "" /b ollama serve
    timeout /t 3 /nobreak >nul
)
echo       Pulling glm4 ^(skipped if already downloaded^)...
ollama pull glm4
if errorlevel 1 (
    echo.
    echo  [FAIL] Could not pull glm4. Is Ollama running and internet available?
    echo.
    pause
    exit /b 1
)
echo       OK

:: ── Write LiteLLM config ──────────────────────────────────────────────────────
set "CFG=%TEMP%\litellm_claude_offline.yaml"
(
    echo model_list:
    echo   - model_name: glm4
    echo     litellm_params:
    echo       model: ollama/glm4
    echo       api_base: http://localhost:11434
    echo.
    echo general_settings:
    echo   master_key: sk-offline-local
) > "%CFG%"

:: ── Start LiteLLM proxy ───────────────────────────────────────────────────────
echo.
echo  Starting LiteLLM proxy on port 4000...
call :WaitPort 4000 1
if not errorlevel 1 (
    echo  Proxy already running.
) else (
    start "LiteLLM [claude-offline]" /min cmd /k "python -m litellm --config "%CFG%" --port 4000"
    echo  Waiting for proxy ^(up to 60 s^)...
    call :WaitPort 4000 30
    if errorlevel 1 (
        echo.
        echo  [FAIL] LiteLLM proxy did not respond within 60 s.
        echo         Check the minimised LiteLLM window for errors.
        echo.
        pause
        exit /b 1
    )
    echo  Proxy ready.
)

:: ── Launch Claude Code ────────────────────────────────────────────────────────
echo.
echo  =========================================================
echo   All set! Launching Claude Code (offline / GLM-4)
echo  =========================================================
echo.

set "ANTHROPIC_BASE_URL=http://localhost:4000"
set "ANTHROPIC_AUTH_TOKEN=sk-offline-local"
set "ANTHROPIC_CUSTOM_MODEL_OPTION=glm4"
set "ANTHROPIC_CUSTOM_MODEL_OPTION_NAME=Ollama GLM-4"
set "ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION=Local Ollama instance"
set "API_TIMEOUT_MS=600000"
set "CLAUDE_CODE_ATTRIBUTION_HEADER=0"

claude
