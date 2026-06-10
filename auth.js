// =====================================================================
// Family auth — Google sign-in via Supabase, shared across all pages.
// Renders into any element with class="auth-area" and exposes
// window.WedAuth for app.js / data-store.js to read session state.
// =====================================================================
import { supabase } from './supabase-config.js';

let currentUser = null;
let ready = false;
const listeners = new Set();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function notify() {
  listeners.forEach((fn) => { try { fn(currentUser); } catch (e) {} });
}

function userLabel(user) {
  const meta = user && user.user_metadata || {};
  return meta.full_name || meta.name || (user && user.email) || 'Account';
}

function renderNav() {
  document.querySelectorAll('.auth-area').forEach((area) => {
    if (currentUser) {
      const name = userLabel(currentUser);
      const avatar = currentUser.user_metadata && currentUser.user_metadata.avatar_url;
      area.innerHTML =
        '<span class="auth-chip">' +
          (avatar ? `<img class="auth-avatar" src="${esc(avatar)}" alt="">` : '') +
          `<span class="auth-name">${esc(name)}</span>` +
        '</span>' +
        '<button class="auth-btn" data-auth="signout">Sign out</button>';
    } else {
      area.innerHTML = '<button class="auth-btn auth-btn-fill" data-auth="signin">Sign in with Google</button>';
    }
  });
  document.querySelectorAll('[data-auth="signin"]').forEach((b) => b.addEventListener('click', signIn));
  document.querySelectorAll('[data-auth="signout"]').forEach((b) => b.addEventListener('click', signOut));
}

async function signIn() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.href.split('#')[0] },
  });
}

async function signOut() {
  await supabase.auth.signOut();
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = (session && session.user) || null;
  ready = true;
  renderNav();
  notify();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = (session && session.user) || null;
    renderNav();
    notify();
  });
}

window.WedAuth = {
  getUser: () => currentUser,
  isSignedIn: () => !!currentUser,
  isReady: () => ready,
  // Fires immediately if a session has already been resolved, then again
  // on every sign-in/out.
  onChange: (fn) => {
    listeners.add(fn);
    if (ready) fn(currentUser);
    return () => listeners.delete(fn);
  },
  signIn,
  signOut,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNav);
} else {
  renderNav();
}
init();
