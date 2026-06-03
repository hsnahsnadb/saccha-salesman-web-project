require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials from environment variables
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Store active sessions
const sessions = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json');

// ============ DATA HELPERS ============
function loadJSON(file, defaultData = []) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
    return defaultData;
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ============ DEFAULT PRODUCTS ============
const defaultProducts = [
    {
        id: 1, name: "iQOO Z10x 5G", category: "phone", price: 13999, brand: "iQOO", budget: "low",
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
        rating: 4.4, featured: true, active: true,
        whyBest: "Best 5G performance under ₹15K. Dimensity 7200, 120Hz AMOLED, 44W fast charging. Gaming beast in budget.",
        bestFor: "Gamers & performance seekers",
        bestPrice: "₹13,499 (Amazon)",
        onlinePrice: "₹13,499",
        offlinePrice: "₹14,499 - ₹15,999",
        stores: ["Amazon", "iQOO Store", "Flipkart", "Croma"],
        specs: { display: "6.67\" 120Hz AMOLED", processor: "Dimensity 7200 5G", ram: "8GB", storage: "128GB", battery: "5000mAh, 44W", camera: "50MP + 2MP | 16MP Front", os: "Android 14", weight: "190g" },
        pros: ["Excellent performance", "120Hz AMOLED display", "Fast charging"],
        cons: ["No 3.5mm jack", "Plastic build"],
        views: 0, clicks: 0
    },
    {
        id: 2, name: "Realme P4x 5G", category: "phone", price: 11999, brand: "Realme", budget: "low",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
        rating: 4.2, featured: false, active: true,
        whyBest: "Most affordable 5G phone. Dimensity 6100+, 90Hz display, 5000mAh battery. Perfect entry-level 5G.",
        bestFor: "First-time 5G users",
        bestPrice: "₹11,499 (Flipkart)",
        onlinePrice: "₹11,499",
        offlinePrice: "₹12,499 - ₹13,999",
        stores: ["Flipkart", "Realme Store", "Amazon"],
        specs: { display: "6.5\" 90Hz IPS LCD", processor: "Dimensity 6100+ 5G", ram: "6GB", storage: "128GB", battery: "5000mAh, 18W", camera: "50MP + 2MP | 8MP Front", os: "Android 14", weight: "195g" },
        pros: ["Affordable 5G", "Good battery", "Smooth 90Hz"],
        cons: ["LCD display", "Slow charging"],
        views: 0, clicks: 0
    },
    {
        id: 3, name: "Moto G57 Power", category: "phone", price: 10999, brand: "Motorola", budget: "low",
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
        rating: 4.3, featured: false, active: true,
        whyBest: "Best battery under ₹12K. 6000mAh, stock Android, clean UI. Motorola reliability.",
        bestFor: "Battery-focused users",
        bestPrice: "₹10,499 (Flipkart)",
        onlinePrice: "₹10,499",
        offlinePrice: "₹11,999 - ₹13,499",
        stores: ["Flipkart", "Motorola Store", "Amazon"],
        specs: { display: "6.5\" 90Hz IPS LCD", processor: "Helio G88", ram: "6GB", storage: "128GB", battery: "6000mAh, 33W", camera: "50MP + 2MP | 16MP Front", os: "Android 14 Stock", weight: "200g" },
        pros: ["6000mAh battery", "Stock Android", "Clean UI"],
        cons: ["No 5G", "LCD screen"],
        views: 0, clicks: 0
    },
    {
        id: 4, name: "Samsung Galaxy F17e 5G", category: "phone", price: 15999, brand: "Samsung", budget: "low",
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
        rating: 4.5, featured: true, active: true,
        whyBest: "Best Samsung budget 5G. Exynos 1330, 50MP OIS, 6000mAh. 4 years of updates guaranteed.",
        bestFor: "Samsung fans & camera lovers",
        bestPrice: "₹15,499 (Samsung Store)",
        onlinePrice: "₹15,499",
        offlinePrice: "₹16,499 - ₹18,999",
        stores: ["Samsung.com", "Amazon", "Flipkart", "Croma"],
        specs: { display: "6.6\" 90Hz PLS LCD", processor: "Exynos 1330 5G", ram: "6GB/8GB", storage: "128GB", battery: "6000mAh, 25W", camera: "50MP OIS + 5MP | 13MP Front", os: "Android 14, One UI 6", weight: "205g" },
        pros: ["Samsung brand", "50MP OIS", "6000mAh battery", "4yr updates"],
        cons: ["LCD display", "25W charging slow"],
        views: 0, clicks: 0
    },
    {
        id: 5, name: "POCO M7 Pro 5G", category: "phone", price: 16999, brand: "POCO", budget: "low",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
        rating: 4.5, featured: true, active: true,
        whyBest: "Best performance under ₹17K. Snapdragon 7s Gen 2, 120Hz AMOLED, 67W charging. Flagship speed.",
        bestFor: "Performance enthusiasts",
        bestPrice: "₹16,499 (Flipkart)",
        onlinePrice: "₹16,499",
        offlinePrice: "₹17,999 - ₹19,999",
        stores: ["Flipkart", "POCO Store", "Amazon"],
        specs: { display: "6.67\" 120Hz AMOLED", processor: "Snapdragon 7s Gen 2 5G", ram: "8GB", storage: "128GB/256GB", battery: "5100mAh, 67W", camera: "64MP OIS + 8MP + 2MP | 16MP Front", os: "Android 14, HyperOS", weight: "185g" },
        pros: ["Snapdragon 7s Gen 2", "120Hz AMOLED", "67W fast charging"],
        cons: ["MIUI ads", "No 3.5mm jack"],
        views: 0, clicks: 0
    }
];

// Initialize data files
if (!fs.existsSync(DATA_FILE)) saveJSON(DATA_FILE, defaultProducts);
if (!fs.existsSync(SETTINGS_FILE)) saveJSON(SETTINGS_FILE, {
    siteName: "Saccha Salesman",
    updateFrequency: 10,
    lastUpdated: new Date().toISOString(),
    theme: "light",
    maintenanceMode: false
});
if (!fs.existsSync(ANALYTICS_FILE)) saveJSON(ANALYTICS_FILE, {
    totalVisits: 0,
    dailyVisits: {},
    popularProducts: []
});

// ============ AUTH MIDDLEWARE ============
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    const session = sessions.get(token);
    if (Date.now() - session.created > 24 * 60 * 60 * 1000) {
        sessions.delete(token);
        return res.status(401).json({ success: false, message: 'Session expired' });
    }
    req.session = session;
    next();
}

// ============ AUTH ROUTES ============
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        const token = generateToken();
        sessions.set(token, {
            username: ADMIN_USER,
            role: 'admin',
            created: Date.now()
        });
        return res.json({
            success: true,
            token,
            user: { username: ADMIN_USER, role: 'admin' },
            message: 'Login successful! Welcome back.'
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid username or password' });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(token);
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/check', requireAuth, (req, res) => {
    res.json({ success: true, user: req.session });
});

// ============ API ROUTES (Protected) ============

// Get all products
app.get('/api/products', (req, res) => {
    let products = loadJSON(DATA_FILE);
    const { category, budget, search, featured, active, sort, page = 1, limit = 20 } = req.query;
    
    if (category && category !== 'all') products = products.filter(p => p.category === category);
    if (budget && budget !== 'all') products = products.filter(p => p.budget === budget);
    if (featured === 'true') products = products.filter(p => p.featured);
    if (active === 'true') products = products.filter(p => p.active !== false);
    if (search) {
        const s = search.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(s) || 
            p.brand.toLowerCase().includes(s) ||
            p.whyBest?.toLowerCase().includes(s)
        );
    }
    
    if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    if (sort === 'newest') products.sort((a, b) => b.id - a.id);
    if (sort === 'popular') products.sort((a, b) => (b.views || 0) - (a.views || 0));
    
    const total = products.length;
    const start = (page - 1) * limit;
    products = products.slice(start, start + parseInt(limit));
    
    res.json({
        success: true,
        data: products,
        pagination: { page: parseInt(page), totalPages: Math.ceil(total / limit), total, limit: parseInt(limit) }
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const products = loadJSON(DATA_FILE);
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    // Increment views
    product.views = (product.views || 0) + 1;
    saveJSON(DATA_FILE, products);
    
    res.json({ success: true, data: product });
});

// Add product (protected)
app.post('/api/products', requireAuth, (req, res) => {
    const products = loadJSON(DATA_FILE);
    const newProduct = {
        id: Date.now(),
        ...req.body,
        views: 0,
        clicks: 0,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    saveJSON(DATA_FILE, products);
    res.status(201).json({ success: true, data: newProduct, message: 'Product added successfully!' });
});

// Update product (protected)
app.put('/api/products/:id', requireAuth, (req, res) => {
    const products = loadJSON(DATA_FILE);
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Product not found' });
    
    products[index] = { ...products[index], ...req.body, id: products[index].id, updatedAt: new Date().toISOString() };
    saveJSON(DATA_FILE, products);
    res.json({ success: true, data: products[index], message: 'Product updated!' });
});

// Delete product (protected)
app.delete('/api/products/:id', requireAuth, (req, res) => {
    let products = loadJSON(DATA_FILE);
    const before = products.length;
    products = products.filter(p => p.id !== parseInt(req.params.id));
    if (products.length === before) return res.status(404).json({ success: false, message: 'Product not found' });
    saveJSON(DATA_FILE, products);
    res.json({ success: true, message: 'Product deleted!' });
});

// Toggle product status (protected)
app.patch('/api/products/:id/toggle', requireAuth, (req, res) => {
    const products = loadJSON(DATA_FILE);
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.active = !product.active;
    saveJSON(DATA_FILE, products);
    res.json({ success: true, data: product, message: `Product ${product.active ? 'activated' : 'deactivated'}!` });
});

// Bulk import (protected)
app.post('/api/products/bulk', requireAuth, (req, res) => {
    const { products: newProducts } = req.body;
    if (!Array.isArray(newProducts)) return res.status(400).json({ success: false, message: 'Expected array of products' });
    
    const existing = loadJSON(DATA_FILE);
    const imported = newProducts.map(p => ({
        id: Date.now() + Math.random(),
        ...p,
        views: 0,
        active: true,
        createdAt: new Date().toISOString()
    }));
    
    saveJSON(DATA_FILE, [...imported, ...existing]);
    res.json({ success: true, message: `${imported.length} products imported!`, count: imported.length });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const products = loadJSON(DATA_FILE);
    const settings = loadJSON(SETTINGS_FILE);
    const analytics = loadJSON(ANALYTICS_FILE);
    
    const cats = [...new Set(products.map(p => p.category))];
    const active = products.filter(p => p.active !== false).length;
    const featured = products.filter(p => p.featured).length;
    const avgRating = products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : 0;
    const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
    
    res.json({
        success: true,
        data: {
            totalProducts: products.length,
            activeProducts: active,
            featuredProducts: featured,
            categories: cats.length,
            categoryList: cats,
            averageRating: avgRating,
            totalViews,
            settings,
            analytics
        }
    });
});

// Update settings (protected)
app.put('/api/settings', requireAuth, (req, res) => {
    const settings = loadJSON(SETTINGS_FILE);
    const updated = { ...settings, ...req.body };
    saveJSON(SETTINGS_FILE, updated);
    res.json({ success: true, data: updated, message: 'Settings updated!' });
});

// Get settings
app.get('/api/settings', (req, res) => {
    res.json({ success: true, data: loadJSON(SETTINGS_FILE) });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
});

// ============ SERVE HTML ============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 404
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       SACCHA SALESMAN SERVER            ║
╠══════════════════════════════════════════╣
║  🟢 Server: http://localhost:${PORT}       ║
║  🔐 Admin: http://localhost:${PORT}/admin  ║
║  📡 API: http://localhost:${PORT}/api      ║
║  ❤️  Health: http://localhost:${PORT}/health║
╚══════════════════════════════════════════╝
    `);
});
