// ============================================
// SACCHA SALESMAN - ADMIN PANEL
// ============================================

const API = '/api';
let token = localStorage.getItem('adminToken');
let allProducts = [];
let currentTab = 'dashboard';

// ============ AUTH ============
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            showDashboard();
            loadAllData();
            showToast('✅ Welcome back, Admin!');
        } else {
            errorEl.textContent = data.message || 'Login failed';
            errorEl.classList.remove('d-none');
        }
    } catch (err) {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.classList.remove('d-none');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).finally(() => {
            localStorage.removeItem('adminToken');
            token = null;
            showLogin();
        });
    }
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + 
        ' • ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Check auth on load
if (token) {
    fetch(`${API}/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
        if (d.success) {
            showDashboard();
            loadAllData();
        } else {
            localStorage.removeItem('adminToken');
            token = null;
            showLogin();
        }
    }).catch(() => {
        showLogin();
    });
} else {
    showLogin();
}

// ============ LOAD DATA ============
async function loadAllData() {
    await loadProducts();
    await loadStats();
}

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products?limit=100`);
        const data = await res.json();
        allProducts = data.data;
        document.getElementById('productCount').textContent = allProducts.length;
        updateAllViews();
    } catch (e) {
        console.error('Failed to load products');
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
            document.getElementById('analyticsTotal').textContent = data.data.totalProducts;
            document.getElementById('analyticsViews').textContent = data.data.totalViews;
            document.getElementById('analyticsAvgRating').textContent = data.data.averageRating;
            
            // Quick stats
            const cats = data.data.categoryList || [];
            document.getElementById('quickStats').innerHTML = `
                <div class="mb-3"><small class="text-muted">Categories</small><h5 class="fw-bold">${data.data.categories}</h5></div>
                <div class="mb-3"><small class="text-muted">Avg Rating</small><h5 class="fw-bold">⭐ ${data.data.averageRating}</h5></div>
                <div class="mb-3"><small class="text-muted">Total Views</small><h5 class="fw-bold">👁️ ${data.data.totalViews}</h5></div>
                <div><small class="text-muted">Categories</small><div class="d-flex flex-wrap gap-1 mt-1">${cats.map(c => `<span class="badge bg-primary bg-opacity-10 text-primary">${c}</span>`).join('')}</div></div>
            `;
        }
    } catch (e) {
        console.error('Failed to load stats');
    }
}

// ============ UPDATE VIEWS ============
function updateAllViews() {
    updateDashboardProducts();
    updateProductTable();
    updateFeaturedProducts();
    updatePopularProducts();
}

function updateDashboardProducts() {
    const recent = allProducts.slice(0, 5);
    document.getElementById('recentProducts').innerHTML = recent.map(p => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:10px;" onerror="this.src='https://placehold.co/40x40?text=P'">
                    <div>
                        <strong class="d-block">${p.name}</strong>
                        <small class="text-muted">${p.brand} · ${p.category}</small>
                    </div>
                </div>
            </td>
            <td><strong>₹${p.price?.toLocaleString('en-IN')}</strong></td>
            <td>⭐ ${p.rating}</td>
            <td><span class="${p.active !== false ? 'status-active' : 'status-inactive'}">${p.active !== false ? 'Active' : 'Inactive'}</span></td>
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
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:10px;" onerror="this.src='https://placehold.co/40x40?text=P'">
                    <div>
                        <strong class="d-block">${p.name}</strong>
                        <small class="text-muted">${p.brand}</small>
                    </div>
                </div>
            </td>
            <td><span class="badge bg-light text-dark">${p.category}</span></td>
            <td><strong>₹${p.price?.toLocaleString('en-IN')}</strong></td>
            <td>⭐ ${p.rating}</td>
            <td><span class="${p.active !== false ? 'status-active' : 'status-inactive'}">${p.active !== false ? 'Active' : 'Inactive'}</span></td>
            <td>${p.views || 0}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn-icon bg-primary bg-opacity-10 text-primary" onclick="toggleProduct(${p.id})" title="Toggle Active"><i class="fas fa-power-off"></i></button>
                    <button class="btn-icon bg-warning bg-opacity-10 text-warning" onclick="toggleFeatured(${p.id})" title="Featured">${p.featured ? '⭐' : '☆'}</button>
                    <button class="btn-icon bg-danger bg-opacity-10 text-danger" onclick="deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateFeaturedProducts() {
    const featured = allProducts.filter(p => p.featured);
    document.getElementById('featuredProducts').innerHTML = featured.length ? featured.map(p => `
        <div class="col-md-4">
            <div class="card card-custom h-100">
                <img src="${p.image}" style="height:180px;object-fit:cover;" onerror="this.src='https://placehold.co/400x200?text=Product'">
                <div class="p-3">
                    <h6 class="fw-bold">${p.name}</h6>
                    <p class="text-muted small mb-2">${p.brand} · ₹${p.price?.toLocaleString('en-IN')}</p>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="toggleFeatured(${p.id})">Remove Featured</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') : '<div class="col-12 text-center text-muted py-5"><i class="fas fa-star fs-1 mb-2 d-block"></i>No featured products</div>';
}

function updatePopularProducts() {
    const popular = [...allProducts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
    document.getElementById('popularProducts').innerHTML = popular.map(p => `
        <div class="col-md-4">
            <div class="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border">
                <span class="fw-black text-primary fs-5">#${popular.indexOf(p) + 1}</span>
                <div>
                    <strong class="d-block small">${p.name}</strong>
                    <small class="text-muted">${p.views || 0} views</small>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProductTable() {
    updateProductTable();
}

// ============ ACTIONS ============
async function handleAddProduct(e) {
    e.preventDefault();
    const formData = {
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('addMessage').innerHTML = '<div class="alert alert-success rounded-3">✅ Product added successfully!</div>';
            document.getElementById('addProductForm').reset();
            await loadProducts();
            showToast('✅ Product added!');
        } else {
            document.getElementById('addMessage').innerHTML = `<div class="alert alert-danger rounded-3">❌ ${data.message}</div>`;
        }
    } catch (err) {
        document.getElementById('addMessage').innerHTML = '<div class="alert alert-danger rounded-3">❌ Failed to add product</div>';
    }
}

async function toggleProduct(id) {
    try {
        const res = await fetch(`${API}/products/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            await loadProducts();
            showToast(`✅ Product ${data.data.active ? 'activated' : 'deactivated'}!`);
        }
    } catch (e) {}
}

async function toggleFeatured(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    try {
        const res = await fetch(`${API}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ featured: !product.featured })
        });
        const data = await res.json();
        if (data.success) {
            await loadProducts();
            showToast(`✅ ${data.data.featured ? 'Added to' : 'Removed from'} featured!`);
        }
    } catch (e) {}
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const res = await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            await loadProducts();
            showToast('🗑️ Product deleted!');
        }
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        document.getElementById('settingsMessage').innerHTML = data.success
            ? '<div class="alert alert-success rounded-3">✅ Settings saved!</div>'
            : '<div class="alert alert-danger rounded-3">❌ Failed to save</div>';
    } catch (e) {
        document.getElementById('settingsMessage').innerHTML = '<div class="alert alert-danger rounded-3">❌ Error saving settings</div>';
    }
}

// ============ TABS ============
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');
    
    const linkEl = document.querySelector(`.sidebar-link[onclick*="${tab}"]`);
    if (linkEl) linkEl.classList.add('active');
    
    const titles = {
        dashboard: '📊 Dashboard',
        products: '📱 All Products',
        add: '➕ Add Product',
        featured: '⭐ Featured Products',
        settings: '⚙️ Settings',
        analytics: '📈 Analytics'
    };
    document.getElementById('pageTitle').textContent = titles[tab] || tab;
    document.getElementById('pageSubtitle').textContent = tab === 'dashboard' ? 'Welcome back, Admin' : 'Manage your products';
    
    if (tab === 'products') updateProductTable();
    if (tab === 'settings') loadSettings();
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
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-custom';
    toast.innerHTML = `
        <div class="bg-dark text-white px-4 py-3 rounded-4 shadow-lg d-flex align-items-center gap-2" style="font-size:14px;">
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ============ INIT ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentTab === 'products') {
        document.getElementById('productSearch').value = '';
        filterProductTable();
    }
});