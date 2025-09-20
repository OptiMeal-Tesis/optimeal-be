#!/bin/bash

# Script para probar control de stock
echo "🧪 Prueba del control de stock..."
echo ""

BASE_URL="http://localhost:3000/api"

# Función para hacer peticiones
make_request() {
    local method=$1
    local path=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        curl -s -X $method \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $token" \
             -d "$data" \
             "$BASE_URL$path"
    else
        curl -s -X $method \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$BASE_URL$path"
    fi
}

# 1. Login
echo "🔐 Iniciando sesión..."
LOGIN_DATA='{
    "email": "francisco.cavallaro@ing.austral.edu.ar",
    "password": "miPassword123!"
}'

LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "$LOGIN_DATA")

if ! echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "❌ Error en login: $LOGIN_RESPONSE"
    exit 1
fi

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ Login exitoso"
echo ""

# 2. Obtener productos
echo "📦 Obteniendo productos..."
PRODUCTS_RESPONSE=$(make_request "GET" "/products" "" "$TOKEN")
echo "✅ Productos obtenidos"
echo ""

# 3. Crear orden exitosa
echo "🛒 Creando orden exitosa..."

# Usar un horario que esté definitivamente en el futuro y dentro del rango 11-15
PICKUP_TIME="2025-09-20T14:30:00.000Z"

ORDER_DATA='{
    "items": [
        {
            "productId": 2,
            "quantity": 1
        }
    ],
    "pickUpTime": "'$PICKUP_TIME'"
}'

echo "   Horario de pickup: $PICKUP_TIME"
ORDER_RESPONSE=$(make_request "POST" "/orders" "$ORDER_DATA" "$TOKEN")
echo "   Respuesta: $ORDER_RESPONSE"

if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Orden creada exitosamente!"
    ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "   ID de orden: $ORDER_ID"
    
    # 4. Crear orden con stock insuficiente
    echo ""
    echo "🛒 Probando orden con stock insuficiente..."
    INVALID_ORDER_DATA='{
        "items": [
            {
                "productId": 2,
                "quantity": 999
            }
        ],
        "pickUpTime": "'$PICKUP_TIME'"
    }'
    
    INVALID_ORDER_RESPONSE=$(make_request "POST" "/orders" "$INVALID_ORDER_DATA" "$TOKEN")
    echo "   Respuesta: $INVALID_ORDER_RESPONSE"
    
    if echo "$INVALID_ORDER_RESPONSE" | grep -q '"success":false'; then
        echo "✅ Error esperado (stock insuficiente): $(echo $INVALID_ORDER_RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
    else
        echo "❌ Inesperado: La orden se creó cuando debería haber fallado"
    fi
    
    # 5. Verificar stock actualizado
    echo ""
    echo "📊 Verificando stock actualizado..."
    UPDATED_PRODUCTS_RESPONSE=$(make_request "GET" "/products" "" "$TOKEN")
    echo "✅ Stock verificado"
    
else
    echo "❌ Error creando orden: $ORDER_RESPONSE"
fi

echo ""
echo "✨ Prueba completada!"
echo ""
echo "🎯 Resumen:"
echo "   - Login: ✅ Exitoso"
echo "   - Productos: ✅ Obtenidos"
echo "   - Orden exitosa: $(if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then echo "✅ Creada"; else echo "❌ Falló"; fi)"
echo "   - Orden con stock insuficiente: $(if echo "$INVALID_ORDER_RESPONSE" | grep -q '"success":false'; then echo "✅ Error esperado"; else echo "❌ Inesperado"; fi)"
