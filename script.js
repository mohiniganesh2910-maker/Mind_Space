'use strict';
const menu = document.getElementById('menu-toggle');
const nav = document.getElementById('navigation');

function closeMenu({ restoreFocus = false } = {}) {
  if (!menu || !nav) return;
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menu.focus();
}

function setActiveNavigation() {
  if (!nav) return;
  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  let activeLink = null;
  nav.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return;
    const target = href.split(/[?#]/, 1)[0].split('/').pop().toLowerCase();
    const isCurrent = target === currentFile || (!target && currentFile === 'index.html');
    if (isCurrent) activeLink = link;
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  nav.querySelectorAll('details.nav-group').forEach(group => {
    const summary = group.querySelector('summary');
    const syncExpanded = () => summary?.setAttribute('aria-expanded', String(group.open));
    const containsCurrent = Boolean(group.querySelector('a[aria-current="page"]'));
    group.classList.toggle('has-current', containsCurrent);
    if (containsCurrent) summary?.setAttribute('aria-current', 'page');
    else summary?.removeAttribute('aria-current');
    syncExpanded();
    // Keep native <details> as the single source of truth for disclosure state.
    group.addEventListener('toggle', () => {
      syncExpanded();
      if (group.open) {
        nav.querySelectorAll('details.nav-group[open]').forEach(other => {
          if (other === group) return;
          other.open = false;
          other.querySelector('summary')?.setAttribute('aria-expanded', 'false');
        });
      }
    });
  });
  // Keep the active link available for assistive technology; active styling is CSS-driven.
  if (activeLink) activeLink.dataset.routeActive = 'true';
}

if (menu && nav) {
  menu.addEventListener('click', () => {
    const shouldOpen = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(shouldOpen));
    nav.classList.toggle('open', shouldOpen);
  });

  nav.addEventListener('click', event => {
    // Let the browser follow the actual href. Re-intercepting navigation here
    // caused dropdown links to fail in some file:// and static-hosting setups.
    // The real destinations in the HTML are the single source of truth.
    const link = event.target.closest('a[href]');
    if (!link) return;
    closeMenu();
    // Do not preventDefault(), rewrite the URL, or call location.assign().
    // Native anchors preserve file://, nested static hosting, browser history,
    // open-in-new-tab, keyboard activation, and modified-click behavior.
  });

  // Close open disclosure menus when focus/click moves outside the navigation.
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) {
      nav.querySelectorAll('details.nav-group[open]').forEach(group => { group.open = false; });
      closeMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openGroups = [...nav.querySelectorAll('details.nav-group[open]')];
    openGroups.forEach(group => { group.open = false; });
    if (menu.getAttribute('aria-expanded') === 'true') closeMenu({ restoreFocus: true });
    else if (openGroups.length) openGroups[openGroups.length - 1].querySelector('summary')?.focus();
  });

  const mobileQuery = matchMedia('(max-width:800px)');
  const resetNavForViewport = () => {
    closeMenu();
    nav.querySelectorAll('details.nav-group[open]').forEach(group => { group.open = false; });
  };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', resetNavForViewport);
  else mobileQuery.addListener(resetNavForViewport);
}
if (nav) {
  const authActions = document.createElement('div');
  authActions.className = 'nav-auth-actions';
  [
    { href: 'signup.html', label: 'Sign up' },
    { href: 'login.html', label: 'Log in' }
  ].forEach(({ href, label }) => {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'nav-auth-button';
    link.textContent = label;
    authActions.append(link);
  });
  nav.append(authActions);
}
setActiveNavigation();

// Shared decorative layer: SVG leaves are purely visual and never intercept input.
if (!document.querySelector('.nature-backdrop')) {
  const backdrop = document.createElement('div');
  backdrop.className = 'nature-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = '<div class="nature-orb nature-orb--sage"></div><div class="nature-orb nature-orb--aqua"></div><div class="nature-orb nature-orb--mint"></div><div class="nature-leaves">' +
    Array.from({ length: 8 }, (_, index) => `<span class="nature-leaf nature-leaf--${index + 1}"><svg viewBox="0 0 64 64" focusable="false" aria-hidden="true"><path d="M52 8C28 8 11 18 10 37c-1 11 7 18 17 16C45 49 52 29 52 8Z" fill="currentColor"/><path d="M13 52C24 39 33 29 47 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M28 36l-1-12M36 28l10 1M21 44l-8-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></svg></span>`).join('') +
    '</div>';
  document.body.prepend(backdrop);
}
window.applyPreferences=()=>{const p=MS.read()?.preferences||MS.empty().preferences;document.documentElement.dataset.theme=p.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p.theme;document.documentElement.dataset.motion=p.motion==='system'?(matchMedia('(prefers-reduced-motion: reduce)').matches?'reduce':'full'):p.motion;};
applyPreferences();
['(prefers-color-scheme: dark)','(prefers-reduced-motion: reduce)'].forEach(q=>{
  const media = matchMedia(q);
  if (media.addEventListener) media.addEventListener('change', applyPreferences);
  else if (media.addListener) media.addListener(applyPreferences);
});
window.exportMindSpace=()=>{try{const payload=MS.backup();const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=MS.node('a');a.href=url;a.download='mindspace-backup-'+MS.localDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);const status=document.getElementById('data-status');if(status)status.textContent='Backup download requested. Keep it somewhere private.';}catch{MS.warning('Could not access browser storage to export a backup.');}};
const exportButton = document.getElementById('export-data');
if (exportButton) exportButton.addEventListener('click', exportMindSpace);
const clearButton = document.getElementById('clear-data');
if (clearButton) clearButton.addEventListener('click',()=>{if(confirm('Delete all MindSpace data, preferences, and drafts from this browser? Export a backup first to keep them.')&&MS.clear())location.reload();});
window.addEventListener('storage',e=>{if(e.key===MS.KEY){applyPreferences();MS.warning('Data changed in another tab. Reload before editing to see the latest records.');}});
