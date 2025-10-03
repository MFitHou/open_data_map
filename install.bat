@echo off
echo ============================================
echo    OpenDataFitHou Installation Script
echo ============================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js 18+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set MAJOR_VERSION=%%i
if %MAJOR_VERSION% LSS 18 (
    echo [ERROR] Node.js version must be 18 or higher!
    echo Current version: %NODE_VERSION%
    echo Please update Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js %NODE_VERSION% detected
echo.

REM Check if Git is installed
echo [2/5] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please download and install Git from: https://git-scm.com/
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Check if we're already in the project directory
if exist "package.json" (
    echo [3/5] Already in project directory, skipping clone...
) else (
    echo [3/5] Cloning repository...
    git clone https://github.com/MFitHou/open_data_map.git
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to clone repository!
        pause
        exit /b 1
    )
    cd open_data_map
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found! Make sure you're in the correct directory.
    pause
    exit /b 1
)

echo [4/5] Installing dependencies...
echo This may take a few minutes...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    echo Try running: npm cache clean --force
    pause
    exit /b 1
)

echo.
echo [5/5] Verifying installation...
if exist "node_modules" (
    echo [OK] Dependencies installed successfully
) else (
    echo [ERROR] node_modules folder not found!
    pause
    exit /b 1
)

echo.
echo ============================================
echo     Installation completed successfully!
echo ============================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open your browser and navigate to:
echo   http://localhost:5173
echo.
echo For more information, see README.md
echo.
pause