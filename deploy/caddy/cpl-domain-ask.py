#!/usr/bin/env python3
"""Caddy on-demand TLS "ask" endpoint.

GET /ask?domain=<host> -> 200 if the domain is VERIFIED in advertiser_domains,
403 otherwise. Caddy calls this before issuing a certificate for an unknown
host, so certificates are only ever issued for domains advertisers verified.
"""
import re
import subprocess
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ENV_FILE = Path("/home/ubuntu/cpl/packages/database/.env")
LISTEN = ("127.0.0.1", 9095)
DOMAIN_RE = re.compile(r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$")


def load_db_config():
    url = ""
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL"):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
    m = re.match(r"mysql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)", url)
    if not m:
        raise RuntimeError("cannot parse DATABASE_URL")
    user, password, host, port, db = m.groups()
    return {
        "user": user,
        "password": urllib.parse.unquote(password),
        "host": host,
        "port": port or "3306",
        "db": db,
    }


DB = load_db_config()


def domain_is_verified(domain: str) -> bool:
    sql = (
        "SELECT COUNT(*) FROM advertiser_domains "
        f"WHERE domain='{domain}' AND status='VERIFIED';"
    )
    result = subprocess.run(
        [
            "mysql",
            "-u", DB["user"],
            "-h", DB["host"],
            "-P", DB["port"],
            "-N", "-B",
            DB["db"],
            "-e", sql,
        ],
        capture_output=True,
        text=True,
        timeout=10,
        env={"MYSQL_PWD": DB["password"], "PATH": "/usr/bin:/bin"},
    )
    return result.returncode == 0 and result.stdout.strip() not in ("", "0")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/ask":
            self.send_response(404)
            self.end_headers()
            return
        params = urllib.parse.parse_qs(parsed.query)
        domain = (params.get("domain") or [""])[0].strip().lower().split(":")[0]
        ok = False
        if domain and len(domain) <= 253 and DOMAIN_RE.match(domain):
            try:
                ok = domain_is_verified(domain)
            except Exception:
                ok = False
        self.send_response(200 if ok else 403)
        self.end_headers()
        self.wfile.write(b"ok" if ok else b"denied")

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)


if __name__ == "__main__":
    HTTPServer(LISTEN, Handler).serve_forever()
