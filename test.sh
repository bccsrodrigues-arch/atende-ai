#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# TESTE CENTRALIZADO - Atende AI e Voice Agent
# ═══════════════════════════════════════════════════════════════════════════════

echo "🧪 TESTE CENTRALIZADO - SISTEMAS"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

# Função de teste
test_endpoint() {
    local url=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local description=$5

    echo -n "🧪 $description... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url$endpoint")
    else
        response=$(curl -s -X $method "$url$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo -e "${GREEN}✅ PASSOU${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ FALHOU${NC}"
        FAIL=$((FAIL + 1))
    fi
}

echo "Testando Atende AI (porta 3000)..."
test_endpoint "http://localhost:3000" "GET" "/health" "" "Health Atende AI"

echo ""
echo "Testando Voice Agent (porta 3000)..."
test_endpoint "http://localhost:3000" "GET" "/api/health" "" "Health Voice Agent"

echo ""
echo "Resultados: $PASS passaram, $FAIL falharam"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
else
    echo -e "${RED}❌ Alguns testes falharam. Verifique se os servidores estão rodando.${NC}"
fi