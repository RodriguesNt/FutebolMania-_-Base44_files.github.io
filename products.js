const products = [
  {id:"flamengo-home", name:"Flamengo 24/25 Home", league:"br", price:100, img:"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", badge:"Destaque", featured:true, type:"torcedor"},
  {id:"palmeiras-home", name:"Palmeiras 24/25 Home", league:"br", price:100, img:"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", featured:true, type:"torcedor"},
  {id:"city-home", name:"Man City 24/25 Home", league:"pl", price:100, img:"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", featured:true, type:"torcedor"},
  {id:"brasil-home", name:"Brasil 24/25", league:"sel", price:100, img:"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", type:"torcedor"},
  {id:"real-home", name:"Real Madrid 24/25", league:"ll", price:100, img:"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", type:"torcedor"},
  {id:"barca-home", name:"Barcelona 24/25", league:"ll", price:100, img:"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", type:"torcedor"},
  
  // Novos produtos para testar as categorias
  {id:"fla-short", name:"Short Flamengo 24/25", league:"br", price:115, img:"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", type:"short"},
  {id:"fla-wind", name:"Corta Vento Flamengo", league:"br", price:270, img:"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", type:"cortavento"},
  {id:"real-player", name:"Real Madrid 24/25 Jogador", league:"ll", price:130, img:"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", type:"jogador"}
];

const pricingRules = {
  short: { 1: 115, 2: 110, 3: 100 },
  cortavento: { 1: 270, 2: 270, 3: 270 }, // Fixo
  torcedor: { 1: 100, 2: 95, 3: 90 },
  jogador: { 1: 130, 2: 120, 3: 115 }
};

function getDynamicPrice(type, totalQty) {
  const rules = pricingRules[type];
  if (!rules) return 0; // Fallback or handle error
  
  // Encontrar o preço baseado na quantidade (1, 2 ou 3+)
  if (totalQty >= 3) return rules[3];
  if (totalQty === 2) return rules[2];
  return rules[1];
}

let cart = [];

function loadCart(){
  try{ cart = JSON.parse(localStorage.getItem("storeCart")) || [] }catch(e){ cart=[] }
  updateCartCount();
}

function saveCart(){
  localStorage.setItem("storeCart", JSON.stringify(cart));
  updateCartCount();
}

function formatBR(v){ return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) }

function updateCartCount(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById("cartCountBadge");
  if(badge){ badge.innerText = count; }
}

function addCart(id){
  const prod = products.find(p=>p.id===id);
  if(!prod) return;
  
  const item = cart.find(i=>i.id===id);
  if(item) {
    item.qty++;
  } else {
    // Agora salvamos o type também
    cart.push({
      id, 
      name: prod.name, 
      basePrice: prod.price, // Preço base unitário (para referência)
      img: prod.img, 
      qty: 1,
      type: prod.type || 'torcedor' // Default to torcedor if missing
    });
  }
  saveCart();
  openCart();
  renderCart();
}

function openCart(){ 
  const drawer = document.getElementById("cartDrawer");
  if(drawer) drawer.classList.add("open"); 
}

function closeCart(){ 
  const drawer = document.getElementById("cartDrawer");
  if(drawer) drawer.classList.remove("open"); 
}

function renderCart(){
  const wrap = document.getElementById("cartItems"); 
  if(!wrap) return;
  
  wrap.innerHTML="";
  
  // 1. Calcular quantidades totais por tipo
  const typeCounts = {};
  cart.forEach(item => {
    const t = item.type || 'torcedor';
    typeCounts[t] = (typeCounts[t] || 0) + item.qty;
  });

  let subtotal = 0;
  
  cart.forEach((i,idx)=>{
    const currentType = i.type || 'torcedor';
    const totalQtyOfType = typeCounts[currentType] || 0;
    const unitPrice = getDynamicPrice(currentType, totalQtyOfType);
    const up = i.customization==="Personalizada" ? 20 : 0;
    const unitDisplay = unitPrice + up;
    const itemTotal = unitDisplay * i.qty;
    subtotal += itemTotal;

    const el = document.createElement("div"); el.className="item";
    el.innerHTML = `
      <img src="${i.img}" alt="${i.name}" style="width:64px;height:64px;object-fit:cover;border-radius:8px">
      <div style="flex:1">
        <strong>${i.name}</strong>
        <div class="muted">
          ${formatBR(unitDisplay)} un. 
          ${unitPrice < (pricingRules[currentType][1]) ? `<span style="color:#16a34a;font-size:0.8em">(Desconto aplicado)</span>` : ''}
        </div>
        <div class="qty">
          <button data-idx="${idx}" data-op="dec">-</button>
          <span>${i.qty}</span>
          <button data-idx="${idx}" data-op="inc">+</button>
          <button data-idx="${idx}" data-op="rm" style="margin-left:auto" class="small-btn">Remover</button>
        </div>
      </div>`;
    el.querySelectorAll("button").forEach(b=>{
      const op = b.getAttribute("data-op"); const index = +b.getAttribute("data-idx");
      b.onclick = ()=>{
        if(op==="inc") cart[index].qty++;
        if(op==="dec") cart[index].qty = Math.max(1, cart[index].qty-1);
        if(op==="rm") cart.splice(index,1);
        saveCart(); renderCart();
      };
    });
    wrap.appendChild(el);
  });
  const subtotalEl = document.getElementById("cartSubtotal");
  if(subtotalEl) subtotalEl.innerText = formatBR(subtotal);
}

// Inicialização comum
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  
  const openCartBtn = document.getElementById("openCartBtn");
  if(openCartBtn) openCartBtn.onclick = ()=>{
    openCart();
    renderCart();
  };
  
  const closeCartBtn = document.getElementById("closeCartBtn");
  if(closeCartBtn) closeCartBtn.onclick = closeCart;
  
  const checkoutBtn = document.getElementById("checkoutBtn");
  if(checkoutBtn) checkoutBtn.onclick = ()=>{
    requireAuth(()=>{ window.location.href = "pagamento.html"; });
  };

  // Perfil
  const openProfileBtn = document.getElementById("openProfileBtn");
  if(openProfileBtn) openProfileBtn.onclick = ()=>{
    requireAuth(()=>{
      renderProfileDrawer();
      const drawer = document.getElementById("profileDrawer");
      if(drawer) drawer.classList.add("open");
    });
  };
  
  const closeProfileBtn = document.getElementById("closeProfileBtn");
  if(closeProfileBtn) closeProfileBtn.onclick = closeProfile;
  
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if(saveProfileBtn) saveProfileBtn.onclick = ()=>{ 
    const n = document.getElementById("profileNameInput").value.trim(); 
    localStorage.setItem("profileName", n); 
    const helloUser = document.getElementById("helloUser");
    if(helloUser) helloUser.innerText = n?("Olá, "+n):"Bem-vindo!"; 
  };
  
  injectModal(); // Injeta o HTML e CSS do modal
});

// Garantir que injectModal rode mesmo se DOMContentLoaded já passou
if(document.body){ injectModal(); }

// --- Perfil ---
function openProfile(){
  if(isAuthenticated()){
    renderProfileDrawer();
    const drawer = document.getElementById("profileDrawer");
    if(drawer) drawer.classList.add("open");
  }else{
    openAuth("login");
  }
}
function closeProfile(){
  const drawer = document.getElementById("profileDrawer");
  if(drawer) drawer.classList.remove("open");
}
function renderProfileDrawer(){
  const u = JSON.parse(localStorage.getItem("authUser")||"null");
  const helloUser = document.getElementById("helloUser");
  if(helloUser) helloUser.innerText = u ? ("Olá, "+(u.login||u.email)) : "Bem-vindo!";
  const emailEl = document.getElementById("profileEmail");
  const cpfEl = document.getElementById("profileCPF");
  if(emailEl) emailEl.value = u && u.email ? u.email : "";
  if(cpfEl) cpfEl.value = u && u.cpf ? u.cpf : "";
  const nameEl = document.getElementById("profileName");
  const phoneEl = document.getElementById("profilePhone");
  const addrEl = document.getElementById("profileAddress");
  const birthEl = document.getElementById("profileBirthdate");
  if(nameEl) nameEl.value = u && u.name ? u.name : (localStorage.getItem("profileName")||"");
  if(phoneEl) phoneEl.value = u && u.phone ? u.phone : "";
  if(addrEl) addrEl.value = u && u.address ? u.address : "";
  if(birthEl) birthEl.value = u && u.birthdate ? u.birthdate : "";
  const btnLogout = document.getElementById("btnLogout");
  const btnChangePass = document.getElementById("btnChangePass");
  if(btnLogout) btnLogout.onclick = logout;
  if(btnChangePass) btnChangePass.onclick = changePassword;
  const btnSave = document.getElementById("btnSaveProfile");
  const btnCancel = document.getElementById("btnCancelProfile");
  const btnEdit = document.getElementById("btnEditProfile");
  if(btnSave) btnSave.onclick = saveProfileChanges;
  if(btnCancel) btnCancel.onclick = closeProfile;
  if(btnEdit) btnEdit.onclick = ()=> setProfileEditMode(true);
  const avatarBox = document.getElementById("profileAvatar");
  const avatarInput = document.getElementById("profileAvatarInput");
  const avatar = u && u.avatar ? u.avatar : "";
  if(avatarBox){
    if(avatar && avatar.startsWith("data:image")) avatarBox.style.backgroundImage = "url('"+avatar+"')";
    avatarBox.style.backgroundSize = "cover";
    avatarBox.style.backgroundPosition = "center";
    if(!avatar){ 
      const letter = (u && (u.login||u.email||"U"))[0].toUpperCase();
      avatarBox.textContent = letter;
    }else{
      avatarBox.textContent = "";
    }
  }
  if(avatarInput){
    avatarInput.onchange = ()=>{
      const f = avatarInput.files && avatarInput.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = (e)=>{
        const dataUrl = e.target.result;
        if(avatarBox){
          avatarBox.style.backgroundImage = "url('"+dataUrl+"')";
          avatarBox.textContent = "";
        }
        const auth = JSON.parse(localStorage.getItem("authUser")||"null")||{};
        auth.avatar = dataUrl;
        localStorage.setItem("authUser", JSON.stringify(auth));
      };
      reader.readAsDataURL(f);
    };
    avatarInput.disabled = true;
  }
  setProfileEditMode(false);
}
function logout(){
  localStorage.removeItem("authUser");
  closeProfile();
  showToast("Você saiu.");
}
function saveProfileChanges(){
  const auth = JSON.parse(localStorage.getItem("authUser")||"null");
  if(!auth){ openAuth("login"); return; }
  const users = getUsers();
  const idx = users.findIndex(x=>x.email===auth.email);
  if(idx<0){ alert("Usuário não encontrado."); return; }
  const name = (document.getElementById("profileName")||{value:""}).value.trim();
  const phone = (document.getElementById("profilePhone")||{value:""}).value.trim();
  const address = (document.getElementById("profileAddress")||{value:""}).value.trim();
  const birthdate = (document.getElementById("profileBirthdate")||{value:""}).value;
  const avatarBox = document.getElementById("profileAvatar");
  let avatarData = auth.avatar || "";
  const bg = avatarBox && avatarBox.style.backgroundImage;
  if(bg && bg.startsWith('url(')) avatarData = bg.slice(5,-2);
  users[idx].name = name;
  users[idx].phone = phone;
  users[idx].address = address;
  users[idx].birthdate = birthdate;
  users[idx].avatar = avatarData;
  saveUsers(users);
  const merged = Object.assign({}, auth, { name, phone, address, birthdate, avatar: avatarData });
  localStorage.setItem("authUser", JSON.stringify(merged));
  const helloUser = document.getElementById("helloUser");
  if(helloUser) helloUser.innerText = name ? ("Olá, "+name) : ("Olá, "+(auth.login||auth.email));
  showToast("Dados salvos com sucesso.", 4000);
  setProfileEditMode(false);
}
function changePassword(){
  const auth = JSON.parse(localStorage.getItem("authUser")||"null");
  if(!auth){ openAuth("login"); return; }
  const email = auth.email;
  const cur = (document.getElementById("changePassCurrent")||{value:""}).value;
  const neu = (document.getElementById("changePassNew")||{value:""}).value;
  const conf = (document.getElementById("changePassConfirm")||{value:""}).value;
  if(!cur || !neu || !conf){ alert("Preencha todas as senhas."); return; }
  if(neu.length < 4){ alert("Nova senha muito curta."); return; }
  if(neu !== conf){ alert("Confirmação não confere."); return; }
  const users = getUsers();
  const idx = users.findIndex(x=>x.email===email);
  if(idx<0){ alert("Usuário não encontrado."); return; }
  if(users[idx].password !== cur){ alert("Senha atual incorreta."); return; }
  users[idx].password = neu;
  users[idx].sessionVersion = (users[idx].sessionVersion||0)+1;
  saveUsers(users);
  const curAuth = JSON.parse(localStorage.getItem("authUser")||"null")||{};
  curAuth.sessionVersion = users[idx].sessionVersion;
  localStorage.setItem("authUser", JSON.stringify(curAuth));
  showToast("Senha alterada. Logout em outros dispositivos aplicado.", 5000);
  const fields = ["changePassCurrent","changePassNew","changePassConfirm"];
  fields.forEach(id=>{ const el = document.getElementById(id); if(el) el.value=""; });
}

let profileEditMode = false;
function setProfileEditMode(on){
  profileEditMode = !!on;
  const ids = ["profileName","profilePhone","profileAddress","profileBirthdate"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.disabled = !profileEditMode;
  });
  const avatarInput = document.getElementById("profileAvatarInput");
  if(avatarInput) avatarInput.disabled = !profileEditMode;
  const btnSave = document.getElementById("btnSaveProfile");
  const btnCancel = document.getElementById("btnCancelProfile");
  const btnEdit = document.getElementById("btnEditProfile");
  if(btnSave) btnSave.style.display = profileEditMode ? "" : "none";
  if(btnCancel) btnCancel.style.display = profileEditMode ? "" : "none";
  if(btnEdit) btnEdit.style.display = profileEditMode ? "none" : "";
}
// --- Modal Logic ---

function injectModal(){
  if(document.getElementById("productModal")) return;

  // Check if body is ready
  if(!document.body) return;

  console.log("Injecting Modal...");

  const style = document.createElement("style");
  style.innerHTML = `
    .modal-overlay{
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.8);
      z-index:999;
      display:flex;align-items:center;justify-content:center;
      opacity:0;pointer-events:none;transition:opacity 0.3s;
    }
    .modal-overlay.open{opacity:1;pointer-events:all}
    .modal-content{
      background:var(--card);color:#e5e7eb;
      width:90%;max-width:900px;
      border-radius:8px;
      overflow:hidden;
      display:flex;
      position:relative;
      box-shadow:0 20px 50px rgba(0,0,0,0.5);
    }
    .modal-close{
      position:absolute;top:10px;right:15px;
      font-size:2rem;cursor:pointer;line-height:1;z-index:10;color:#000;
      background:none;border:none;
    }
    .modal-left{width:50%;background:#0f172a;display:flex;align-items:center;justify-content:center}
    .modal-left img{width:100%;height:100%;object-fit:cover;max-height:550px}
    .modal-right{width:50%;padding:40px;display:flex;flex-direction:column}
    
    @media(max-width:768px){
      .modal-content{flex-direction:column;max-height:90vh;overflow-y:auto}
      .modal-left, .modal-right{width:100%}
      .modal-left img{height:300px}
      .modal-right{padding:20px}
    }

    .modal-title{font-size:1.8rem;font-weight:700;margin-bottom:8px;line-height:1.2}
    .modal-price{font-size:2rem;font-weight:800;margin-bottom:20px}
    
    .label{font-weight:600;margin-bottom:8px;display:block}
    
    .size-options{display:flex;gap:10px;margin-bottom:20px}
    .size-btn{
      width:45px;height:45px;
      border:1px solid var(--border);background:#111827;color:#e5e7eb;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;font-weight:600;border-radius:4px;
      transition:0.2s;
    }
    .size-btn:hover{border-color:var(--accent)}
    .size-btn.active{border:2px solid var(--accent);font-weight:800;color:#fff}

    .custom-options{display:flex;gap:10px;margin-bottom:10px}
    .custom-btn{
      padding:10px 16px;border:1px solid var(--border);background:#111827;color:#e5e7eb;
      cursor:pointer;border-radius:4px;font-weight:600;
    }
    .custom-btn.active{border:2px solid var(--accent);background:#0f172a}
    
    .personalize-banner{
      background:#1f2937;color:#fff;
      padding:12px;border-radius:6px;
      text-align:center;font-weight:600;margin-bottom:20px;
      cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
    }
    
    .action-row{display:flex;gap:16px;margin-top:auto}
    .qty-selector{
      display:flex;align-items:center;border:1px solid var(--border);border-radius:6px;background:#111827;
      overflow:hidden;height:50px;
    }
    .qty-btn{width:40px;height:100%;background:#0f172a;border:none;cursor:pointer;font-size:1.2rem;color:#e5e7eb}
    .qty-val{width:50px;text-align:center;font-weight:600;font-size:1.1rem;color:#e5e7eb}
    
    .buy-btn{
      flex:1;background:var(--accent);color:#000;
      border:none;border-radius:6px;
      font-weight:800;font-size:1.1rem;
      cursor:pointer;height:50px;
      text-transform:uppercase;
    }
    .buy-btn:hover{filter:brightness(1.05)}
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "productModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="modal-left">
        <img id="m-img" src="" alt="">
      </div>
      <div class="modal-right">
        <h2 id="m-title" class="modal-title"></h2>
        <div id="m-price" class="modal-price"></div>
        
        <label class="label">Tamanho: <span id="m-size-display">P</span></label>
        <div class="size-options">
          <button class="size-btn active" onclick="selectSize(this, 'P')">P</button>
          <button class="size-btn" onclick="selectSize(this, 'M')">M</button>
          <button class="size-btn" onclick="selectSize(this, 'G')">G</button>
          <button class="size-btn" onclick="selectSize(this, 'GG')">GG</button>
        </div>

        <div style="background:#f8f8f8;padding:12px;border-radius:6px;margin-bottom:12px;font-size:0.9rem;border:1px solid #eee">
          Para personalizar com nome e número, clique em 'Personalizada'
        </div>

        <label class="label">Adicionais: <span id="m-custom-display">Não</span></label>
        <div class="custom-options">
          <button class="custom-btn active" onclick="selectCustom(this, 'Não')">Não</button>
          <button class="custom-btn" onclick="selectCustom(this, 'Personalizada')">Personalizada</button>
        </div>

        <div class="personalize-banner">
          👕 Personalize com Fontes da Época de Lançamento
        </div>

        <div class="action-row">
          <div class="qty-selector">
            <button class="qty-btn" onclick="adjustModalQty(-1)">‹</button>
            <div id="m-qty" class="qty-val">1</div>
            <button class="qty-btn" onclick="adjustModalQty(1)">›</button>
          </div>
          <button class="buy-btn" onclick="confirmAddToModal()">COMPRAR</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

let currentModalProduct = null;
let currentSize = "P";
let currentCustom = "Não";
let currentQty = 1;

function addCart(id){
  console.log("addCart called for", id);
  // Override existing behavior to open modal
  const prod = products.find(p=>p.id===id);
  if(!prod) { console.error("Product not found"); return; }
  
  // Ensure modal exists
  if(!document.getElementById("productModal")) injectModal();
  
  const modal = document.getElementById("productModal");
  if(!modal) {
    console.error("Failed to inject modal");
    // Fallback to old behavior if modal fails
    // ... copy old add logic? No, just alert.
    alert("Erro ao abrir modal. Tente recarregar a página.");
    return;
  }

  currentModalProduct = prod;
  currentSize = "P";
  currentCustom = "Não";
  currentQty = 1;
  
  // Populate Modal
  document.getElementById("m-img").src = prod.img;
  document.getElementById("m-title").innerText = prod.name;
  document.getElementById("m-price").innerText = formatBR(prod.price);
  document.getElementById("m-qty").innerText = 1;
  
  // Reset buttons
  document.querySelectorAll(".size-btn").forEach(b => {
    b.classList.toggle("active", b.innerText === "P");
  });
  document.querySelectorAll(".custom-btn").forEach(b => {
    b.classList.toggle("active", b.innerText === "Não");
  });
  updateDisplays();

  document.getElementById("productModal").classList.add("open");
}

function closeModal(){
  document.getElementById("productModal").classList.remove("open");
}

function selectSize(btn, size){
  currentSize = size;
  document.querySelectorAll(".size-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  updateDisplays();
}

function selectCustom(btn, val){
  currentCustom = val;
  document.querySelectorAll(".custom-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  updateDisplays();
}

function updateDisplays(){
  document.getElementById("m-size-display").innerText = currentSize;
  document.getElementById("m-custom-display").innerText = currentCustom;
  const base = currentModalProduct ? (currentModalProduct.basePrice || currentModalProduct.price) : 0;
  const up = currentCustom==="Personalizada" ? 20 : 0;
  document.getElementById("m-price").innerText = formatBR(base + up);
}

function adjustModalQty(delta){
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById("m-qty").innerText = currentQty;
}

function confirmAddToModal(){
  if(!currentModalProduct) return;
  
  // Internal add to cart logic (copied/adapted from original addCart)
  const id = currentModalProduct.id;
  
  // Check if item with same ID AND same options exists?
  // Original logic only checked ID. Now we might have variants.
  // For simplicity, we'll just treat ID as unique for now OR create a composite ID.
  // Given the complexity of tracking variants without backend, let's just add as separate items 
  // if options differ, OR just add to cart array as new entry if needed.
  // But wait, the cart logic relies on finding by ID to increment Qty.
  // If user buys "Flamengo P" and then "Flamengo M", they should probably be separate lines.
  // But existing logic `cart.find(i=>i.id===id)` merges them.
  // I will Modify logic to just PUSH new item if options differ, or handle merge.
  // For now, to keep it simple and working: Just push to cart array (allow duplicates of ID with different options),
  // OR generate a unique ID for the cart item.
  
  // Let's generate a unique cartId.
  const cartItem = {
    cartId: Date.now() + Math.random().toString(36).substr(2, 9),
    id: currentModalProduct.id,
    name: currentModalProduct.name,
    basePrice: currentModalProduct.basePrice || currentModalProduct.price,
    img: currentModalProduct.img,
    qty: currentQty,
    type: currentModalProduct.type || 'torcedor',
    size: currentSize,
    customization: currentCustom
  };
  
  // We push directly instead of finding existing to simplify variant handling
  // But we should check if EXACT same item exists to merge qty.
  const existing = cart.find(i => 
    i.id === cartItem.id && 
    i.size === cartItem.size && 
    i.customization === cartItem.customization
  );
  
  if(existing){
    existing.qty += currentQty;
  } else {
    cart.push(cartItem);
  }

  saveCart();
  closeModal();
  openCart();
  renderCart();
}

// ... existing openCart, closeCart ...

// =========================
// Autenticação (Login/Cadastro)
// =========================
let pendingAuthNext = null;

function getUsers(){
  try{ return JSON.parse(localStorage.getItem("users")) || [] }catch(e){ return [] }
}
function saveUsers(users){
  localStorage.setItem("users", JSON.stringify(users));
}
function isAuthenticated(){
  const auth = JSON.parse(localStorage.getItem("authUser")||"null");
  if(!auth) return false;
  const users = getUsers();
  const u = users.find(x=>x.email===auth.email);
  if(!u){ localStorage.removeItem("authUser"); return false; }
  const svA = auth.sessionVersion||0;
  const svU = u.sessionVersion||0;
  if(svA !== svU){ localStorage.removeItem("authUser"); return false; }
  return true;
}
function setAuthUser(user){
  const users = getUsers();
  const u = users.find(x=>x.email===user.email) || {};
  const sessionVersion = u.sessionVersion||0;
  const merged = Object.assign({}, u, user, { sessionVersion });
  localStorage.setItem("authUser", JSON.stringify(merged));
}
function requireAuth(next){
  if(isAuthenticated()){
    if(typeof next === "function") next();
    return;
  }
  pendingAuthNext = next || null;
  openAuth("login");
}

function injectAuthModal(){
  if(document.getElementById("authModal")) return;
  if(!document.body) return;
  const style = document.createElement("style");
  style.innerHTML = `
    .auth-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:.2s;z-index:110}
    .auth-overlay.open{opacity:1;pointer-events:auto}
    .auth-card{width:90%;max-width:420px;background:#0f172a;border:1px solid var(--border);border-radius:12px;padding:20px;color:#e5e7eb}
    .auth-title{font-weight:800;font-size:1.4rem;margin-bottom:12px}
    .auth-muted{color:#94a3b8;font-size:.9rem;margin-bottom:16px}
    .auth-group{margin-bottom:12px}
    .auth-group label{display:block;margin-bottom:6px;font-weight:600}
    .auth-input{width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:#111827;color:#fff}
    .auth-actions{display:flex;gap:8px;margin-top:12px}
    .auth-btn{flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer}
    .auth-primary{background:var(--accent);color:#000}
    .auth-secondary{background:#111827;color:#e5e7eb;border:1px solid var(--border)}
    .pass-wrapper{position:relative}
    .pass-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.2rem;color:#94a3b8}
  `;
  document.head.appendChild(style);
  const wrap = document.createElement("div");
  wrap.id = "authModal";
  wrap.className = "auth-overlay";
  wrap.innerHTML = `
    <div class="auth-card">
      <div class="auth-title" id="authTitle">Entrar</div>
      <div class="auth-muted">Use seu e-mail e senha para continuar.</div>
      <div class="auth-group">
        <label>E-mail</label>
        <input id="authEmail" type="email" class="auth-input" placeholder="voce@email.com">
      </div>
      <div class="auth-group">
        <label>Senha</label>
        <div class="pass-wrapper">
          <input id="authPassword" type="password" class="auth-input" placeholder="Sua senha" style="padding-right:40px">
          <button type="button" class="pass-toggle" onclick="togglePass('authPassword', this)">👁️</button>
        </div>
      </div>
      <div class="auth-group" id="authConfirmGroup" style="display:none">
        <label>Confirmar Senha</label>
        <div class="pass-wrapper">
          <input id="authConfirmPassword" type="password" class="auth-input" placeholder="Repita a senha" style="padding-right:40px">
          <button type="button" class="pass-toggle" onclick="togglePass('authConfirmPassword', this)">👁️</button>
        </div>
      </div>
      <div id="authExtra" style="display:none">
        <div class="auth-group">
          <label>CPF</label>
          <input id="authCPF" type="text" class="auth-input" placeholder="000.000.000-00">
        </div>
        <div class="auth-group">
          <label>Login</label>
          <input id="authLogin" type="text" class="auth-input" placeholder="seu_usuario">
        </div>
      </div>
      <div id="authCodeGroup" class="auth-group" style="display:none">
        <label>Código de verificação</label>
        <input id="authCode" type="text" class="auth-input" placeholder="Digite o código">
      </div>
      <div class="auth-actions">
        <button id="authSubmit" class="auth-btn auth-primary">Continuar</button>
        <button id="authToggle" class="auth-btn auth-secondary">Criar conta</button>
        <button id="authCancel" class="auth-btn auth-secondary">Cancelar</button>
        <button id="authResend" class="auth-btn auth-secondary" style="display:none">Reenviar código</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  document.getElementById("authSubmit").onclick = handleAuthSubmit;
  document.getElementById("authToggle").onclick = toggleAuthMode;
  document.getElementById("authCancel").onclick = cancelAuth;
  document.getElementById("authResend").onclick = resendVerification;
  const cpfInput = document.getElementById("authCPF");
  if(cpfInput){
    cpfInput.addEventListener("input", ()=>{ cpfInput.value = formatCPF(cpfInput.value); });
  }
}

let authMode = "login";
function openAuth(mode="login"){
  injectAuthModal();
  authMode = mode;
  document.getElementById("authTitle").innerText = mode==="login"?"Entrar":(mode==="register"?"Criar conta":"Verificação de e-mail");
  document.getElementById("authToggle").innerText = mode==="login"?"Criar conta":(mode==="register"?"Já tenho conta":"Usar outro e-mail");
  document.getElementById("authSubmit").innerText = mode==="verify"?"Verificar":"Continuar";
  document.getElementById("authEmail").value = "";
  document.getElementById("authEmail").removeAttribute("readonly");
  document.getElementById("authPassword").value = "";
  document.getElementById("authPassword").parentElement.parentElement.style.display = mode==="verify"?"none":"block";
  document.getElementById("authEmail").parentElement.style.display = mode==="verify"?"none":"block";
  document.getElementById("authConfirmGroup").style.display = mode==="register"?"block":"none";
  document.getElementById("authConfirmPassword").value = "";
  const cg = document.getElementById("authCodeGroup");
  cg.style.display = mode==="verify"?"block":"none";
  document.getElementById("authResend").style.display = mode==="verify"?"block":"none";
  document.getElementById("authExtra").style.display = mode==="register"?"block":"none";
  document.getElementById("authModal").classList.add("open");
}
function closeAuth(){
  const m = document.getElementById("authModal");
  if(m) m.classList.remove("open");
}
function cancelAuth(){
  pendingAuthNext = null;
  closeAuth();
}
function toggleAuthMode(){
  openAuth(authMode==="login"?"register":"login");
}
function handleAuthSubmit(){
  let email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const users = getUsers();
  if(authMode==="verify"){
    const code = document.getElementById("authCode").value.trim();
    const pending = JSON.parse(localStorage.getItem("pendingVerify")||"null");
    
    // Se não tiver pending, não tem como verificar
    if(!pending){ alert("Solicite o código novamente."); return; }
    
    // Usamos o email do pending, já que o input pode estar vazio/escondido
    email = pending.email;

    if(!code || code!==pending.code){ alert("Código inválido."); return; }
    if(users.find(x=>x.email===email)){ alert("E-mail já cadastrado."); return; }
    users.push({ 
      email, 
      password: pending.password,
      cpf: pending.cpf,
      login: pending.login,
      sessionVersion: 0
    });
    saveUsers(users);
    postUserToDB({ email, login: pending.login || email, cpf: pending.cpf, password: pending.password });
    setAuthUser({ email, cpf: pending.cpf, login: pending.login });
    localStorage.removeItem("pendingVerify");
    closeAuth();
    if(typeof pendingAuthNext === "function"){ const fn = pendingAuthNext; pendingAuthNext=null; fn(); }
    return;
  }
  if(authMode==="login"){
    if(!email || !password){ alert("Preencha e-mail e senha."); return; }
    const u = users.find(x=>x.email===email);
    if(!u || u.password!==password){ alert("E-mail ou senha inválidos."); return; }
    setAuthUser({ email });
  }else{
    if(!email || !password){ alert("Preencha e-mail e senha."); return; }
    const confirm = document.getElementById("authConfirmPassword").value;
    if(password !== confirm){ alert("As senhas não coincidem."); return; }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if(!emailOk){ alert("Use um e-mail válido."); return; }
    if(users.find(x=>x.email===email)){ alert("E-mail já cadastrado."); return; }
    const cpf = document.getElementById("authCPF").value.trim();
    if(!cpf){ alert("Informe seu CPF."); return; }
    if(!validateCPF(cpf)){ alert("CPF inválido."); return; }
    const login = document.getElementById("authLogin").value.trim();
    if(!login || login.length<3){ alert("Informe um login válido (mín. 3 caracteres)."); return; }
    const code = generateCode();
    localStorage.setItem("pendingVerify", JSON.stringify({ email, password, code, cpf, login }));
    sendVerificationCode(email, code);
    document.getElementById("authEmail").value = email;
    document.getElementById("authEmail").setAttribute("readonly","readonly");
    openAuth("verify");
    return;
  }
  closeAuth();
  if(typeof pendingAuthNext === "function"){ const fn = pendingAuthNext; pendingAuthNext=null; fn(); }
}
function togglePass(id, btn){
  const inp = document.getElementById(id);
  if(inp.type==="password"){
    inp.type="text";
    btn.innerText="🔒"; // Icone de "esconder" (pode ser outro)
  }else{
    inp.type="password";
    btn.innerText="👁️";
  }
}
function generateCode(){
  return String(Math.floor(100000 + Math.random()*900000));
}
async function sendVerificationCode(email, code){
  // Exibir código via Toast para garantir que o usuário veja (Simulação/Fallback)
  showToast("Código de verificação: " + code, 10000);
  
  try{
    // Tenta enviar para o backend (server.py)
    const res = await fetch("/send_code.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json().catch(()=>({ok:false}));
    if(data && data.ok){
      console.log("Código enviado para o backend simulado.");
    }
  }catch(e){
    console.log("Backend offline ou erro de rede. Código segue válido.");
  }
}

function showToast(msg, duration=5000){
  let toast = document.getElementById("app-toast");
  if(!toast){
    toast = document.createElement("div");
    toast.id = "app-toast";
    Object.assign(toast.style, {
      position: "fixed", top: "20px", right: "20px",
      background: "#22c55e", color: "#fff", padding: "16px 24px",
      borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: "9999", fontSize: "1.1rem", fontWeight: "bold",
      transform: "translateY(-100px)", transition: "transform 0.3s ease-in-out"
    });
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  requestAnimationFrame(()=>{
    toast.style.transform = "translateY(0)";
  });
  setTimeout(()=>{
    toast.style.transform = "translateY(-100px)";
  }, duration);
}
function resendVerification(){
  const pending = JSON.parse(localStorage.getItem("pendingVerify")||"null");
  const email = document.getElementById("authEmail").value.trim();
  if(!pending || pending.email!==email){ alert("Solicite novamente o cadastro."); return; }
  const code = generateCode();
  localStorage.setItem("pendingVerify", JSON.stringify({ email, password: pending.password, code, cpf: pending.cpf, login: pending.login }));
  sendVerificationCode(email, code);
}

function formatCPF(v){
  const s = String(v||"").replace(/\D/g,"").slice(0,11);
  const p1 = s.slice(0,3);
  const p2 = s.slice(3,6);
  const p3 = s.slice(6,9);
  const p4 = s.slice(9,11);
  let out = "";
  if(p1) out += p1;
  if(p2) out += "."+p2;
  if(p3) out += "."+p3;
  if(p4) out += "-"+p4;
  return out;
}

function validateCPF(cpf){
  const s = String(cpf||"").replace(/\D/g,"");
  if(s.length!==11) return false;
  if(/^(\d)\1+$/.test(s)) return false;
  let sum=0;
  for(let i=0;i<9;i++) sum += parseInt(s[i])*(10-i);
  let rest = sum%11;
  let d1 = rest<2?0:11-rest;
  if(parseInt(s[9])!==d1) return false;
  sum=0;
  for(let i=0;i<10;i++) sum += parseInt(s[i])*(11-i);
  rest = sum%11;
  let d2 = rest<2?0:11-rest;
  return parseInt(s[10])===d2;
}

async function hashPassword(password){
  try{
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b=>b.toString(16).padStart(2,"0")).join("");
  }catch(e){
    return password;
  }
}

async function postUserToDB({email, login, cpf, password}){
  const password_hash = await hashPassword(password);
  try{
    await fetch("/save_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, login: login||email, cpf, password_hash })
    });
  }catch(e){}
}
