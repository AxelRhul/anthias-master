#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
HOST="${TLS_HOST:-localhost}"
mkdir -p "$CERT_DIR"

# (Re)generate the certificate when it is missing or when TLS_HOST changed.
# Browsers require the address to be listed in subjectAltName, the CN alone is ignored.
if [ ! -f "$CERT_DIR/server.crt" ] || [ "$(cat "$CERT_DIR/host" 2>/dev/null)" != "$HOST" ]; then
    case "$HOST" in
        *[!0-9.]*) SAN="DNS:$HOST,DNS:localhost,IP:127.0.0.1" ;;
        *)         SAN="IP:$HOST,DNS:localhost,IP:127.0.0.1" ;;
    esac
    echo "Generating self-signed certificate for $HOST..."
    openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/CN=$HOST/O=Anthias" \
        -addext "subjectAltName=$SAN"
    chmod 600 "$CERT_DIR/server.key"
    echo "$HOST" > "$CERT_DIR/host"
    echo "Certificate generated."
fi

exec nginx -g "daemon off;"
