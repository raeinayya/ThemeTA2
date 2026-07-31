#!/usr/bin/env bash
# =====================================================================
# reapply-theme.sh — pasang tema DAAT ke container Open WebUI
# Jalankan dari AKAR repo:  bash scripts/reapply-theme.sh
#
# Yang disalin adalah ARTEFAK RINGKAS (custom.min.css / custom.min.js),
# bukan berkas sumber. Sumber sengaja memuat komentar panjang yang
# merekam alasan setiap keputusan desain; komentar itu berguna untuk
# penulisan tesis, tetapi tidak berguna bagi browser dan membebani
# metrik Lighthouse karena custom.css bersifat render-blocking.
#
# Skrip ini MENOLAK berjalan bila artefak lebih tua daripada sumbernya,
# supaya tidak pernah ada versi basi yang diam-diam terpasang.
# =====================================================================
set -e

# Semua path di bawah relatif terhadap akar repo, sehingga skrip ini dapat
# dipanggil dari mana saja.
cd "$(dirname "$0")/.."

CONTAINER="open-webui"
CSS_SRC="theme/custom.css"
JS_SRC="theme/custom.js"
CSS="theme/custom.min.css"
JS="theme/custom.min.js"

# ---- 1. Pastikan artefak ada dan lebih baru daripada sumber ----------
need_build=0
[ -f "$CSS" ] || need_build=1
[ -f "$JS" ]  || need_build=1
[ -f "$CSS" ] && [ "$CSS_SRC" -nt "$CSS" ] && need_build=1
[ -f "$JS" ]  && [ "$JS_SRC"  -nt "$JS"  ] && need_build=1

if [ "$need_build" = "1" ]; then
  echo "==> Artefak ringkas belum ada atau lebih tua daripada sumber. Membangun ulang..."
  if command -v python3 >/dev/null 2>&1; then
    python3 scripts/build-theme.py
  else
    echo "!! python3 tidak ditemukan, sehingga artefak tidak bisa dibangun."
    echo "!! Menyalin berkas SUMBER apa adanya agar tetap ter-deploy dengan benar."
    CSS="$CSS_SRC"
    JS="$JS_SRC"
  fi
fi

echo "==> Menyalin tema ke container '$CONTAINER'..."

# Path yang benar-benar disajikan ke browser
docker cp "$CSS" "$CONTAINER":/app/build/static/custom.css
docker cp "$JS"  "$CONTAINER":/app/build/static/custom.js

# Path static backend, dijaga agar keduanya sinkron
docker cp "$CSS" "$CONTAINER":/app/backend/open_webui/static/custom.css
docker cp "$JS"  "$CONTAINER":/app/backend/open_webui/static/custom.js

# ---- 2. Pastikan index.html memuat custom.js dengan defer -------------
# PENTING: tanpa `defer`, skrip dieksekusi saat <head> masih diurai sehingga
# <body> belum ada (MutationObserver gagal terpasang) dan skrip menjadi
# render-blocking, yang menurunkan skor Performance.
if [ "$(docker exec "$CONTAINER" grep -c custom.js /app/build/index.html)" = "0" ]; then
  echo "==> Menambahkan <script defer custom.js> ke index.html..."
  docker exec "$CONTAINER" sed -i 's#</head>#<script defer src="/static/custom.js"></script></head>#' /app/build/index.html
else
  echo "==> Memastikan script custom.js memakai defer..."
  docker exec "$CONTAINER" sed -i 's#<script src="/static/custom.js"></script>#<script defer src="/static/custom.js"></script>#' /app/build/index.html
fi

# ---- 3. Verifikasi ---------------------------------------------------
echo "==> Verifikasi ukuran yang benar-benar disajikan ke browser:"
docker exec "$CONTAINER" sh -c 'wc -c /app/build/static/custom.css /app/build/static/custom.js'

echo "==> Versi yang akan dimuat browser:"
docker exec "$CONTAINER" grep -o "DAA_VERSION *= *'[^']*'" /app/build/static/custom.js | head -1

echo ""
echo "SELESAI. Buka http://localhost:3000 lalu hard refresh (Cmd+Shift+R)."
echo "Bandingkan dengan Open WebUI polos di http://localhost:3000/?daa=off"
