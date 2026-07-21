#!/usr/bin/env bash
# Read-only inspection of the server's reverse-proxy / gateway setup, so we can
# wire INNOVERA PLAN behind an existing gateway. Makes NO changes. Run as root:
#   bash inspect-server.sh
# then paste the whole output back.

line() { printf '\n==================== %s ====================\n' "$1"; }

line "OS / host"
if [ -r /etc/os-release ]; then . /etc/os-release; echo "OS: ${PRETTY_NAME:-unknown}"; fi
uname -a 2>/dev/null
echo "Disk:"; df -h / 2>/dev/null | tail -n +1
echo "Public IP (guess): $(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"

line "Who owns ports 80 / 443"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || echo "  (nothing listening on 80/443)"
elif command -v netstat >/dev/null 2>&1; then
  netstat -tlnp 2>/dev/null | grep -E ':80 |:443 ' || echo "  (nothing listening on 80/443)"
else
  echo "  (no ss/netstat)"
fi

line "All listening TCP ports (to pick a free APP_PORT)"
{ ss -tlnH 2>/dev/null || netstat -tln 2>/dev/null; } | grep -oE '[0-9.:]+:[0-9]+' | sed -E 's/.*:([0-9]+)$/\1/' | sort -un | tr '\n' ' '
echo
for p in 3000 3001 3002 3100 8080 8090; do
  if ! { ss -tlnH 2>/dev/null || netstat -tln 2>/dev/null; } | grep -qE ":$p( |\$)"; then echo "  suggestion: port $p is FREE"; break; fi
done

line "Host-level proxy services (systemd)"
for svc in nginx caddy traefik apache2 httpd haproxy; do
  if command -v "$svc" >/dev/null 2>&1 || systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\."; then
    printf "  %-9s installed" "$svc"
    a=$(systemctl is-active "$svc" 2>/dev/null); echo " · active=${a:-?}"
  fi
done
echo "  (nothing above = no host proxy installed)"

line "Docker"
if command -v docker >/dev/null 2>&1; then
  docker --version 2>/dev/null
  echo "  --- running containers (name / image / ports) ---"
  docker ps --format '  {{.Names}}  |  {{.Image}}  |  {{.Ports}}' 2>/dev/null || echo "  (cannot list — permission?)"
  echo "  --- proxy-looking containers ---"
  docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -iE 'nginx|caddy|traefik|proxy|gateway|npm|swag' | sed 's/^/  /' || echo "  (none obvious)"
  echo "  --- networks ---"
  docker network ls 2>/dev/null | sed 's/^/  /'
else
  echo "  docker NOT installed"
fi

line "nginx site configs (if present)"
ls -1 /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | sed 's/^/  /'
grep -rEl "innoplan|innoveraappcenter" /etc/nginx/ 2>/dev/null | sed 's/^/  mentions domain: /'

line "Caddy config (if present)"
for f in /etc/caddy/Caddyfile; do [ -f "$f" ] && { echo "  $f:"; grep -nE "reverse_proxy|innoplan|:80|:443|\{" "$f" 2>/dev/null | head -30 | sed 's/^/    /'; }; done

line "Traefik hints (if present)"
ls -1 /etc/traefik/ 2>/dev/null | sed 's/^/  /'
grep -rEl "innoplan|innoveraappcenter" /etc/traefik/ 2>/dev/null | sed 's/^/  mentions domain: /'
docker ps --filter 'label=traefik.enable=true' --format '  traefik-managed: {{.Names}}' 2>/dev/null

line "Does the domain point here?"
getent hosts innoplan.innoveraappcenter.com 2>/dev/null | sed 's/^/  resolves to: /' || echo "  (not resolving yet)"

printf '\n==================== done — paste everything above ====================\n'
