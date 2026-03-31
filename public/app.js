// ============================================================
// LeadBlaster Pro — Frontend Application
// "Vibe coded in one weekend!" — The Founder
// ============================================================

// ---------- VULNERABILITY #1: API keys hardcoded in frontend ----------
// The Supabase anon key AND the service_role key are both here.
// The service_role key bypasses ALL Row Level Security.
const SUPABASE_URL = "https://xyzcompany.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24ifQ.FAKE_KEY_FOR_TRAINING";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.FAKE_SERVICE_KEY_FOR_TRAINING";

// ---------- VULNERABILITY #2: OpenAI key in frontend ----------
// This key should NEVER be in client-side code.
// Anyone can view-source and steal it to run up your bill.
const OPENAI_API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz";

// ---------- VULNERABILITY #3: Stripe secret key in frontend ----------
// The SECRET key (sk_live_) is for server-side only.
// Exposing it lets anyone issue refunds, view all customers, etc.
const STRIPE_SECRET_KEY = "sk_live_FAKE_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- VULNERABILITY #4: Admin client uses service_role key in browser ----------
// This gives the browser full admin access to the entire database,
// bypassing all Row Level Security policies.
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let currentUser = null;

// ============ AUTH ============

async function signup() {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const plan = document.getElementById("signup-plan").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert("Signup failed: " + error.message);
    return;
  }

  // ---------- VULNERABILITY #5: Role/plan set on the client side ----------
  // Anyone can change this value in the browser console to "enterprise"
  // and get full access without paying. No server-side verification.
  await supabase.from("users").insert({
    id: data.user.id,
    email: email,
    role: plan,           // Client controls their own role!
    is_admin: false,      // Could be changed to true by the user
  });

  alert("Account created! You are on the " + plan + " plan.");
  currentUser = data.user;
  showDashboard();
}

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  currentUser = data.user;
  showDashboard();

  // ---------- VULNERABILITY #6: Admin check on client side ----------
  // The admin panel is just hidden with CSS. Anyone can run:
  //   document.getElementById("admin-panel").style.display = "block"
  // or change is_admin to true in the database (no RLS!).
  const { data: userData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", currentUser.id)
    .single();

  if (userData?.is_admin) {
    document.getElementById("admin-panel").style.display = "block";
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("auth-buttons").style.display = "block";
  document.getElementById("user-info").style.display = "none";
}

// ============ LEADS ============

async function addLead() {
  const name = document.getElementById("lead-name").value;
  const email = document.getElementById("lead-email").value;
  const phone = document.getElementById("lead-phone").value;

  // ---------- VULNERABILITY #7: No input validation / sanitization ----------
  // This data goes straight into the database with zero checks.
  // An attacker could inject malicious content, or stuff the DB with garbage.
  const { error } = await supabase.from("leads").insert({
    business_name: name,
    email: email,
    phone: phone,
    owner_id: currentUser.id,
  });

  if (error) {
    alert("Failed to add lead: " + error.message);
    return;
  }

  alert("Lead added!");
  loadLeads();
}

async function loadLeads() {
  // ---------- VULNERABILITY #8: No RLS — any user can read ALL leads ----------
  // This query fetches ALL leads in the database, not just the current user's.
  // Without Row Level Security, there's nothing stopping this on the DB side either.
  const { data, error } = await supabase
    .from("leads")
    .select("*");

  if (error) return;

  const list = document.getElementById("leads-list");
  list.innerHTML = data.map(lead => `
    <div class="lead-card">
      <strong>${lead.business_name}</strong>
      <p>${lead.email} | ${lead.phone}</p>
      <button onclick="deleteLead('${lead.id}')">Delete</button>
    </div>
  `).join("");
}

async function deleteLead(id) {
  // ---------- VULNERABILITY #9: No ownership check ----------
  // Any logged-in user can delete ANY lead — not just their own.
  await supabase.from("leads").delete().eq("id", id);
  loadLeads();
}

// ============ AI ENRICHMENT ============

async function enrichLead() {
  const name = document.getElementById("lead-name").value;

  // ---------- VULNERABILITY #10: Direct OpenAI API call from browser ----------
  // The API key is exposed in the source code. Anyone can copy it
  // and make unlimited requests, running up the bill.
  // This should go through a backend proxy.
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Find the CEO name, company size, industry, and main email for: ${name}. Return as JSON.`,
        },
      ],
    }),
  });

  const data = await response.json();
  alert("Enriched data: " + data.choices[0].message.content);
}

// ============ EXPORT ============

async function exportLeads() {
  // ---------- VULNERABILITY #11: No rate limiting on data export ----------
  // Anyone can call this repeatedly to scrape the entire database.
  // No throttling, no audit log, no limit on how much data is returned.
  const { data } = await supabase.from("leads").select("*");

  const csv = "Business,Email,Phone\n" +
    data.map(l => `${l.business_name},${l.email},${l.phone}`).join("\n");

  // ---------- VULNERABILITY #12: CSV injection ----------
  // Lead data goes straight into CSV without escaping.
  // A malicious lead name like =CMD("calc") could execute commands
  // when opened in Excel.
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.csv";
  a.click();
}

// ============ ADMIN ============

async function viewAllData() {
  // ---------- VULNERABILITY #13: Uses service_role key to bypass all security ----------
  // This admin function uses the service_role client, which has GOD MODE
  // access to the database. And it's running IN THE BROWSER.
  const { data: users } = await supabaseAdmin.from("users").select("*");
  const { data: leads } = await supabaseAdmin.from("leads").select("*");

  document.getElementById("admin-data").innerHTML =
    "<h3>All Users</h3><pre>" + JSON.stringify(users, null, 2) + "</pre>" +
    "<h3>All Leads</h3><pre>" + JSON.stringify(leads, null, 2) + "</pre>";
}

async function deleteAllUsers() {
  // ---------- VULNERABILITY #14: Mass deletion with no confirmation ----------
  // One click deletes every user. No "are you sure?" prompt.
  // No audit trail. No soft-delete. Just gone.
  const { error } = await supabaseAdmin.from("users").delete().neq("id", "");
  if (!error) alert("All users deleted.");
}

// ============ UI HELPERS ============

function showModal(type) {
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.add("active");
  document.getElementById("login-form").style.display = type === "login" ? "block" : "none";
  document.getElementById("signup-form").style.display = type === "signup" ? "block" : "none";
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("active");
}

function showDashboard() {
  document.getElementById("dashboard-overlay").style.display = "block";
  document.getElementById("auth-buttons").style.display = "none";
  document.getElementById("user-info").style.display = "flex";
  document.getElementById("user-email").textContent = currentUser?.email || "demo@user.com";
  closeModal();
  loadLeads();
}

function closeDashboard() {
  document.getElementById("dashboard-overlay").style.display = "none";
}

// ---------- VULNERABILITY #15: No .gitignore ----------
// The .env file with ALL secrets (Supabase service key, OpenAI key,
// Stripe secret key, admin password) will be committed to Git.
// If this repo is public (or ever becomes public), everything leaks.
