const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials - hardcoded for reliability
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Use file-based sessions so they survive server restarts
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

// Load sessions from file
function loadSessions() {
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
            // Clean expired sessions (older than 24 hours)
            const now = Date.now();
            const valid = {};
            for (const [key, val] of Object.entries(data)) {
                if (now - val.time < 24 * 60 * 60 * 1000) {
                    valid[key] = val;
                }
            }
            return valid;
        }
    } catch (e) {}
    return {};
}

// Save sessions to file
function saveSessions(sessions) {
    try {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch (e) {
        console.error('Failed to save sessions:', e.message);
    }
}

// Initialize sessions
let sessions = loadSessions();

// Save sessions every 5 minutes
setInterval(() => saveSessions(sessions), 5 * 60 * 1000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'products.json');

function loadProducts() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveProducts(products) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

// Initialize default products if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    saveProducts([
        {
            id: 1, name: "iQOO Z10x 5G", category: "phone", price: 13999, brand: "iQOO", budget: "low",
            image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
            rating: 4.4, featured: true, active: true,
            whyBest: "Best 5G under ₹15K. Dimensity 7200, 120Hz AMOLED, 44W charging.",
            bestFor: "Gamers", bestPrice: "₹13,499 (Amazon)",
            stores: ["Amazon", "iQOO Store", "Flipkart"],
            specs: { display: "6.67\" AMOLED", processor: "Dimensity 7200", ram: "8GB", storage: "128GB", battery: "5000mAh", camera: "50MP" },
            views: 0
        },
        {
            id: 2, name: "Realme P4x 5G", category: "phone", price: 11999, brand: "Realme", budget: "low",
            image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
            rating: 4.2, featured: false, active: true,
            whyBest: "Most affordable 5G. Dimensity 6100+, 90Hz, 5000mAh.",
            bestFor: "First 5G phone", bestPrice: "₹11,499 (Flipkart)",
            stores: ["Flipkart", "Realme Store"],
            specs: { display: "6.5\" LCD", processor: "Dimensity 6100+", ram: "6GB", storage: "128GB", battery: "5000mAh", camera: "50MP" },
            views: 0
        },
        {
            id: 3, name: "Moto G57 Power", category: "phone", price: 10999, brand: "Motorola", budget: "low",
            image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
            rating: 4.3, featured: false, active: true,
            whyBest: "Best battery under ₹12K. 6000mAh, stock Android.",
            bestFor: "Battery lovers", bestPrice: "₹10,499 (Flipkart)",
            stores: ["Flipkart", "Motorola Store"],
            specs: { display: "6.5\" LCD", processor: "Helio G88", ram: "6GB", storage: "128GB", battery: "6000mAh", camera: "50MP" },
            views: 0
        }
    ]);
}

// ============ LOGIN ============
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        // Generate a permanent-like token
        const token = crypto.randomBytes(32).toString('hex');
        sessions[token] = {
            username: ADMIN_USER,
            role: 'admin',
            time: Date.now()
        };
        
        // Save sessions to file immediately
        saveSessions(sessions);
        
        return res.json({
            success: true,
            token: token,
            user: { username: ADMIN_USER, role: 'admin' },
            message: 'Login successful!'
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// ============ CHECK AUTH ============
app.get('/api/auth/check', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && sessions[token]) {
        // Check if session is not expired (24 hours)
        if (Date.now() - sessions[token].time < 24 * 60 * 60 * 1000) {
            return res.json({ success: true, user: sessions[token] });
        }
        // Remove expired session
        delete sessions[token];
        saveSessions(sessions);
    }
    
    res.status(401).json({ success: false, message: 'Session expired or invalid' });
});

// ============ LOGOUT ============
app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && sessions[token]) {
        delete sessions[token];
        saveSessions(sessions);
    }
    res.json({ success: true, message: 'Logged out' });
});

// ============ PRODUCTS API ============

app.get('/api/products', (req, res) => {
    let products = loadProducts();
    const { category, budget, search } = req.query;
    
    if (category && category !== 'all') products = products.filter(p => p.category === category);
    if (budget && budget !== 'all') products = products.filter(p => p.budget === budget);
    if (search) {
        const s = search.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s));
    }
    
    res.json({ success: true, data: products, count: products.length });
});

app.get('/api/stats', (req, res) => {
    const products = loadProducts();
    const cats = [...new Set(products.map(p => p.category))];
    const active = products.filter(p => p.active !== false).length;
    const featured = products.filter(p => p.featured).length;
    const avgRating = products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : 0;
    const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
    
    res.json({
        success: true,
        data: { totalProducts: products.length, activeProducts: active, featuredProducts: featured, categories: cats.length, categoryList: cats, averageRating: avgRating, totalViews }
    });
});

app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: { siteName: 'Saccha Salesman', updateFrequency: 10 } });
});

app.put('/api/settings', (req, res) => {
    res.json({ success: true, message: 'Settings saved!' });
});

// ============ PROTECTED ROUTES ============

function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    if (Date.now() - sessions[token].time > 24 * 60 * 60 * 1000) {
        delete sessions[token];
        saveSessions(sessions);
        return res.status(401).json({ success: false, message: 'Session expired' });
    }
    next();
}

app.post('/api/products', requireAuth, (req, res) => {
    const products = loadProducts();
    const newProduct = {
        id: Date.now(),
        ...req.body,
        views: 0,
        active: true,
        createdAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    saveProducts(products);
    res.status(201).json({ success: true, data: newProduct, message: 'Product added!' });
});

app.put('/api/products/:id', requireAuth, (req, res) => {
    const products = loadProducts();
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Not found' });
    products[index] = { ...products[index], ...req.body, id: products[index].id };
    saveProducts(products);
    res.json({ success: true, data: products[index], message: 'Updated!' });
});

app.patch('/api/products/:id/toggle', requireAuth, (req, res) => {
    const products = loadProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    product.active = !product.active;
    saveProducts(products);
    res.json({ success: true, data: product });
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
    let products = loadProducts();
    products = products.filter(p => p.id !== parseInt(req.params.id));
    saveProducts(products);
    res.json({ success: true, message: 'Deleted!' });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', sessions: Object.keys(sessions).length }));

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔐 Admin: admin / admin123`);
    console.log(`📁 Sessions file: ${SESSIONS_FILE}`);
});

// Save sessions on exit
process.on('SIGTERM', () => {
    saveSessions(sessions);
    process.exit(0);
});

process.on('SIGINT', () => {
    saveSessions(sessions);
    process.exit(0);
});
