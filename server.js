const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase

const supabase = createClient(
  "https://rixeqwlkgczmbvhtjndm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGVxd2xrZ2N6bWJ2aHRqbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc4OTMsImV4cCI6MjA4NjE0Mzg5M30._4GIn38eww1UQpW9JP1gfDQJXB48Fhluwm--oiA4XaE"
);
// Teste die Verbindung beim Start
supabase.from('news').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) console.error("❌ Supabase Verbindungsfehler:", error.message);
    else console.log("✅ Supabase erfolgreich verbunden. Einträge in News:", count);
  });
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit login (anti-bruteforce)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

// ================= AUTH =================
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('username,password,role')
    .eq('username', username)
    .single();

  if (error || !user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role
    }
  });
});

// ================= DATA =================
async function fetchSafe(res, query) {
  const { data, error } = await query;
  if (error) {
    console.error(error);
    return res.status(500).json([]);
  }
  return res.json(data ?? []);
}

app.get('/api/news', (req, res) =>
  fetchSafe(res,
    supabase.from('news').select('*').order('created_at', { ascending: false })
  )
);

app.get('/api/projects', (req, res) =>
  fetchSafe(res,
    supabase.from('projects').select('*')
  )
);

app.get('/api/downloads', (req, res) =>
  fetchSafe(res,
    supabase.from('downloads').select('*')
  )
);

// ================= SPA FALLBACK =================
// ⚠️ MUSS ganz am Ende stehen
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => { // 'public' hinzugefügt
    if (err) {
      res.status(500).send("index.html wurde nicht im public Ordner gefunden.");
    }
  });
});
app.listen(PORT, () => {
  console.log("✅ SERVER STARTED");
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
