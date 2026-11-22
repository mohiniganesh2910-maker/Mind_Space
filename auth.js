'use strict';
(() => {
  const form = document.getElementById('auth-form');
  const status = document.getElementById('auth-status');
  const submit = document.getElementById('auth-submit');
  const usernameInput = document.getElementById('auth-username');
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const mode = form?.dataset.mode;
  const client = window.MindSpaceAuthClient;
  if (!form || !status || !submit || !emailInput || !passwordInput || (mode === 'signup' && !usernameInput)) return;

  if (!client) {
    status.textContent = 'Authentication is unavailable. Check your internet connection and reload this page.';
    submit.disabled = true;
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    status.textContent = mode === 'signup' ? 'Creating your account…' : 'Logging in…';
    const username = usernameInput?.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: new URL('login.html', window.location.href).href,
            data: { username }
          }
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign('profile.html');
          return;
        }
        status.textContent = 'Account created. Check your email to confirm it, then log in.';
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign('profile.html');
        return;
      }
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
})();
