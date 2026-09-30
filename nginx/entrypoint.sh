#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.crt" ]; then
    command -v openssl >/dev/null 2>&1 || apk add --no-cache openssl
    echo "Generating self-signed certificate..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/CN=anthias-master/O=Anthias/C=FR"
    echo "Certificate generated."
fi

exec nginx -g "daemon off;"
