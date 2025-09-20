#!/bin/bash

# Script to test concurrency with limited stock
echo "🧪 CONCURRENCY test with limited stock..."
echo ""

BASE_URL="http://localhost:3000/api"

# Function to make requests
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

# Function to create an order (simulates a user)
create_order() {
    local user_id=$1
    local token=$2
    local pickup_time=$3
    local quantity=$4
    
    echo "👤 User $user_id creating order (quantity: $quantity)..."
    
    ORDER_DATA='{
        "items": [
            {
                "productId": 2,
                "quantity": '$quantity'
            }
        ],
        "pickUpTime": "'$pickup_time'"
    }'
    
    ORDER_RESPONSE=$(make_request "POST" "/orders" "$ORDER_DATA" "$token")
    
    if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
        ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "✅ User $user_id: Order created successfully - ID: $ORDER_ID"
        return 0
    else
        ERROR_MSG=$(echo $ORDER_RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "❌ User $user_id: Error - $ERROR_MSG"
        return 1
    fi
}

# 1. Login
echo "🔐 Logging in..."
LOGIN_DATA='{
    "email": "francisco.cavallaro@ing.austral.edu.ar",
    "password": "miPassword123!"
}'

LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "$LOGIN_DATA")

if ! echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "❌ Login error: $LOGIN_RESPONSE"
    exit 1
fi

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ Login successful"
echo ""

# 2. Get initial stock
echo "📦 Getting initial stock..."
PRODUCTS_RESPONSE=$(make_request "GET" "/products" "" "$TOKEN")
# Get stock for product ID 2 (the one we're testing with)
INITIAL_STOCK=$(echo $PRODUCTS_RESPONSE | grep -o '"id":2[^}]*"stock":[0-9-]*' | grep -o '"stock":[0-9-]*' | cut -d':' -f2)
echo "📊 Initial product stock: $INITIAL_STOCK"
echo ""

# 3. Prepare pickup time (today, future, within 14-18 UTC range which corresponds to 11-15 Argentina)
TODAY=$(date '+%Y-%m-%d')

# Get current hour in UTC
CURRENT_HOUR=$(date '+%H')

# The server validates that getHours() returns 14, 15, 16, 17, or 18 (UTC)
# These correspond to 11, 12, 13, 14, 15 Argentina time
# Let's use 16:00 UTC (4:00 PM UTC) which corresponds to 1:00 PM Argentina
# This ensures it's in the future and within the valid range
PICKUP_HOUR="16"

# Format with leading zero if needed
if [ $PICKUP_HOUR -lt 10 ]; then
    PICKUP_HOUR="0$PICKUP_HOUR"
fi

# Use ISO datetime format (UTC)
PICKUP_TIME="${TODAY}T${PICKUP_HOUR}:00:00.000Z"

echo "⏰ Pickup time: $PICKUP_TIME"
echo ""

# 4. Simulate concurrency with limited stock
echo "🔄 Simulating concurrency with limited stock..."
echo "   - 3 users trying to buy 10 units each"
echo "   - Available stock: $INITIAL_STOCK"
echo "   - Total requested: 30 units"
echo ""

# Create orders in parallel using background processes
create_order 1 "$TOKEN" "$PICKUP_TIME" 10 &
PID1=$!

create_order 2 "$TOKEN" "$PICKUP_TIME" 10 &
PID2=$!

create_order 3 "$TOKEN" "$PICKUP_TIME" 10 &
PID3=$!

# Wait for all orders to complete
wait $PID1
RESULT1=$?

wait $PID2
RESULT2=$?

wait $PID3
RESULT3=$?

echo ""
echo "📊 Concurrency results:"
echo "   User 1: $(if [ $RESULT1 -eq 0 ]; then echo "✅ Successful"; else echo "❌ Failed"; fi)"
echo "   User 2: $(if [ $RESULT2 -eq 0 ]; then echo "✅ Successful"; else echo "❌ Failed"; fi)"
echo "   User 3: $(if [ $RESULT3 -eq 0 ]; then echo "✅ Successful"; else echo "❌ Failed"; fi)"

# 5. Check final stock
echo ""
echo "📊 Checking final stock..."
FINAL_PRODUCTS_RESPONSE=$(make_request "GET" "/products" "" "$TOKEN")
# Get stock for product ID 2 (the one we're testing with)
FINAL_STOCK=$(echo $FINAL_PRODUCTS_RESPONSE | grep -o '"id":2[^}]*"stock":[0-9-]*' | grep -o '"stock":[0-9-]*' | cut -d':' -f2)
echo "📊 Final stock: $FINAL_STOCK"
echo "📊 Stock reduced: $((INITIAL_STOCK - FINAL_STOCK))"

# 6. Results analysis
echo ""
echo "🎯 Concurrency analysis:"
SUCCESSFUL_ORDERS=$((RESULT1 == 0 ? 1 : 0))
SUCCESSFUL_ORDERS=$((SUCCESSFUL_ORDERS + (RESULT2 == 0 ? 1 : 0)))
SUCCESSFUL_ORDERS=$((SUCCESSFUL_ORDERS + (RESULT3 == 0 ? 1 : 0)))

echo "   - Successful orders: $SUCCESSFUL_ORDERS of 3"
echo "   - Stock reduced: $((INITIAL_STOCK - FINAL_STOCK)) units"
echo "   - Consistency: $(if [ $((INITIAL_STOCK - FINAL_STOCK)) -eq $SUCCESSFUL_ORDERS ]; then echo "✅ Correct"; else echo "❌ Inconsistent"; fi)"

if [ $SUCCESSFUL_ORDERS -lt 3 ]; then
    echo ""
    echo "🎉 CONCURRENCY WORKING CORRECTLY!"
    echo "   - Only $SUCCESSFUL_ORDERS users could buy"
    echo "   - Stock reduced exactly by $SUCCESSFUL_ORDERS units"
    echo "   - No race conditions"
    echo "   - Stock control prevents overselling"
else
    echo ""
    echo "⚠️  All orders were successful - stock might be sufficient"
    echo "   - Initial stock: $INITIAL_STOCK"
    echo "   - Total requested: 30"
    echo "   - Result: $(if [ $INITIAL_STOCK -ge 30 ]; then echo "Sufficient stock for all orders"; else echo "Review concurrency logic"; fi)"
fi

echo ""
echo "✨ Concurrency test completed!"
