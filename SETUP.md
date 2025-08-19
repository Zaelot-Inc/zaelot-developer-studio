# Zaelot Developer Studio - Setup Guide

🚀 **Zaelot Developer Studio** es nuestro entorno de desarrollo interno basado en VSCode con integración de Claude AI.

## 📋 Requisitos Previos

- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **Git** ([Descargar](https://git-scm.com/))
- **Claude API Key** ([console.anthropic.com](https://console.anthropic.com))

## 🛠 Instalación y Build

### 1. Clonar y Configurar

```bash
git clone https://github.com/Zaelot-Inc/zaelot-developer-studio.git
cd zaelot-developer-studio
npm install
```

### 2. Build de Desarrollo

```bash
# Build rápido para desarrollo
npm run compile

# O usar nuestro script personalizado
./scripts/build-zaelot.sh
```

### 3. Build de Producción

```bash
# Build optimizado para distribución
./scripts/build-zaelot.sh --production
```

## 🚀 Ejecutar la Aplicación

### Modo Desarrollo

```bash
./scripts/code.sh
```

### Modo Web

```bash
./scripts/code-web.sh
```

## 🤖 Configuración de Claude AI

### 1. Obtener API Key

1. Ir a [console.anthropic.com](https://console.anthropic.com)
2. Crear una cuenta o iniciar sesión
3. Generar una nueva API key
4. Copiar la key (comienza con `sk-ant-`)

### 2. Configurar en Zaelot Developer Studio

#### Opción A: Interface Visual

1. Abrir **Command Palette** (`Cmd/Ctrl + Shift + P`)
2. Buscar "Configure Claude API Key"
3. Pegar tu API key
4. ¡Listo!

#### Opción B: Variable de Entorno

```bash
export CLAUDE_API_KEY="sk-ant-api03-..."
```

#### Opción C: Settings JSON

```json
{
	"claude.apiKey": "sk-ant-api03-...",
	"claude.model": "claude-3-5-sonnet-20241220"
}
```

### 3. Verificar Conexión

1. **Command Palette** → "Test Claude Connection"
2. Debe mostrar "Connection test successful!"

## ✨ Características Principales

### 🗣 **Chat con Claude**

- Panel de chat integrado
- Soporte para múltiples modelos de Claude
- Conversaciones contextuales con tu código
- Historial de conversaciones

### 📝 **Edición de Código con AI**

- Sugerencias inteligentes de código
- Explicaciones de funciones complejas
- Refactoring asistido por AI
- Generación de documentación

### 🔧 **Modelos Disponibles**

- **Claude 3.5 Sonnet** - Más capaz (recomendado)
- **Claude 3.5 Haiku** - Más rápido
- **Claude 3 Opus** - Más potente

### ⚙️ **Configuración Avanzada**

```json
{
	"claude.model": "claude-3-5-sonnet-20241220",
	"claude.maxTokens": 4096,
	"claude.temperature": 0.7,
	"claude.baseUrl": "https://api.anthropic.com"
}
```

## 🚨 Troubleshooting

### Error: "Claude is not configured"

- ✅ Verificar que la API key está configurada
- ✅ Verificar formato de la key (`sk-ant-...`)
- ✅ Verificar conexión a internet

### Error: "API key invalid"

- ✅ Regenerar API key en console.anthropic.com
- ✅ Verificar que no hay espacios extra
- ✅ Verificar que la cuenta tiene créditos

### Error de Compilación

```bash
# Limpiar y reinstalar dependencias
rm -rf node_modules out
npm install
npm run compile
```

### Claude no responde

- ✅ Verificar límites de rate de la API
- ✅ Verificar créditos de la cuenta
- ✅ Intentar con otro modelo

## 📊 Monitoreo de Uso

### Ver Tokens Utilizados

Los logs muestran automáticamente el uso de tokens:

```
Claude response completed. Tokens used: 150 input, 300 output
```

### Configurar Límites

```json
{
	"claude.maxTokens": 2048 // Reducir para ahorrar costos
}
```

## 🔒 Seguridad

### Mejores Prácticas

- ✅ No compartir API keys
- ✅ Usar variables de entorno en producción
- ✅ Rotar keys periódicamente
- ✅ Monitorear uso de tokens

### Solo para Uso Interno

Este software es exclusivo para el equipo de Zaelot. No distribuir fuera de la empresa.

## 📞 Soporte

Para soporte interno contactar:

- **Slack**: #dev-tools
- **Email**: dev-team@zaelot.com

## 🔄 Actualizaciones

### Actualizar Claude Integration

```bash
git pull origin main
npm install
npm run compile
```

### Verificar Nuevas Funcionalidades

```bash
# Ver changelog
git log --oneline --grep="claude\|Claude"
```

---

**Hecho con ❤️ para el equipo de Zaelot**
