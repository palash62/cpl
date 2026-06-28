async function login(email: string, password: string) {
  const base = "http://localhost:3000";
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/login`,
    json: "true",
  });
  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.map((c) => c.split(";")[0]).join("; "),
    },
    body: body.toString(),
    redirect: "manual",
  });
  return [...csrfCookies, ...(loginRes.headers.getSetCookie?.() ?? [])]
    .map((c) => c.split(";")[0])
    .join("; ");
}

const routes = [
  { email: "admin@cpl.local", paths: ["/admin", "/admin/advertisers", "/admin/reports", "/admin/settings"] },
  { email: "advertiser@cpl.local", paths: ["/advertiser", "/advertiser/campaigns", "/advertiser/reports"] },
  { email: "publisher@cpl.local", paths: ["/publisher", "/publisher/smart-link", "/publisher/leads"] },
];

async function main() {
  let failed = false;
  for (const { email, paths } of routes) {
    const cookies = await login(email, "password123");
    for (const path of paths) {
      const res = await fetch(`http://localhost:3000${path}`, {
        headers: { Cookie: cookies },
        redirect: "manual",
      });
      const text = await res.text();
      const bad =
        res.status >= 500 ||
        text.includes("Application error") ||
        text.includes("Functions cannot be passed directly");
      console.log(`${email} ${path} -> ${res.status}${bad ? " FAIL" : " OK"}`);
      if (bad) {
        failed = true;
        if (path === "/admin") console.log(text.slice(0, 1500));
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
