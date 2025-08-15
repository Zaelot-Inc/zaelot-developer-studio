#!/bin/bash

# Script to convert Zaelot SVG to macOS ICNS format
# Requires: rsvg-convert and iconutil (or online conversion tools)

echo "🎨 Zaelot Icon Conversion Guide"
echo "================================="
echo ""
echo "Para convertir tu SVG a ICNS para macOS:"
echo ""
echo "OPCIÓN 1 - Online (Recomendado):"
echo "1. Ve a https://convertio.co/svg-icns/"
echo "2. Sube tu archivo: resources/branding/zaelot-app-icon.svg"
echo "3. Descarga el archivo .icns"
echo "4. Reemplaza: resources/darwin/code.icns"
echo ""
echo "OPCIÓN 2 - Con herramientas de línea de comandos:"
echo "1. Instalar rsvg-convert: brew install librsvg"
echo "2. Crear PNG temporales:"

# Create temporary directory
mkdir -p /tmp/zaelot-icons

echo "   rsvg-convert -w 16 -h 16 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_16x16.png"
echo "   rsvg-convert -w 32 -h 32 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_16x16@2x.png"
echo "   rsvg-convert -w 32 -h 32 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_32x32.png"
echo "   rsvg-convert -w 64 -h 64 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_32x32@2x.png"
echo "   rsvg-convert -w 128 -h 128 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_128x128.png"
echo "   rsvg-convert -w 256 -h 256 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_128x128@2x.png"
echo "   rsvg-convert -w 256 -h 256 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_256x256.png"
echo "   rsvg-convert -w 512 -h 512 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_256x256@2x.png"
echo "   rsvg-convert -w 512 -h 512 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_512x512.png"
echo "   rsvg-convert -w 1024 -h 1024 resources/branding/zaelot-app-icon.svg > /tmp/zaelot-icons/icon_512x512@2x.png"
echo ""
echo "3. Crear el .icns:"
echo "   iconutil -c icns /tmp/zaelot-icons/ -o resources/darwin/zaelot.icns"
echo ""
echo "OPCIÓN 3 - Usar Image2icon (App de macOS):"
echo "1. Descarga Image2icon de la App Store"
echo "2. Arrastra tu SVG a la app"
echo "3. Exporta como .icns"
echo "4. Reemplaza resources/darwin/code.icns"
echo ""
echo "📁 Tu SVG está en: $(pwd)/resources/branding/zaelot-app-icon.svg"
echo "📁 Reemplazar: $(pwd)/resources/darwin/code.icns"
