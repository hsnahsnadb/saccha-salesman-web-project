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

// Products data file
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

// Default products if file doesn't exist
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
        },
        {
            id: 4, name: "Samsung Galaxy F17e 5G", category: "phone", price: 15999, brand: "Samsung", budget: "low",
            image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
            rating: 4.5, whyBest: "Best Samsung budget 5G. Exynos 1330, 50MP OIS, 6000mAh. 4 years updates.",
            bestFor: "Samsung fans & camera lovers", bestPrice: "₹15,499 (Samsung Store)",
            stores: ["Samsung.com", "Amazon", "Flipkart", "Croma"],
            specs: { display: "6.6\" 90Hz PLS LCD", processor: "Exynos 1330 5G", ram: "6GB/8GB", storage: "128GB", battery: "6000mAh, 25W", camera: "50MP OIS + 5MP | 13MP Front" }
        },
        {
            id: 5, name: "POCO M7 Pro 5G", category: "phone", price: 16999, brand: "POCO", budget: "low",
            image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
            rating: 4.5, whyBest: "Best performance under ₹17K. Snapdragon 7s Gen 2, 120Hz AMOLED, 67W charging.",
            bestFor: "Performance enthusiasts", bestPrice: "₹16,499 (Flipkart)",
            stores: ["Flipkart", "POCO Store", "Amazon"],
            specs: { display: "6.67\" 120Hz AMOLED", processor: "Snapdragon 7s Gen 2 5G", ram: "8GB", storage: "128GB/256GB", battery: "5100mAh, 67W", camera: "64MP OIS + 8MP + 2MP | 16MP Front" }
        }
    ]);
}

// API Routes
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

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));