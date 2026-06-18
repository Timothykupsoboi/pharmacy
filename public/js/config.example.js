// Supabase config example. Copy this file to `js/config.js` and fill values.
// WARNING: Placing secrets in client-side code is not secure for production.
// For production, use a server-side endpoint or Row Level Security (RLS) policies.

window.SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'public-anon-key'
};

// Alternatively you can set global values:
// window.SUPABASE_URL = 'https://your-project.supabase.co';
// window.SUPABASE_ANON_KEY = 'public-anon-key';

/* Usage:
   Include `js/config.js` before `js/supabase.js` in your HTML, or call:
   await Supa.init(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
*/
