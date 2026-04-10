import { supabase } from './supabase.js';

export async function initAuth() {
  const loginModal = document.getElementById('login-modal');
  const btnGoogleLogin = document.getElementById('btn-google-login');
  const btnLogout = document.getElementById('btn-logout');

  // Check current session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Show login modal if not logged in
    loginModal.style.display = 'flex';
  } else {
    loginModal.style.display = 'none';
    document.dispatchEvent(new CustomEvent('userAuthenticated', { detail: session.user }));
  }

  // Setup Auth Listener
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      loginModal.style.display = 'none';
      document.dispatchEvent(new CustomEvent('userAuthenticated', { detail: session.user }));
    } else {
      loginModal.style.display = 'flex';
    }
  });

  // Attach login event (Google OAuth)
  btnGoogleLogin?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in:', error.message);
  });

  // Attach logout event
  btnLogout?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
    else window.location.reload();
  });
}
