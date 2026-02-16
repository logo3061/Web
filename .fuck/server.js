const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ================= HELPERS =================
// Converts "Pass123" to "80,97,115,115,49,50,51"
const toAsciiString = (str) => {
    return str.split('').map(char => char.charCodeAt(0)).join(',');
};
// ================= CONFIG & SUPABASE =================
const supabaseUrl = "https://rixeqwlkgczmbvhtjndm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGVxd2xrZ2N6bWJ2aHRqbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc4OTMsImV4cCI6MjA4NjE0Mzg5M30._4GIn38eww1UQpW9JP1gfDQJXB48Fhluwm--oiA4XaE";

const supabase = createClient(supabaseUrl, supabaseKey);
// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100, // Reduced from 175k for actual security
    message: { success: false, message: "Zu viele Versuche. Bitte in einer Minute erneut probieren." }
});

// ================= AUTH API =================
app.post('/api/login', loginLimiter, async (req, res) => {
    const username = req.body.username ? req.body.username.trim() : '';
    const plainPassword = req.body.password ? req.body.password.trim() : '';

    if (!username || !plainPassword) {
        return res.status(400).json({ success: false, message: "Benutzername und Passwort erforderlich." });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('username, password, role')
            .ilike('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: "Ungültige Anmeldedaten." });
        }

        // Convert the incoming password to ASCII format to compare with the DB
        const inputAscii = toAsciiString(plainPassword);

        // ================= ASCII CHECK =================
        if (inputAscii !== user.password) {
            console.log(`Log: Falsches Passwort für ${user.username}`);
            return res.status(401).json({ success: false, message: "Ungültige Anmeldedaten." });
        }

        console.log(`✅ Login erfolgreich: ${user.username}`);
        res.json({
            success: true,
            user: { username: user.username, role: user.role }
        });

    } catch (err) {
        console.error("Internal Auth Error:", err);
        res.status(500).json({ success: false, message: "Serverfehler bei der Authentifizierung." });
    }
});


app.get('/api/services', async (req, res) => {
  try {
    // Holt alle Zeilen aus der Tabelle 'services'
    const { data, error } = await supabase
      .from('services')
      .select('*');

    if (error) throw error;

    // Sendet die Daten als JSON an dein Frontend
    res.json(data);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
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
  res.sendFile(path.join(__dirname, 'index.html'), err => { // 'public' hinzugefügt
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