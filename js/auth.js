/**
 * CENTRALIZED AUTHENTICATION MODULE
 * Handles all Supabase Auth interactions, session management, and role-based routing.
 * Dependencies: window.supabaseClient (from supabaseClient.js)
 */

/**
 * Polls for Supabase client initialization with a timeout
 * @returns {Promise<void>}
 */
async function waitForSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabaseClient) return resolve();
    
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds (50ms * 100)
    
    const interval = setInterval(() => {
      attempts++;
      if (window.supabaseClient) {
        clearInterval(interval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error("Supabase initialization timeout. Check your network or configuration."));
      }
    }, 50);
  });
}

/**
 * Gets the currently authenticated user from the session
 * @returns {Promise<Object|null>} Supabase User object or null
 */
async function getCurrentUser() {
  try {
    await waitForSupabase();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return user;
  } catch (err) {
    console.error("Auth: Error getting current user", err);
    return null;
  }
}

/**
 * Determines the role of the user (admin or recruit)
 * @param {Object} user - Supabase User object
 * @returns {string} 'admin' or 'recruit'
 */
function getUserRole(user) {
  if (!user) return null;
  const adminEmails = [
    'admin@nexus.com',
    'abelkebebew99@gmail.com',
    'eliyanranebiyu@gmail.com'
  ];
  return adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'recruit';
}

/**
 * Signs up a new recruit. Does NOT automatically sign them in (requires email verification)
 * @param {string} email 
 * @param {string} password 
 * @param {Object} metadata - Contains callsign, identifier, commlink, division, background
 * @returns {Promise<Object>} Supabase Auth response data
 */
async function signUp(email, password, metadata) {
  await waitForSupabase();
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: metadata // { callsign, identifier, commlink, division, background }
    }
  });
  
  if (error) throw error;
  return data;
}

/**
 * Verifies the OTP sent to the user's email
 * @param {string} email 
 * @param {string} token 
 * @returns {Promise<Object>} Supabase Auth response data
 */
async function verifyOtp(email, token) {
  await waitForSupabase();
  const { data, error } = await supabaseClient.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  });
  
  if (error) throw error;
  return data;
}

/**
 * Resends the OTP verification code
 * @param {string} email 
 * @returns {Promise<Object>}
 */
async function resendOtp(email) {
  await waitForSupabase();
  const { data, error } = await supabaseClient.auth.resend({
    type: 'signup',
    email
  });
  
  if (error) throw error;
  return data;
}

/**
 * Creates the public enlistment record for a new signup
 * @param {Object} user - Supabase User object (from signUp response)
 * @param {FormData} formData - Registration form data
 */
async function createEnlistmentRecord(user, formData) {
  await waitForSupabase();
  const application = {
    user_id: user.id,
    callsign: formData.get('callsign'),
    identifier: formData.get('identifier'),
    commlink: formData.get('commlink'),
    division: formData.get('division'),
    background: formData.get('background'),
    status: 'pending',
    level: 1,
    xp: 0
  };

  const { error } = await supabaseClient
    .from('enlistments')
    .insert([application]);
    
  if (error) throw error;
}

/**
 * Signs in a user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Supabase User object
 */
async function signIn(email, password) {
  await waitForSupabase();
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data.user;
}

/**
 * Signs out the current user and redirects to home
 */
async function signOut() {
  try {
    await waitForSupabase();
    await supabaseClient.auth.signOut();
  } catch (err) {
    console.error("Auth: Error signing out", err);
  } finally {
    window.location.href = 'index.html';
  }
}

/**
 * Initiates the password reset flow
 * @param {string} email 
 */
async function resetPassword(email) {
  await waitForSupabase();
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password.html',
  });
  
  if (error) throw error;
}

/**
 * Routes a user to their appropriate dashboard based on role
 * @param {Object} user - Supabase User object
 */
function redirectByRole(user) {
  const role = getUserRole(user);
  if (role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'recruit-dashboard.html';
  }
}

/**
 * Route Guard: Ensures user is authenticated and has required role
 * @param {Array<string>} [allowedRoles] - Optional array of allowed roles (e.g. ['admin', 'recruit'])
 * @returns {Promise<Object>} The authenticated user object
 */
async function requireAuth(allowedRoles, autoRedirect = true) {
  const user = await getCurrentUser();
  
  if (!user) {
    // Not logged in -> redirect to login if autoRedirect is true
    if (autoRedirect) window.location.href = 'login.html';
    return null; 
  }
  
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = getUserRole(user);
    if (!allowedRoles.includes(userRole)) {
      // Logged in but wrong role -> redirect to their default dashboard if autoRedirect is true
      if (autoRedirect) redirectByRole(user);
      return null;
    }
  }
  
  return user;
}

/**
 * Route Guard: Ensures user is NOT authenticated (used for login/signup pages)
 * @returns {Promise<void>}
 */
async function requireGuest() {
  const user = await getCurrentUser();
  
  if (user) {
    // Already logged in -> redirect to appropriate dashboard
    redirectByRole(user);
  }
}
