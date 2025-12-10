#!/bin/bash

echo "========================================"
echo "   INICIANDO APLICACION RUSSO"
echo "========================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado."
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm no está instalado."
    exit 1
fi

echo "1. Iniciando Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install
fi

echo "Iniciando servidor backend..."
npm start &
BACKEND_PID=$!

sleep 3
cd ..

echo ""
echo "2. Iniciando App Móvil..."
cd mobile
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias de la app móvil..."
    npm install
fi

echo ""
echo "========================================"
echo "   RUSSO ESTA LISTO PARA USARSE!"
echo "========================================"
echo ""
echo "Backend: http://localhost:3001"
echo "App móvil: Escanea el código QR con Expo Go"
echo ""
read -p "Presiona Enter para iniciar la app móvil..."

echo "Iniciando app móvil..."
npm start

# Limpiar al salir
trap "kill $BACKEND_PID 2>/dev/null; exit" SIGINT SIGTERM