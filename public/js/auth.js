// Authentication Module
let currentUser = null;
let isAdminAuthenticated = false;

async function initializeIdentity() {
  setAuthStatus('Checking account session...');
  if (!window.netlifyIdentity) {
    renderAuthState();
    setAuthStatus('Customer sign in is not ready. Reload the page and try again.');
    return;
  }

  netlifyIdentity.on('init', function(user) {
    currentUser = user;
    renderAuthState();
    setAuthStatus(user ? 'Signed in.' : 'Sign in or create an account to track your session.');
  });

  netlifyIdentity.on('login', function(user) {
    console.log("Logged in:", user);
    currentUser = user;
    netlifyIdentity.close();
    renderAuthState();
    setAuthStatus('Signed in successfully.');
    window.location.href = "/dashboard.html";
  });

  netlifyIdentity.on('logout', function() {
    currentUser = null;
    isAdminAuthenticated = false;
    renderAuthState();
    setAuthStatus('Signed out.');
  });

  netlifyIdentity.on('error', function(error) {
    setAuthStatus(error?.message || 'Identity is not ready for this site yet.');
  });

  netlifyIdentity.init();
}

function handleLogin() {
  if (!window.netlifyIdentity) {
    setAuthStatus('Customer sign in is not ready. Reload the page and try again.');
    return;
  }
  netlifyIdentity.open('login');
}

function handleSignup() {
  if (!window.netlifyIdentity) {
    setAuthStatus('Customer sign in is not ready. Reload the page and try again.');
    return;
  }
  netlifyIdentity.open('signup');
}

function handleAnonymous() {
  setAuthStatus('Browsing anonymously. You can use the community wall and view content.');
}

function handleLogout() {
  if (!window.netlifyIdentity) {
    setAuthStatus('Customer sign in is not ready. Reload the page and try again.');
    return;
  }
  setAuthLoading(true);
  netlifyIdentity.logout();
  setAuthLoading(false);
}

function renderAuthState() {
  const signedIn = Boolean(currentUser);
  const authControls = document.getElementById('authControls');
  const sessionControls = document.getElementById('sessionControls');
  
  if (authControls) authControls.style.display = signedIn ? 'none' : 'grid';
  if (sessionControls) sessionControls.style.display = signedIn ? 'grid' : 'none';
  
  const signedInLabel = document.getElementById('signedInLabel');
  if (signedInLabel) signedInLabel.innerText = signedIn ? 'Signed In' : 'Customer Sign In';
  
  const sessionSummary = document.getElementById('sessionSummary');
  if (sessionSummary) sessionSummary.innerText = signedIn ? `Signed in as ${currentUser.email}` : '';
  
  updateAdminUI();
}

function setAuthStatus(message) {
  const authStatus = document.getElementById('authStatus');
  if (authStatus) authStatus.innerText = message;
}

function setAuthLoading(isLoading) {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginBtn) loginBtn.disabled = isLoading;
  if (signupBtn) signupBtn.disabled = isLoading;
  if (logoutBtn) logoutBtn.disabled = isLoading;
}

async function verifyAdminStatus() {
  if (!currentUser) return false;
  
  try {
    const response = await fetch('/.netlify/functions/verify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token.access_token}`
      },
      body: JSON.stringify({ email: currentUser.email })
    });
    
    const data = await response.json();
    isAdminAuthenticated = data.isAdmin === true;
    updateAdminUI();
    return isAdminAuthenticated;
  } catch (error) {
    console.error('Admin verification failed:', error);
    isAdminAuthenticated = false;
    return false;
  }
}

function updateAdminUI() {
  const broadcastUploadBtn = document.getElementById('broadcastUploadBtn');
  const composerLabel = document.getElementById('composerLabel');
  
  if (broadcastUploadBtn) {
    broadcastUploadBtn.style.display = isAdminAuthenticated ? 'block' : 'none';
  }
  
  if (composerLabel) {
    if (isAdminAuthenticated) {
      composerLabel.innerText = 'BITTY POWER CONSOLE: PUBLISHING AS OWNER';
      composerLabel.style.color = 'var(--pink-jewel)';
    } else {
      composerLabel.innerText = 'ADD TO THE COMMUNITY FEED:';
      composerLabel.style.color = 'var(--teal-jewel)';
    }
  }
}

function wireAuthControls() {
  const loginBtn = document.getElementById('loginBtn');
  const anonymousBtn = document.getElementById('anonymousBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);
  if (anonymousBtn) anonymousBtn.addEventListener('click', handleAnonymous);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', function() {
      window.location.href = '/dashboard.html';
    });
  }
}

// Export for use
window.auth = {
  initializeIdentity,
  handleLogin,
  handleLogout,
  wireAuthControls,
  verifyAdminStatus,
  getCurrentUser: () => currentUser,
  isAdmin: () => isAdminAuthenticated
};
