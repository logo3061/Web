const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080; // Render provides the port via environment variable
const DB_FILE = path.join(__dirname, 'db.json');

// --- 1. Database Helpers ---
const getDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { users: [] };
    }
};

const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- 2. Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- 3. The Logic Function (Shared) ---
// We pull the creation logic out so both the API and the Auto-Setup can use it.
const createNewUser = async (username, password, role) => {
    const db = getDB();
    if (db.users.find(u => u.username === username)) {
        return { success: false, message: "User already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.users.push({ username, password: hashedPassword, role: role || 'user' });
    saveDB(db);
    return { success: true, message: `User ${username} created` };
};

// --- 4. API Routes ---

app.post('/api/setup/create-user', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing credentials" });
    }
    const result = await createNewUser(username, password, role);
    return res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.username === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, role: user.role, username: user.username });
});

// --- 5. Frontend Routing ---
// Use the standard '*' for catch-all
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("index.html not found");
    }
});

// --- 6. Start Server & Run Auto-Setup ---
app.listen(PORT, async () => {
    console.log(`🚀 Server active on port ${PORT}`);

    // DIRECT LOGIC CALL (No fetch needed)
    console.log("Checking for CEO account...");
    const setup = await createNewUser("Zoqzon", "Root4090", "CEO");
    if (setup.success) {
        console.log("✅ CEO account created successfully.");
    } else {
        console.log("ℹ️ CEO account check: " + setup.message);
    }
});