
// Ouvir evento de produtos carregados
function ensureAdminLink(){
  const u = JSON.parse(localStorage.getItem('authUser')||'null');
  const isAdmin = !!(u && (u.is_admin===1 || u.is_admin==='1' || u.is_admin===true));
  if(!isAdmin) return;
  const header = document.querySelector('.right-icons');
  if(!header) return;
  if(header.querySelector('[data-admin-link="1"]')) return;
  const link = document.createElement('a');
  link.href = 'admin_panel.html';
  link.innerHTML = '⚙️ Painel';
  link.className = 'icon-btn';
  link.style.width = 'auto';
  link.style.padding = '0 12px';
  link.style.textDecoration = 'none';
  link.style.fontSize = '0.9rem';
  link.style.fontWeight = '600';
  link.title = "Painel Administrativo";
  link.setAttribute('data-admin-link','1');
  header.prepend(link);
}

document.addEventListener("productsLoaded", () => {
  renderFeatured();
  renderTopicGrid("featuredGrid", "featured"); // Featured logic needs adjustment in renderTopicGrid? No, renderFeatured handles it.
  // Actually renderFeatured is separate.
  renderTopicGrid("gridBr", "br");
  renderTopicGrid("gridEu", "eu");
  renderTopicGrid("gridSel", "sel");
  renderTopicGrid("gridFem", "fem");
  renderTopicGrid("gridKids", "kids");
  ensureAdminLink();
});

document.addEventListener("DOMContentLoaded", ensureAdminLink);
document.addEventListener("authChanged", ensureAdminLink);
