#!/bin/bash
# Prisma requires MongoDB replica set for CREATE/UPDATE/DELETE via API.
# Run once with: bash scripts/setup-mongodb.sh

set -e

echo "=== MongoDB Replica Set Setup for Prisma ==="
echo ""

if grep -q "replSetName" /etc/mongod.conf 2>/dev/null; then
  echo "[OK] replSetName already in /etc/mongod.conf"
else
  echo "Adding replica set to /etc/mongod.conf (requires sudo)..."
  sudo sed -i 's/#replication:/replication:\n  replSetName: "rs0"/' /etc/mongod.conf
  echo "Restarting MongoDB..."
  sudo systemctl restart mongod
  sleep 3
fi

echo "Initializing replica set..."
mongosh --quiet --eval "
  try {
    var status = rs.status();
    print('[OK] Replica set already running: ' + status.set);
  } catch (e) {
    rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] });
    print('[OK] Replica set initialized');
  }
"

echo ""
echo "=== Done! ==="
echo "Now run:  npm run db:seed"
echo "Then:     npm run dev"
