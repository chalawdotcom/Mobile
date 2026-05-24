const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

for (const envFile of [".env.local", ".env"]) {
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

/* eslint-disable no-console */

// Creates/updates two Supabase Auth users for quick testing.
// Requires: SUPABASE_SERVICE_ROLE_KEY (NEVER use the anon key here)

// require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

let WebSocketImpl;
try {
  // Supabase Realtime needs a WebSocket implementation in Node < 22.
  // `ws` is a lightweight, widely used polyfill.
  // eslint-disable-next-line global-require
  WebSocketImpl = require("ws");
} catch {
  WebSocketImpl = undefined;
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error(
    "Missing Supabase URL. Set SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL in your environment.",
  );
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Copy it from Supabase Dashboard → Project Settings → API → service_role (secret).",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  ...(WebSocketImpl ? { realtime: { transport: WebSocketImpl } } : {}),
});

async function findUserByEmail(email) {
  const target = email.toLowerCase();

  // Paginate just in case; most projects will fit in the first page.
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const found = (data?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === target,
    );
    if (found) return found;

    if (!data?.users || data.users.length < perPage) break;
  }

  return null;
}

async function upsertUser({ email, password, role }) {
  const existing = await findUserByEmail(email);

  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    });
    if (error) throw error;
    return { action: "created", userId: data.user?.id };
  }

  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: { ...(existing.app_metadata ?? {}), role },
  });
  if (error) throw error;

  return { action: "updated", userId: existing.id };
}

async function main() {
  const operatorEmail = process.env.SEED_OPERATOR_EMAIL || "operatore@test.com";
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD || "Test1234!";

  const dashboardEmail =
    process.env.SEED_DASHBOARD_EMAIL || "superviseur@test.com";
  const dashboardPassword = process.env.SEED_DASHBOARD_PASSWORD || "Test1234!";

  console.log("Seeding test users into Supabase Auth…");
  console.log("URL:", supabaseUrl);

  const operator = await upsertUser({
    email: operatorEmail,
    password: operatorPassword,
    role: "operatore",
  });

  const dashboard = await upsertUser({
    email: dashboardEmail,
    password: dashboardPassword,
    role: "superviseur",
  });

  console.log("Done.");
  console.log(`- ${operator.action}: ${operatorEmail} (role=operatore)`);
  console.log(`- ${dashboard.action}: ${dashboardEmail} (role=superviseur)`);
  console.log(
    "If you were already signed in on-device, sign out (button on Kiosk/Dashboard) and sign back in to refresh the role claim.",
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});
