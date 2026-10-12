#!/bin/bash
# Daily backup of khanedade.ir data: MongoDB (articles, users, offices, listings...) + the
# scraper's SQLite results.db (scraped/user listings, schools, price analysis).
# Keeps the last 7 daily folders in /var/backups/khanedade. Cron: 30 3 * * *
set -euo pipefail
ROOT=/var/backups/khanedade
STAMP=$(date +%Y%m%d-%H%M)
DIR="$ROOT/$STAMP"
umask 077
mkdir -p "$DIR"
cd /var/www/melkeeno
URI=$(grep -E '^MONGODB_URI=' .env.production | cut -d= -f2- | tr -d '"')
MONGODB_URI="$URI" /usr/bin/node scripts/backup_mongo.js "$DIR/mongo"
python3 - "$DIR" <<'PY'
import sqlite3, sys, gzip, shutil, os
d = sys.argv[1]
src = sqlite3.connect('/var/www/melkeeno-scraper/results.db')
tmp = os.path.join(d, 'results.db')
dst = sqlite3.connect(tmp)
src.backup(dst)          # consistent snapshot even while the scraper is writing
dst.close(); src.close()
with open(tmp, 'rb') as f, gzip.open(tmp + '.gz', 'wb') as g:
    shutil.copyfileobj(f, g)
os.remove(tmp)
PY
echo "$STAMP ok" > "$DIR/DONE"
# retention: delete backup folders older than 7 days
find "$ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
echo "backup $STAMP complete: $(du -sh "$DIR" | cut -f1)"
