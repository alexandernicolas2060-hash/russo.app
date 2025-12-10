#!/bin/bash

echo "========================================"
echo "   CONSTRUYENDO APK DE RUSSO"
echo "========================================"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -d "mobile" ]; then
    echo "ERROR: No se encuentra la carpeta mobile."
    echo "Ejecuta este script desde la raíz del proyecto Russo."
    exit 1
fi

# Verificar si Expo CLI está instalado
if ! command -v expo &> /dev/null; then
    echo "ERROR: Expo CLI no está instalado."
    echo "Instala con: npm install -g expo-cli"
    exit 1
fi

# Verificar si hay una cuenta de Expo configurada
if ! expo whoami &> /dev/null; then
    echo "ERROR: No hay sesión de Expo iniciada."
    echo "Inicia sesión con: expo login"
    exit 1
fi

cd mobile

echo "1. Limpiando caché..."
expo prebuild --clean

echo ""
echo "2. Construyendo APK para Android..."
echo "Esto puede tomar varios minutos..."
echo ""

# Construir APK
expo build:android

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "   APK CONSTRUIDO EXITOSAMENTE!"
    echo "========================================"
    echo ""
    echo "El APK está disponible en:"
    echo "https://expo.dev/accounts/[TU_USUARIO]/projects/russo/builds"
    echo ""
    echo "Para descargar directamente:"
    echo "expo build:status"
else
    echo ""
    echo "========================================"
    echo "   ERROR EN LA CONSTRUCCIÓN"
    echo "========================================"
    echo "Revisa los errores arriba."
fi

cd ..