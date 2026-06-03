AOS.init({duration:800,once:true,offset:80});

let products=[],wishlist=JSON.parse(localStorage.getItem('sw')||'[]'),currentFilter='all',currentBudget='all';

// Preloader
window.addEventListener('load',()=>{
    setTimeout(()=>{document.getElementById('preloader').classList.add('fade-out');setTimeout(()=>document.getElementById('preloader').remove(),500)},500);
    // Welcome modal
    if(!sessionStorage.getItem('wm')){
        setTimeout(()=>{
            new bootstrap.Modal(document.getElementById('welcomeModal')).show();
            document.getElementById('welcomeModal').addEventListener('hidden.bs.modal',()=>sessionStorage.setItem('wm','1'));
        },1500);
    }
});

// Update date
const now=new Date(),d=now.getDate(),base=d-(d%10)||1,last=new Date(now.getFullYear(),now.getMonth(),base);
document.getElementById('lastUpdated').textContent=last.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

// Load products from API
async function loadProducts(){
    document.getElementById('loading').classList.remove('d-none');
    try{const r=await fetch('/api/products');const d=await r.json();products=d.data}
    catch(e){console.log('Using local products')}
    displayProducts(products);
    document.getElementById('loading').classList.add('d-none');
}

function displayProducts(arr){
    const g=document.getElementById('productsGrid');
    if(!arr.length){g.innerHTML='<div class="col-12 text-center py-5"><p class="text-muted fs-4">🔍 No products found</p></div>';return}
    g.innerHTML=arr.map((p,i)=>`
        <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${i*60}">
            <div class="product-card">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/400x300?text=Product'">
                <div class="p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div><h6 class="fw-bold mb-0">${p.name}</h6><small class="text-muted">${p.brand} · ⭐${p.rating}</small></div>
                        <h5 class="fw-black text-primary mb-0">₹${p.price.toLocaleString('en-IN')}</h5>
                    </div>
                    <div class="why-box"><small class="fw-bold text-primary d-block mb-1">✦ Why Best:</small><small class="text-muted">${p.whyBest}</small></div>
                    <div class="d-flex flex-wrap gap-1 mb-2"><small class="badge bg-primary bg-opacity-10 text-primary">${p.bestFor}</small></div>
                    <div class="buy-box"><small class="fw-bold text-success d-block mb-1">${p.bestPrice}</small><div class="d-flex flex-wrap gap-1">${(p.stores||[]).map(s=>`<span class="badge bg-white text-dark border">${s}</span>`).join('')}</div></div>
                    <button onclick="addToWishlist(${p.id})" class="btn w-100 rounded-3 fw-semibold ${wishlist.includes(p.id)?'btn-danger':'btn-primary'}" style="${wishlist.includes(p.id)?'':'background:linear-gradient(135deg,#2563eb,#4f46e5);border:none'}"><i class="far fa-${wishlist.includes(p.id)?'check-circle':'bookmark'} me-1"></i>${wishlist.includes(p.id)?'Saved':'Save Pick'}</button>
                </div>
            </div>
        </div>`).join('');
}

function filterProducts(c){currentFilter=c;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));event.target.classList.add('active');filterAndDisplay()}
function filterByBudget(b){currentBudget=b;filterAndDisplay()}
function filterAndDisplay(){let f=products;if(currentFilter!=='all')f=f.filter(p=>p.category===currentFilter);if(currentBudget!=='all')f=f.filter(p=>p.budget===currentBudget);displayProducts(f)}

function addToWishlist(id){const i=wishlist.indexOf(id);i===-1?wishlist.push(id):wishlist.splice(i,1);localStorage.setItem('sw',JSON.stringify(wishlist));updateWishlistCount();filterAndDisplay()}
function updateWishlistCount(){document.getElementById('wishlistCount').textContent=wishlist.length}
function toggleWishlist(){const e=document.getElementById('wishlistSidebar');const bs=bootstrap.Offcanvas.getOrCreateInstance(e);bs.toggle();updateWishlistDisplay()}
function updateWishlistDisplay(){const c=document.getElementById('wishlistItems');if(!wishlist.length){c.innerHTML='<p class="text-center text-muted py-5">No saved picks yet.</p>';return}c.innerHTML=wishlist.map(id=>{const p=products.find(x=>x.id===id);return p?`<div class="d-flex gap-3 p-3 bg-light rounded-3 mb-2"><img src="${p.image}" style="width:45px;height:45px;object-fit:cover" class="rounded-2"><div class="flex-grow-1"><p class="fw-semibold small mb-0">${p.name}</p><small class="text-primary fw-bold">₹${p.price.toLocaleString('en-IN')}</small></div><button onclick="addToWishlist(${p.id})" class="btn btn-sm text-danger"><i class="fas fa-trash"></i></button></div>`:''}).join('')}

// Counter animation
new IntersectionObserver(e=>e.forEach(en=>{if(en.isIntersecting){en.target.querySelectorAll('.counter').forEach(c=>{const t=+c.dataset.target,s=t/125;let cur=0;(function u(){cur+=s;if(cur<t){c.textContent=Math.floor(cur)+'+';requestAnimationFrame(u)}else c.textContent=t+'+'})()});this.unobserve(en.target)}}),{threshold:.3}).observe(document.querySelector('#hero'));

// 3D Globe
setTimeout(function initGlobe(){
    const c=document.getElementById('globe-container');if(!c||!window.THREE)return;
    c.innerHTML='';const w=c.clientWidth,h=c.clientHeight;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,w/h,.1,1000);
    camera.position.set(0,.1,3.8);
    const renderer=new THREE.WebGLRenderer({antialias:!0,alpha:!0});renderer.setSize(w,h);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));c.appendChild(renderer.domElement);
    const loader=new THREE.TextureLoader();
    const earth=new THREE.Mesh(new THREE.SphereGeometry(1.1,64,64),new THREE.MeshPhongMaterial({map:loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'),specular:new THREE.Color('#334466'),shininess:8}));scene.add(earth);
    const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.13,64,64),new THREE.MeshPhongMaterial({map:loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png'),transparent:!0,opacity:.25}));scene.add(clouds);
    const lat=26.8467*Math.PI/180,lon=80.9462*Math.PI/180,luckPos=new THREE.Vector3(1.13*Math.cos(lat)*Math.cos(lon),1.13*Math.sin(lat),-1.13*Math.cos(lat)*Math.sin(lon));
    const marker=new THREE.Mesh(new THREE.SphereGeometry(.05,16,16),new THREE.MeshBasicMaterial({color:0xff0000}));marker.position.copy(luckPos);earth.add(marker);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.07,.1,32),new THREE.MeshBasicMaterial({color:0xff4444,side:THREE.DoubleSide,transparent:!0,opacity:.7}));ring.position.copy(luckPos);ring.lookAt(new THREE.Vector3(0,0,0));earth.add(ring);
    scene.add(new THREE.AmbientLight(0x445566,.8));const sun=new THREE.DirectionalLight(0xffffff,1.3);sun.position.set(5,3,5);scene.add(sun);
    const startPos=camera.position.clone(),endPos=luckPos.clone().multiplyScalar(2.8);endPos.z+=.5;
    let zoom=0,zoomingIn=!0,hold=0;
    function animate(){requestAnimationFrame(animate);earth.rotation.y+=.0015;clouds.rotation.y+=.0018;const p=1+Math.sin(Date.now()*.004)*.4;ring.scale.set(p,p,p);ring.material.opacity=.5+Math.sin(Date.now()*.004)*.3;marker.scale.setScalar(1+Math.sin(Date.now()*.006)*.25);
        if(zoomingIn){zoom+=.012;if(zoom>=1){zoom=1;zoomingIn=!1;hold=0}}else if(hold<200)hold++;else{zoom-=.003;if(zoom<=0){zoom=0;zoomingIn=!0}}
        const t=zoom<.5?4*zoom*zoom*zoom:1-Math.pow(-2*zoom+2,3)/2;camera.position.lerpVectors(startPos,endPos,t);const wl=luckPos.clone();earth.localToWorld(wl);camera.lookAt(wl);renderer.render(scene,camera)}
    animate();window.addEventListener('resize',()=>{const nw=c.clientWidth,nh=c.clientHeight;camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh)})
},500);

loadProducts();