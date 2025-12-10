@echo off
echo ========================================
echo    INICIANDO APLICACION RUSSO
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado.
    echo Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si npm está instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm no está instalado.
    pause
    exit /b 1
)

echo 1. Iniciando Backend...
cd backend
if not exist node_modules (
    echo Instalando dependencias del backend...
    call npm install
)
echo Iniciando servidor backend...
start cmd /k "npm start"

timeout /t 3 /nobreak >nul
cd ..

echo.
echo 2. Iniciando App Móvil...
cd mobile
if not exist node_modules (
    echo Instalando dependencias de la app móvil...
    call npm install
)

echo.
echo ========================================
echo    RUSSO ESTA LISTO PARA USARSE!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo App móvil: Escanea el código QR con Expo Go
echo.
echo Presiona cualquier tecla para iniciar la app móvil...
pause >nul

echo Iniciando app móvil...
call npm start

echo.
echo Para detener la aplicación, cierra todas las ventanas de comandos.
pause