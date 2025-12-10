@echo off
chcp 65001 >nul
title 🚀 Russo - Servidor de Aplicación de Lujo
color 0F

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║               🚀 RUSSO APPLICATION                    ║
echo ║               Versión 1.0.0 - Exclusive               ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo 📁 Verificando estructura del proyecto...
if not exist backend (
    echo ❌ ERROR: No se encuentra la carpeta 'backend'
    echo    Ejecuta este script desde la raíz del proyecto Russo
    pause
    exit /b 1
)

if not exist mobile (
    echo ❌ ERROR: No se encuentra la carpeta 'mobile'
    echo    Ejecuta este script desde la raíz del proyecto Russo
    pause
    exit /b 1
)

echo ✅ Estructura del proyecto verificada
echo.

echo 🔧 Iniciando configuración del servidor...
cd backend

if not exist node_modules (
    echo 📦 Instalando dependencias del backend...
    call npm install
    if errorlevel 1 (
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
    echo.
)

echo 🗄️  Verificando base de datos...
if not exist data\russo.db (
    echo 📊 Creando base de datos inicial...
    node setup.js
    if errorlevel 1 (
        echo ❌ Error al crear la base de datos
        pause
        exit /b 1
    )
    echo ✅ Base de datos creada
    echo.
)

echo 🌐 Iniciando servidor backend...
echo.
echo ═════════════════════════════════════════════════════════
echo    🔗 URL: http://localhost:3000
echo    📊 Health: http://localhost:3000/api/health
echo    📱 Config: http://localhost:3000/api/config/mobile
echo ═════════════════════════════════════════════════════════
echo.
echo 📝 Presiona Ctrl+C para detener el servidor
echo.

call npm start

if errorlevel 1 (
    echo ❌ Error al iniciar el servidor
    echo.
    echo 🔍 Posibles soluciones:
    echo 1. Verifica que el puerto 3000 no esté en uso
    echo 2. Reinstala dependencias: npm ci
    echo 3. Verifica el archivo .env
    pause
    exit /b 1
)
