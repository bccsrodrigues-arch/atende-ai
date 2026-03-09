#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP CENTRALIZADO - Atende AI e Voice Agent
# ═══════════════════════════════════════════════════════════════════════════════

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 SETUP CENTRALIZADO - SISTEMAS COMPLETOS         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Verificar Node.js
echo -e "${YELLOW}[1/4]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    echo -e "   Instale de: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js ${NC}$(node -v)"
echo -e "${GREEN}✅ npm ${NC}$(npm -v)\n"

# Instalar dependências raiz
echo -e "${YELLOW}[2/4]${NC} Instalando dependências Atende AI..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências raiz${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências raiz instaladas\n"

# Instalar dependências voice-agent
echo -e "${YELLOW}[3/4]${NC} Instalando dependências Voice Agent..."
cd voice-agent
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências voice-agent${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências voice-agent instaladas\n"

# Setup banco voice-agent
echo -e "${YELLOW}[4/4]${NC} Inicializando banco de dados Voice Agent..."
npm run setup-db
cd ..
echo -e "${GREEN}✅ Banco de dados inicializado\n"

echo -e "${GREEN}🎉 Setup completo!${NC}"
echo -e "${YELLOW}Para executar:${NC}"
echo -e "  Atende AI: ${BLUE}npm start${NC} (porta 3000)"
echo -e "  Voice Agent: ${BLUE}cd voice-agent && npm start${NC} (porta 3000)"
echo -e "  Voice Agent Frontend: ${BLUE}cd voice-agent && npm run client${NC} (porta 8080)"