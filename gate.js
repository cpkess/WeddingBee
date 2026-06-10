// =====================================================================
// Access gate — hides the entire page until the visitor is signed in
// AND admin-approved. Pairs with the CSS in styles.css
// (html:not(.gate-ok) hides everything except #gateOverlay).
// =====================================================================
import './auth.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function waitFor(check, timeout, interval) {
  timeout = timeout || 5000; interval = interval || 50;
  return new Promise((resolve) => {
    const start = Date.now();
    (function poll() {
      const v = check();
      if (v) return resolve(v);
      if (Date.now() - start >= timeout) return resolve(null);
      setTimeout(poll, interval);
    })();
  });
}

function userLabel(user) {
  const meta = (user && user.user_metadata) || {};
  return meta.full_name || meta.name || (user && user.email) || 'your account';
}

function render(state, user) {
  const overlay = document.getElementById('gateOverlay');
  if (!overlay) return;

  if (state === 'ok') {
    document.documentElement.classList.add('gate-ok');
    overlay.innerHTML = '';
    return;
  }

  document.documentElement.classList.remove('gate-ok');

  if (state === 'signed-out') {
    overlay.innerHTML = `
      <div class="gate-card">
        <div class="kicker">Family only</div>
        <h1>Sign in to continue</h1>
        <p>This site is shared just with our family — sign in with Google to take a look.</p>
        <button class="auth-btn auth-btn-fill" data-gate="signin">Sign in with Google</button>
      </div>`;
    const btn = overlay.querySelector('[data-gate="signin"]');
    if (btn) btn.addEventListener('click', () => window.WedAuth.signIn());
    return;
  }

  // pending
  overlay.innerHTML = `
    <div class="gate-card">
      <div class="kicker">Almost there</div>
      <h1>Waiting for approval</h1>
      <p>You're signed in as <strong>${esc(userLabel(user))}</strong>. An admin needs to approve your account before you can see the site — check back soon!</p>
      <button class="auth-btn" data-gate="signout">Sign out</button>
    </div>`;
  const btn = overlay.querySelector('[data-gate="signout"]');
  if (btn) btn.addEventListener('click', () => window.WedAuth.signOut());
}

(async () => {
  const auth = await waitFor(() => window.WedAuth);
  if (!auth) return;

  auth.onChange(async (user) => {
    if (!user) { render('signed-out', user); return; }
    const approved = await auth.isApproved();
    render(approved ? 'ok' : 'pending', user);
    if (approved) {
      const admin = await auth.isAdmin();
      document.querySelectorAll('.nav-admin').forEach((a) => { a.style.display = admin ? '' : 'none'; });
    }
  });
})();
