const express = require('express');
const path = require('path');
const fs = require('fs'); // <--- Add this
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8080;

const supabase = createClient("https://rixeqwlkgczmbvhtjndm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGVxd2xrZ2N6bWJ2aHRqbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc4OTMsImV4cCI6MjA4NjE0Mzg5M30._4GIn38eww1UQpW9JP1gfDQJXB48Fhluwm--oiA4XaE");

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API: Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, username: user.username });
});

// API: Fetch Data
app.get('/api/news', async (req, res) => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    res.json(data || []);
});

app.get('/api/projects', async (req, res) => {
    const { data } = await supabase.from('projects').select('*');
    res.json(data || []);
});

app.get('/api/downloads', async (req, res) => {
    const { data } = await supabase.from('downloads').select('*');
    res.json(data || []);
});

// Catch-all (Express 5 syntax)
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`🚀 Server active on port ${PORT}`);
    // Auto-create CEO if missing
    const hp = await bcrypt.hash("se12na34_new", 10);
    await supabase.from('users').upsert([{ username: 'CREPPER1323', password: hp, role: 'Lead Staff' }], { onConflict: 'username' });
});