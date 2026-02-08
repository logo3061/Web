const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = 8080;
const DB_FILE = path.join(__dirname, 'db.json');

// --- 1. Database Initialization ---
if (!fs.existsSync(DB_FILE)) {
    console.log("Creating new db.json file...");
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

const getDB = () => {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { users: [] };
    }
};

const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- 2. Global Middleware ---
app.use(express.json()); // Parses incoming JSON bodies

// --- 3. API Routes (Specific routes go FIRST) ---

// Setup: Create a new user
app.post('/api/setup/create-user', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
    }

    try {
        const db = getDB();
        
        // Check if user already exists
        if (db.users.find(u => u.username === username)) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.users.push({
            username,
            password: hashedPassword,
            role: role || 'user'
        });

        saveDB(db);
        console.log(`User created: ${username}`);
        res.status(201).json({ success: true, message: `User ${username} created successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = getDB();
        const user = db.users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        res.json({ success: true, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// --- 4. Static Files & Frontend Routing ---

// Serve static assets (js, css, images) from the public folder
app.use(express.static(path.join(__dirname)));

// Catch-all: Send index.html for any other requests (SPA support)
// Using the Node 20+/path-to-regexp v8 compatible syntax
app.get('{*path}', (req, res) => {
const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Error: index.html not found in public folder.");
    }
});

// --- 5. Start Server ---
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running at: https://tek-studios.onrender.com`);
    console.log(`📂 Database located at: ${DB_FILE}\n`);
});