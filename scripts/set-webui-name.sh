#!/usr/bin/env bash
# =====================================================================
# set-webui-name.sh — ganti nama aplikasi Open WebUI pada container
#
#   bash set-webui-name.sh default     -> nama menjadi "Open WebUI"
#   bash set-webui-name.sh daat        -> nama menjadi "Data Analysis Agent"
#
# Nama aplikasi berasal dari variabel lingkungan WEBUI_NAME, yang hanya
# dapat disetel saat container dibuat. Penggantian nama lewat Admin Panel
# merupakan fitur berlisensi pada Open WebUI, sehingga container harus
# dibuat ulang.
#
# AMAN: seluruh data (chat, akun, Tool, Filter, koneksi Ollama) tersimpan
# pada named volume "open-webui" di /app/backend/data, di LUAR container.
# Membuat ulang container tidak menyentuh volume tersebut.
#
# Konfigurasi di bawah disalin dari hasil `docker inspect` container yang
# sedang berjalan, sehingga hasilnya identik kecuali WEBUI_NAME.
# =====================================================================
set -e

cd "$(dirname "$0")/.."

MODE="${1:-}"
CONTAINER="open-webui"
IMAGE="data-analysis-agent"
VOLUME="open-webui"
PORT="3000"

case "$MODE" in
  default) NAME_ARG=() ; LABEL="Open WebUI (tanpa WEBUI_NAME)" ;;
  daat)    NAME_ARG=(-e "WEBUI_NAME=Data Analysis Agent") ; LABEL="Data Analysis Agent" ;;
  *)
    echo "Pakai:  bash set-webui-name.sh default   |   bash set-webui-name.sh daat"
    exit 1 ;;
esac

echo "==> Nama yang akan dipasang: $LABEL"
echo "==> Memastikan volume '$VOLUME' ada..."
docker volume inspect "$VOLUME" >/dev/null

echo "==> Menghentikan dan menghapus container lama (volume TIDAK disentuh)..."
docker stop "$CONTAINER" >/dev/null 2>&1 || true
docker rm "$CONTAINER"   >/dev/null 2>&1 || true

echo "==> Membuat container baru..."
docker run -d \
  --name "$CONTAINER" \
  -p "$PORT":8080 \
  -v "$VOLUME":/app/backend/data \
  --restart unless-stopped \
  -e ENABLE_SIGNUP=false \
  -e ENABLE_COMMUNITY_SHARING=false \
  "${NAME_ARG[@]}" \
  "$IMAGE" >/dev/null

echo "==> Menunggu container sehat..."
for i in $(seq 1 40); do
  st="$(docker ps --filter name="$CONTAINER" --format '{{.Status}}')"
  echo "    $st"
  case "$st" in *healthy*) break ;; esac
  sleep 3
done

echo "==> Memasang ulang tema (container baru = folder static kosong)..."
bash scripts/reapply-theme.sh

echo ""
echo "SELESAI. Buka http://localhost:3000 lalu hard refresh."
echo "Nama sekarang: $LABEL"
