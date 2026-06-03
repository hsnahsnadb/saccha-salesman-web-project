require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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

if (!fs.existsSync(DATA_FILE)) {
    saveProducts([
        {
            id: 1, name: "iQOO Z10x 5G", category: "phone", price: 13999, brand: "iQOO", budget: "low",
            image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
            rating: 4.4, whyBest: "Best 5G performance under ₹15K. Dimensity 7200, 120Hz AMOLED, 44W fast charging.",
            bestFor: "Gamers & performance seekers", bestPrice: "₹13,499 (Amazon)",
            stores: ["Amazon", "iQOO Store", "Flipkart", "Croma"],
            specs: { display: "6.67\" 120Hz AMOLED", processor: "Dimensity 7200 5G", ram: "8GB", storage: "128GB", battery: "5000mAh, 44W", camera: "50MP + 2MP | 16MP Front" }
        },
        {
            id: 2, name: "Realme P4x 5G", category: "phone", price: 11999, brand: "Realme", budget: "low",
            image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
            rating: 4.2, whyBest: "Most affordable 5G phone. Dimensity 6100+, 90Hz display, 5000mAh battery.",
            bestFor: "First-time 5G users", bestPrice: "₹11,499 (Flipkart)",
            stores: ["Flipkart", "Realme Store", "Amazon"],
            specs: { display: "6.5\" 90Hz IPS LCD", processor: "Dimensity 6100+ 5G", ram: "6GB", storage: "128GB", battery: "5000mAh, 18W", camera: "50MP + 2MP | 8MP Front" }
        },
        {
            id: 3, name: "Moto G57 Power", category: "phone", price: 10999, brand: "Motorola", budget: "low",
            image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
            rating: 4.3, whyBest: "Best battery under ₹12K. 6000mAh, stock Android, clean UI.",
            bestFor: "Battery-focused users", bestPrice: "₹10,499 (Flipkart)",
            stores: ["Flipkart", "Motorola Store", "Amazon"],
            specs: { display: "6.5\" 90Hz IPS LCD", processor: "Helio G88", ram: "6GB", storage: "128GB", battery: "6000mAh, 33W", camera: "50MP + 2MP | 16MP Front" }
        }
    ]);
}

// ============ MAIN ROUTES ============

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin page - THIS WAS MISSING
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============ API ROUTES ============

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
    const avg = products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : 0;
    res.json({ success: true, data: { total: products.length, categories: cats.length, avgRating: avg } });
});

app.post('/api/verify', (req, res) => {
    res.json({ success: req.body.password === ADMIN_PASSWORD });
});

app.post('/api/products', (req, res) => {
    const { password, ...data } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'Wrong password' });
    const products = loadProducts();
    products.unshift({ id: Date.now(), ...data, createdAt: new Date().toISOString() });
    saveProducts(products);
    res.status(201).json({ success: true, message: 'Product added!' });
});

app.put('/api/products/:id', (req, res) => {
    const { password, ...updates } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'Wrong password' });
    const products = loadProducts();
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
    products[idx] = { ...products[idx], ...updates };
    saveProducts(products);
    res.json({ success: true, message: 'Updated!' });
});

app.delete('/api/products/:id', (req, res) => {
    const password = req.body.password || req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'Wrong password' });
    let products = loadProducts();
    products = products.filter(p => p.id !== parseInt(req.params.id));
    saveProducts(products);
    res.json({ success: true, message: 'Deleted!' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
