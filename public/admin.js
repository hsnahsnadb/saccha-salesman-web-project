const API = '/api';
let token = localStorage.getItem('adminToken');
let allProducts = [];

// ============ LOGIN ============
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
            localStorage.setItem('adminToken', token);
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboardPage').style.display = 'block';
            loadAllData();
        } else {
            alert('❌ ' + (data.message || 'Invalid username or password'));
        }
    } catch (err) {
        alert('❌ Connection error. Please try again.');
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    token = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
}

// ============ CHECK AUTH ON LOAD ============
if (token) {
    fetch(`${API}/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
        if (d.success) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboardPage').style.display = 'block';
            loadAllData();
        } else {
            localStorage.removeItem('adminToken');
            token = null;
        }
    });
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
        updateDashboard();
        updateProductTable();
        updateFeatured();
    } catch (e) {}
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

function updateDashboard() {
    const recent = allProducts.slice(0, 5);
    document.getElementById('recentProducts').innerHTML = recent.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small>${p.brand}</small></td>
            <td>₹${p.price?.toLocaleString('en-IN')}</td>
            <td>⭐${p.rating}</td>
            <td>${p.active !== false ? '✅ Active' : '❌ Inactive'}</td>
            <td>${p.views || 0}</td>
        </tr>
    `).join('');
}

function updateProductTable() {
    document.getElementById('allProductsTable').innerHTML = allProducts.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small>${p.brand}</small></td>
            <td>${p.category}</td>
            <td>₹${p.price?.toLocaleString('en-IN')}</td>
            <td>⭐${p.rating}</td>
            <td>${p.active !== false ? '✅' : '❌'}</td>
            <td>${p.views || 0}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="toggleProduct(${p.id})">Toggle</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateFeatured() {
    const featured = allProducts.filter(p => p.featured);
    document.getElementById('featuredProducts').innerHTML = featured.length ? featured.map(p => `
        <div class="col-md-4"><div class="card p-3"><h6>${p.name}</h6><p>₹${p.price?.toLocaleString('en-IN')}</p></div></div>
    `).join('') : '<p class="text-muted">No featured products</p>';
}

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
        bestPrice: document.getElementById('addOnlinePrice').value,
        stores: document.getElementById('addStores').value.split(',').map(s => s.trim()).filter(Boolean),
        featured: document.getElementById('addFeatured').checked
    };
    
    try {
        const res = await fetch(`${API}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Product added!');
            document.getElementById('addProductForm').reset();
            loadAllData();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (e) {
        alert('❌ Failed to add product');
    }
}

async function toggleProduct(id) {
    try {
        await fetch(`${API}/products/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadAllData();
    } catch (e) {}
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        await fetch(`${API}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadAllData();
    } catch (e) {}
}

// ============ TABS ============
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) tabEl.classList.add('active');
    
    const linkEl = document.querySelector(`.sidebar-link[onclick*="${tab}"]`);
    if (linkEl) linkEl.classList.add('active');
}
