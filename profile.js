'use strict';
(() => {
  const username = document.getElementById('profile-username');
  const email = document.getElementById('profile-email');
  const status = document.getElementById('profile-status');
  const logout = document.getElementById('profile-logout');
  const client = window.MindSpaceAuthClient;
  if (!username || !email || !status || !logout) return;

  if (!client) {
    status.textContent = 'Authentication is unavailable. Check your internet connection and reload this page.';
    logout.disabled = true;
    return;
  }

  async function loadProfile() {
    status.textContent = 'Loading your profile…';
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (error) throw error;
      if (!user) {
        window.location.replace('login.html');
        return;
      }
      username.textContent = user.user_metadata?.username || 'Not set';
      email.textContent = user.email || 'Not available';
      status.textContent = '';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not load your profile. Please try again.';
    }
  }

  logout.addEventListener('click', async () => {
    logout.disabled = true;
    status.textContent = 'Logging out…';
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      window.location.assign('index.html');
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Could not log out. Please try again.';
      logout.disabled = false;
    }
  });

  loadProfile();
})();
