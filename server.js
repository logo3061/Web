const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Supabase (Use your actual URL and Key here)
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Shared Logic ---
const createNewUser = async (username, password, role) => {
    // Check if user exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

    if (existingUser) return { success: false, message: "User already exists" };

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert into Supabase
    const { error } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword, role: role || 'user' }]);

    if (error) return { success: false, message: error.message };
    return { success: true, message: `User ${username} created successfully` };
};

// --- API Routes ---
app.post('/api/setup/create-user', async (req, res) => {
    const { username, password, role } = req.body;
    const result = await createNewUser(username, password, role);
    res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, role: user.role, username: user.username });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // Auto-setup CEO on start
    const setup = await createNewUser("Zoqzon", "Root4090", "CEO");
    console.log(setup.success ? "✅ CEO account active." : "ℹ️ CEO check: " + setup.message);
});