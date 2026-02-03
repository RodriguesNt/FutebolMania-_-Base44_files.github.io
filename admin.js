
// Check auth immediately
const user = JSON.parse(localStorage.getItem('authUser') || '{}');
if (!user.is_admin) {
  alert("Acesso restrito a administradores!");
  window.location.href = "loja.html";
}

document.getElementById('adminName').innerText = user.name || 'Admin';

function logout() {
  localStorage.removeItem('authUser');
  window.location.href = "loja.html";
}

// Load products
document.addEventListener('productsLoaded', renderAdminList);
document.addEventListener('DOMContentLoaded', () => {
  // If products already loaded in products.js before this listener
  if(window.products && window.products.length > 0){
    renderAdminList();
  } else {
    // Garantir busca mesmo que o listener de products.js não tenha disparado
    try { 
      if(typeof fetchProducts === 'function'){ 
        fetchProducts(); 
      } else {
        fetch('get_products.php').then(r=>r.json()).then(data=>{
          if(data && data.ok && Array.isArray(data.products)){
            window.products = data.products;
            document.dispatchEvent(new Event('productsLoaded'));
            renderAdminList();
          }
        }).catch(()=>{});
      }
    } catch(e) {}
    // Fallback: tentar renderizar após pequeno atraso
    setTimeout(()=>{ if(window.products && window.products.length>0) renderAdminList(); }, 1200);
  }
});

function renderAdminList() {
  try {
    const list = document.getElementById('productList');
    const countEl = document.getElementById('prodCount');
    if(!list) return;
    const data = Array.isArray(window.products) ? window.products : [];
    list.innerHTML = '';
    if(countEl) countEl.innerText = `${data.length} produtos`;
    if(data.length === 0){
      list.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--muted);">Nenhum produto encontrado</div>';
      return;
    }
    const sorted = [...data].reverse();
    sorted.forEach(p => {
      const el = document.createElement('div');
      el.className = 'product-item';
      const base = (p && typeof p.price === 'number') ? p.price : 0;
      const minPrice = (p && p.price_torcedor!=null && p.price_jogador!=null) ? Math.min(p.price_torcedor, p.price_jogador) :
                       (p && p.price_torcedor!=null ? p.price_torcedor : (p && p.price_jogador!=null ? p.price_jogador : base));
      const maxPrice = (p && p.price_torcedor!=null && p.price_jogador!=null) ? Math.max(p.price_torcedor, p.price_jogador) : null;
      const priceLabel = maxPrice!=null ? `${Number(minPrice).toFixed(2)} - ${Number(maxPrice).toFixed(2)}` : `${Number(minPrice||base).toFixed(2)}`;
      const league = (p && typeof p.league === 'string') ? p.league.toUpperCase() : '—';
      const type = (p && p.type) ? p.type : '—';
      const cover = (p && Array.isArray(p.images)&&p.images.length>0) ? p.images[0] : (p && p.img ? p.img : '');
      el.innerHTML = `
        <img src="${cover}" alt="${p && p.name ? p.name : ''}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2760%27 height=%2760%27><rect width=%27100%25%27 height=%27100%25%27 fill=%27%230f172a%27/></svg>'">
        <div class="product-info">
          <div style="font-weight:700; font-size:1.1rem">${p && p.name ? p.name : 'Produto'}</div>
          <div style="color: #94a3b8; font-size: 0.9em; margin-top:4px">
            ${league} • ${type} • R$ ${priceLabel}
            ${p && p.featured ? '<span style="color:#fbbf24; margin-left:6px">★ Destaque</span>' : ''}
          </div>
        </div>
        <div class="product-actions">
          <button class="btn btn-secondary" onclick="editProduct('${p && p.id ? p.id : ''}')">Editar</button>
          <button class="btn btn-danger" onclick="deleteProduct('${p && p.id ? p.id : ''}')">Excluir</button>
        </div>
      `;
      list.appendChild(el);
    });
  } catch (error) {
    const list = document.getElementById('productList');
    if(list){
      list.innerHTML = '<div style="text-align:center; padding: 40px; color: #ef4444;">Erro ao carregar produtos</div>';
    }
    console.error('Erro ao renderizar lista de produtos:', error);
  }
}

// Modal logic
const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');
const imgInput = document.getElementById('prodImgFile');
const imgJsonInput = document.getElementById('prodImagesJson');
const imgPreview = document.getElementById('imgPreview');
const imgUrlsInput = document.getElementById('prodImageUrls');

window.openModal = function(isEdit = false) {
  modal.style.display = 'flex';
  if(!isEdit) {
    document.getElementById('modalTitle').innerText = 'Novo Produto';
    form.reset();
    document.getElementById('prodId').value = '';
    imgJsonInput.value = '[]';
    if(imgUrlsInput) imgUrlsInput.value = '';
    imgPreview.innerHTML = 'Sem imagem';
    imgPreview.style.backgroundImage = 'none';
  }
}

window.closeModal = function() {
  modal.style.display = 'none';
}

window.editProduct = function(id) {
  const p = products.find(x => x.id === id);
  if(!p) return;
  
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  const pTor = (p.price_torcedor!==undefined && p.price_torcedor!==null) ? p.price_torcedor : '';
  const pJog = (p.price_jogador!==undefined && p.price_jogador!==null) ? p.price_jogador : '';
  const elTor = document.getElementById('priceTorcedor'); if(elTor) elTor.value = pTor;
  const elJog = document.getElementById('priceJogador'); if(elJog) elJog.value = pJog;
  document.getElementById('prodLeague').value = p.league;
  document.getElementById('prodBadge').value = p.badge || '';
  document.getElementById('prodType').value = p.type || 'torcedor';
  document.getElementById('prodFeatured').checked = !!p.featured;
  
  const imgs = Array.isArray(p.images) ? p.images : (p.img ? [p.img] : []);
  imgJsonInput.value = JSON.stringify(imgs);
  renderPreview(imgs);
  
  document.getElementById('modalTitle').innerText = 'Editar Produto';
  openModal(true);
}

function renderPreview(imgs){
  imgPreview.innerHTML = '';
  if(!imgs || imgs.length===0){
    const ph = document.createElement('div');
    ph.style.gridColumn = '1 / -1';
    ph.style.textAlign = 'center';
    ph.innerText = 'Pré-visualização';
    imgPreview.appendChild(ph);
    return;
  }
  imgs.forEach((src, idx) => {
    const box = document.createElement('div');
    Object.assign(box.style, {width:'100%', paddingTop:'100%', position:'relative', borderRadius:'8px', overflow:'hidden', background:'#000'});
    const img = document.createElement('img');
    Object.assign(img.style, {position:'absolute', inset:'0', width:'100%', height:'100%', objectFit:'cover'});
    img.src = src;
    box.appendChild(img);
    imgPreview.appendChild(box);
  });
}

async function compressImage(dataUrl, maxW=1024, quality=0.72){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      const ratio = img.width > maxW ? (maxW / img.width) : 1;
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL('image/jpeg', quality);
      resolve(out);
    };
    img.onerror = ()=> resolve(dataUrl);
    img.src = dataUrl;
  });
}

imgInput.addEventListener('change', function() {
  const files = Array.from(this.files||[]);
  const max = 6;
  const selected = files.slice(0, max);
  const readers = selected.map(f => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = async e => {
      try{
        const compressed = await compressImage(e.target.result);
        resolve(compressed);
      }catch(err){ resolve(e.target.result); }
    };
    r.onerror = reject;
    r.readAsDataURL(f);
  }));
  Promise.all(readers).then(imgs=>{
    imgJsonInput.value = JSON.stringify(imgs);
    renderPreview(imgs);
  }).catch(()=>{
    alert("Falha ao processar algumas imagens.");
  });
});

// Save
form.onsubmit = async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('prodId').value;
  const payload = {
    auth_email: user.email,
    auth_hash: user.password_hash,
    action: 'save',
    product: {
      id: id || undefined,
      name: document.getElementById('prodName').value,
      price_torcedor: (function(){ const el=document.getElementById('priceTorcedor'); return el?el.value:'' })(),
      price_jogador: (function(){ const el=document.getElementById('priceJogador'); return el?el.value:'' })(),
      league: document.getElementById('prodLeague').value,
      badge: document.getElementById('prodBadge').value,
      type: document.getElementById('prodType').value,
      featured: document.getElementById('prodFeatured').checked,
      images: (function(){ try{ return JSON.parse(imgJsonInput.value||'[]') }catch(e){ return [] } })(),
      img: (function(){ try{ const a = JSON.parse(imgJsonInput.value||'[]'); return a[0]||'' }catch(e){ return '' } })(),
      image_urls: (function(){
        if(!imgUrlsInput) return [];
        const lines = (imgUrlsInput.value||'').split(/\r?\n/).map(s=>s.trim()).filter(s=>/^https?:\/\//i.test(s));
        return lines.slice(0, 10);
      })()
    }
  };
  
  const hasLocalImages = Array.isArray(payload.product.images) && payload.product.images.length>0;
  const hasUrlImages = Array.isArray(payload.product.image_urls) && payload.product.image_urls.length>0;
  if(!payload.product.img && !hasLocalImages && !hasUrlImages){
    alert('Adicione imagens (arquivo) ou informe URLs válidas.');
    btn.innerText = oldText;
    btn.disabled = false;
    return;
  }
  
  const btn = form.querySelector('button[type="submit"]');
  const oldText = btn.innerText;
  btn.innerText = "Salvando...";
  btn.disabled = true;

  try {
    const res = await fetch('save_product.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const raw = await res.text();
    let result = {};
    try { result = JSON.parse(raw); } catch(e) { result = { ok:false, error: 'invalid_response', status: res.status, raw }; }
    if(res.status===401 || result.error==='unauthorized' || result.error==='forbidden_not_admin'){
      alert('Sessão expirada ou sem permissão. Faça login novamente.');
      window.localStorage.removeItem('authUser');
      if(typeof openAuth === 'function') openAuth('login');
      return;
    }
    if(result.ok) {
      alert('Produto salvo com sucesso!');
      closeModal();
      // Reload products
      await fetchProducts();
      try {
        const pid = result.id || (payload && payload.product && payload.product.id);
        const exists = Array.isArray(window.products) && window.products.some(x => x.id === pid);
        if(!exists){
          const p = Object.assign({}, payload.product, { 
            id: pid, 
            price: (function(){
              const pt = payload.product.price_torcedor;
              const pj = payload.product.price_jogador;
              const c = [];
              if(pt!=='' && pt!=null) c.push(Number(pt));
              if(pj!=='' && pj!=null) c.push(Number(pj));
              return c.length>0 ? Math.min.apply(null, c) : (payload.product.price||0);
            })(),
            featured: !!payload.product.featured,
            images: Array.isArray(payload.product.images) ? payload.product.images : (payload.product.img ? [payload.product.img] : [])
          });
          window.products = Array.isArray(window.products) ? [...window.products, p] : [p];
        }
      } catch(_) {}
      renderAdminList();
    } else {
      alert('Erro ao salvar: ' + (result.error || ('HTTP '+res.status)));
    }
  } catch(err) {
    console.error(err);
    alert('Erro de conexão ao salvar produto.');
  } finally {
    btn.innerText = oldText;
    btn.disabled = false;
  }
};

window.deleteProduct = async function(id) {
  if(!confirm('Tem certeza que deseja excluir este produto?')) return;
  
  const payload = {
    auth_email: user.email,
    auth_hash: user.password_hash,
    action: 'delete',
    id: id
  };

  try {
    const res = await fetch('save_product.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if(result.ok) {
      // Reload products
      await fetchProducts();
      renderAdminList();
    } else {
      alert('Erro ao excluir: ' + result.error);
    }
  } catch(err) {
    alert('Erro de conexão');
  }
}
