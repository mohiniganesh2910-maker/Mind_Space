'use strict';
(() => {
  const nav = document.getElementById('navigation');
  const actions = nav?.querySelector('.nav-auth-actions');
  const client = window.MindSpaceAuthClient;
  if (!actions || !client) return;

  function renderAuthActions(user) {
    actions.replaceChildren();
    const username = user?.user_metadata?.username || user?.email?.split('@')[0];
    const links = user
      ? [{ href: 'profile.html', label: username || 'Account', ariaLabel: `Profile: ${username || 'Account'}` }]
      : [
          { href: 'signup.html', label: 'Sign up' },
          { href: 'login.html', label: 'Log in' }
        ];

    links.forEach(({ href, label, ariaLabel }) => {
      const link = document.createElement('a');
      link.href = href;
      link.className = 'nav-auth-button';
      link.textContent = label;
      if (ariaLabel) link.setAttribute('aria-label', ariaLabel);
      if (href === (window.location.pathname.split('/').pop() || 'index.html')) {
        link.setAttribute('aria-current', 'page');
      }
      actions.append(link);
    });
  }

  client.auth.onAuthStateChange((_event, session) => {
    renderAuthActions(session?.user || null);
  });

  client.auth.getSession()
    .then(({ data, error }) => {
      if (error) throw error;
      renderAuthActions(data.session?.user || null);
    })
    .catch(error => {
      console.error('Could not read the MindSpace authentication session.', error);
    });
})();
