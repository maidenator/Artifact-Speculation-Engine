$ErrorActionPreference = "Stop"

# 1. Activate Emscripten environment
$emsdkPath = "$PSScriptRoot\emscripten\emsdk\emsdk_env.ps1"

if (-not (Test-Path $emsdkPath)) {
    Write-Error "Could not find emsdk_env.ps1 at $emsdkPath. Please verify the folder structure."
    exit 1
}

# Run the activation script in the current session
& $emsdkPath

# 2. Ensure target directory exists
New-Item -ItemType Directory -Force -Path "src/wasm" | Out-Null

# 3. Compile C++ to WebAssembly with ES6 module exports
em++ -O3 `
    -profiling `
    -std=c++20 `
    --bind `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s 'EXPORT_NAME="createArtifactEngine"' `
    -s EXPORT_ES6=1 `
    -s ALLOW_MEMORY_GROWTH=1 `
    -s MAXIMUM_MEMORY=512MB `
    -s NO_DISABLE_EXCEPTION_CATCHING `
    -s ENVIRONMENT='web,worker' `
    -I build/_deps/nlohmann_json-src/include `
    -I cpp `
    -I cpp/artifact `
    -I cpp/domain `
    cpp/artifact/bindings.cpp `
    -o src/wasm/artifact_engine.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nWebAssembly build succeeded! Generated files in src/wasm/" -ForegroundColor Green
    
    # Copy the generated .wasm file to the public directory so Vite can serve it
    Write-Host "Copying artifact_engine.wasm to public/ directory..." -ForegroundColor Cyan
    Copy-Item -Path "src/wasm/artifact_engine.wasm" -Destination "public/artifact_engine.wasm" -Force
    Write-Host "Done!" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}