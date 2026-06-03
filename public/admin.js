// ============================================
// SACCHA SALESMAN - GOD MODE ADMIN
// ============================================

const API = '/api';
let token = localStorage.getItem('godToken');
let allProducts = [];

// ============ AUTH ============
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            token = data.token;
            localStorage.setItem('godToken', token);
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboardPage').style.display = 'block';
            loadAllData();
            logConsole('GOD MODE activated', 'info');
            logConsole(`Welcome, ${data.user.username}`, 'info');
        } else {
            showToast('❌ Invalid credentials', 'error');
        }
    } catch (err) {
        showToast('❌ Connection error', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('godToken');
    token = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
}

// Check auth
if (token) {
    fetch(`${API}/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
        if (d.success) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboardPage').style.display = 'block';
            loadAllData();
            updateClock();
            setInterval(updateClock, 1000);
        } else {
            localStorage.removeItem('godToken');
            token = null;
        }
    });
}

function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + 
        ' • ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============ DATA ============
async function loadAllData() {
    await loadProducts();
    await loadStats();
    logConsole('Dashboard data loaded', 'info');
}

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products?limit=200`);
        const data = await res.json();
        allProducts = data.data;
        document.getElementById('productCount').textContent = allProducts.length;
        updateAllViews();
    } catch (e) {
        logConsole('Failed to load products', 'error');
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API}/stats`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('statTotal').textContent = data.data.totalProducts;
            document.getElementById('statActive').textContent = data.data.activeProducts;
            document.getElementById('statFeatured').textContent = data.data.featuredProducts;
            document.getElementById('statViews').textContent = data.data.totalViews;
        }
    } catch (e) {}
}

function updateAllViews() {
    updateRecentProducts();
    updateProductTable();
}

function updateRecentProducts() {
    const recent = allProducts.slice(0, 5);
    document.getElementById('recentProducts').innerHTML = recent.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small class="text-muted">${p.brand}</small></td>
            <td><strong>₹${p.price?.toLocaleString('en-IN')}</strong></td>
            <td>⭐ ${p.rating}</td>
            <td><span class="${p.active !== false ? 'status-active' : 'status-inactive'}">${p.active !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
            <td>${p.views || 0}</td>
        </tr>
    `).join('');
}

function updateProductTable() {
    const search = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const catFilter = document.getElementById('productCategoryFilter')?.value || 'all';
    
    let filtered = allProducts;
    if (catFilter !== 'all') filtered = filtered.filter(p => p.category === catFilter);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search));
    
    document.getElementById('allProductsTable').innerHTML = filtered.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small class="text-muted">${p.brand}</small></td>
            <td><span class="badge bg-dark">${p.category}</span></td>
            <td><strong>₹${p.price?.toLocaleString('en-IN')}</strong></td>
            <td>⭐ ${p.rating}</td>
            <td><span class="${p.active !== false ? 'status-active' : 'status-inactive'}">${p.active !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
            <td>${p.views || 0}</td>
            <td>
                <button class="btn-icon-dark" onclick="toggleProduct(${p.id})" title="Toggle"><i class="fas fa-power-off"></i></button>
                <button class="btn-icon-dark" onclick="toggleFeatured(${p.id})" title="Featured">${p.featured ? '⭐' : '☆'}</button>
                <button class="btn-icon-dark text-danger" onclick="deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function filterProductTable() { updateProductTable(); }

// ============ ACTIONS ============
async function handleAddProduct(e) {
    e.preventDefault();
    const product = {
        name: document.getElementById('addName').value,
        brand: document.getElementById('addBrand').value,
        category: document.getElementById('addCategory').value,
        price: parseInt(document.getElementById('addPrice').value),
        budget: document.getElementById('addBudget').value,
        rating: parseFloat(document.getElementById('addRating').value),
        image: document.getElementById('addImage').value || 'https://placehold.co/400x400?text=Product',
        whyBest: document.getElementById('addWhyBest').value,
        bestFor: document.getElementById('addBestFor').value,
        onlinePrice: document.getElementById('addOnlinePrice').value,
        offlinePrice: document.getElementById('addOfflinePrice').value,
        bestPrice: document.getElementById('addOnlinePrice').value + ' (Online)',
        stores: document.getElementById('addStores').value.split(',').map(s => s.trim()).filter(Boolean),
        featured: document.getElementById('addFeatured').checked,
        active: true
    };
    
    try {
        const res = await fetch(`${API}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('addMessage').innerHTML = '<div class="alert alert-success">✅ Product added!</div>';
            document.getElementById('addProductForm').reset();
            await loadProducts();
            logConsole(`Product added: ${product.name}`, 'info');
            showToast('✅ Product added successfully!');
        } else {
            document.getElementById('addMessage').innerHTML = `<div class="alert alert-danger">❌ ${data.message}</div>`;
        }
    } catch (e) {
        document.getElementById('addMessage').innerHTML = '<div class="alert alert-danger">❌ Failed</div>';
    }
}

async function handleBulkImport() {
    const json = document.getElementById('bulkJson').value;
    try {
        const products = JSON.parse(json);
        if (!Array.isArray(products)) throw new Error('Must be an array');
        
        const res = await fetch(`${API}/products/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ products })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('bulkMessage').innerHTML = `<div class="alert alert-success">✅ ${data.count} products imported!</div>`;
            document.getElementById('bulkJson').value = '';
            await loadProducts();
            logConsole(`Bulk import: ${data.count} products`, 'info');
        } else {
            document.getElementById('bulkMessage').innerHTML = `<div class="alert alert-danger">❌ ${data.message}</div>`;
        }
    } catch (e) {
        document.getElementById('bulkMessage').innerHTML = '<div class="alert alert-danger">❌ Invalid JSON format</div>';
    }
}

async function toggleProduct(id) {
    try {
        await fetch(`${API}/products/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadProducts();
        logConsole(`Toggled product #${id}`, 'warn');
    } catch (e) {}
}

async function toggleFeatured(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    try {
        await fetch(`${API}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ featured: !product.featured })
        });
        await loadProducts();
        logConsole(`Featured toggled: ${product.name}`, 'warn');
    } catch (e) {}
}

async function deleteProduct(id) {
    if (!confirm('⚠️ DELETE this product permanently?')) return;
    
    try {
        await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadProducts();
        logConsole(`Product #${id} deleted`, 'error');
        showToast('🗑️ Product deleted!');
    } catch (e) {}
}

async function handleSaveSettings(e) {
    e.preventDefault();
    const settings = {
        siteName: document.getElementById('siteName').value,
        updateFrequency: parseInt(document.getElementById('updateFreq').value)
    };
    
    try {
        const res = await fetch(`${API}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        document.getElementById('settingsMessage').innerHTML = data.success
            ? '<div class="alert alert-success">✅ Settings saved!</div>'
            : '<div class="alert alert-danger">❌ Failed</div>';
        logConsole('Settings updated', 'info');
    } catch (e) {}
}

// ============ CONSOLE ============
function logConsole(message, type = '') {
    const consoleEl = document.getElementById('consoleOutput');
    if (!consoleEl) return;
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function clearConsole() {
    const consoleEl = document.getElementById('consoleOutput');
    if (consoleEl) consoleEl.innerHTML = '<div class="console-line info">> Console cleared</div>';
}

function executeCommand() {
    const input = document.getElementById('consoleInput');
    const cmd = input.value.trim().toLowerCase();
    if (!cmd) return;
    
    logConsole(`> ${cmd}`, 'info');
    
    switch (cmd) {
        case 'help':
            logConsole('Available: help, stats, reload, clear, logout, products', 'info');
            break;
        case 'stats':
            loadStats().then(() => logConsole('Stats refreshed', 'info'));
            break;
        case 'reload':
            loadAllData().then(() => logConsole('Data reloaded', 'info'));
            break;
        case 'clear':
            clearConsole();
            break;
        case 'logout':
            handleLogout();
            break;
        case 'products':
            logConsole(`Total products: ${allProducts.length}`, 'info');
            break;
        default:
            logConsole(`Unknown command: ${cmd}`, 'warn');
    }
    
    input.value = '';
}

// ============ TABS ============
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');
    
    const linkEl = document.querySelector(`.sidebar-link[onclick*="${tab}"]`);
    if (linkEl) linkEl.classList.add('active');
    
    const titles = {
        dashboard: '📊 Dashboard',
        products: '📱 Products',
        add: '➕ Add Product',
        bulk: '📦 Bulk Import',
        console: '💻 Console',
        settings: '⚙️ Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tab] || tab;
    
    if (tab === 'products') updateProductTable();
    if (tab === 'settings') loadSettings();
    logConsole(`Switched to: ${tab}`, 'info');
}

async function loadSettings() {
    try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('siteName').value = data.data.siteName || '';
            document.getElementById('updateFreq').value = data.data.updateFrequency || 10;
        }
    } catch (e) {}
}

// ============ TOAST ============
function showToast(message, type = 'info') {
    const colors = { info: '#6366f1', success: '#10b981', error: '#ef4444', warn: '#f59e0b' };
    const toast = document.createElement('div');
    toast.className = 'toast-god';
    toast.innerHTML = `<div style="background:${colors[type]};color:white;padding:14px 24px;border-radius:16px;font-weight:600;font-size:14px;box-shadow:0 10px 40px rgba(0,0,0,0.5);">${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('productSearch')?.focus();
    }
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        switchTab('dashboard');
    }
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        switchTab('add');
    }
});
