#!/usr/bin/env bash
# ==============================================================================
# Skrip Verifikasi 2-Node Load Balancing & Failover
# ==============================================================================

TARGET_URL="${1:-http://localhost/api/v1/health}"
COUNT="${2:-10}"

echo "=========================================================="
echo " Pengujian Load Balancer & High Availability (ArahIn)"
echo " Target : $TARGET_URL"
echo " Jumlah : $COUNT requests"
echo "=========================================================="

echo ""
echo "Mengirim request..."
echo "----------------------------------------------------------"
printf "%-5s | %-12s | %-20s | %-10s\n" "No" "Node ID" "Upstream Addr" "Status"
echo "----------------------------------------------------------"

for i in $(seq 1 "$COUNT"); do
  RESP=$(curl -s -i "$TARGET_URL")
  STATUS=$(echo "$RESP" | grep -i "^HTTP" | awk '{print $2}')
  NODE=$(echo "$RESP" | grep -i "^x-node-id:" | awk '{print $2}' | tr -d '\r')
  UPSTREAM=$(echo "$RESP" | grep -i "^x-served-by:" | awk '{print $2}' | tr -d '\r')
  
  if [ -z "$NODE" ]; then
    NODE=$(echo "$RESP" | grep -o '"node":"[^"]*"' | cut -d'"' -f4)
  fi

  printf "%-5s | %-12s | %-20s | %-10s\n" "$i" "${NODE:-unknown}" "${UPSTREAM:-unknown}" "${STATUS:-err}"
  sleep 0.2
done

echo "----------------------------------------------------------"
echo "Selesai! Periksa apakah request terbagi rata antara node-1 dan node-2."
