'use strict';
(() => {
  const projectUrl = 'https://uxejumcaeafxtooxrthp.supabase.co';
  const publishableKey = 'sb_publishable_b2X9wpwFISCtLfYhiTHmHw_Unm2bnVk';
  const client = window.supabase?.createClient(projectUrl, publishableKey) || null;
  window.MindSpaceAuthClient = client;
})();
