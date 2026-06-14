/**
 * SUPABASE CLIENT CONFIGURATION
 * Loads credentials from env.js (meta tags or window.__ENV__).
 * NEVER hardcode credentials in this file.
 */

if (typeof supabase === 'undefined') {
  throw new Error('Supabase JS SDK not loaded. Include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

// Ensure Supabase configuration is loaded before client creation
(async () => {
  // Wait for Supabase env vars to be populated
  await new Promise(resolve => {
    if (window.__ENV?.SUPABASE_URL && window.__ENV?.SUPABASE_ANON_KEY) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window.__ENV?.SUPABASE_URL && window.__ENV?.SUPABASE_ANON_KEY) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    }
  });

  const SUPABASE_URL = window.__ENV.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.__ENV.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase configuration missing after waiting.');
    return;
  }
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Expose globally
  window.supabaseClient = client;
})();


/**
 * SECURITY: HTML escaping to prevent XSS.
 * Use everywhere user-controlled or database values are rendered.
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return str.replace(/[&<>"'`=\/]/g, function (c) { return map[c]; });
}

/**
 * PUBLIC DATA FETCHING
 * These are intentionally public — RLS allows anon SELECT.
 */

async function getResearchPapers() {
  const { data, error } = await supabaseClient
    .from('papers')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) return [];
  return data;
}

async function getBlogPosts() {
  const { data, error } = await supabaseClient
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

async function getEvents() {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error) return [];
  return data;
}

/**
 * AUTHENTICATION & ENLISTMENT
 * All auth operations use Supabase Auth; NEVER trust client-side role checks alone.
 */

async function submitEnlistment(formData) {
  const email = formData.get('commlink');
  const password = formData.get('password');
  const callsign = formData.get('callsign');
  const identifier = formData.get('identifier');

  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { callsign, identifier }
    }
  });
  if (authError) throw authError;

  const application = {
    callsign: callsign,
    identifier: identifier,
    commlink: email,
    division: formData.get('division'),
    background: formData.get('background'),
    user_id: authData.user.id,
    status: 'pending'
  };

  const { error: dbError } = await supabaseClient
    .from('enlistments')
    .insert([application]);
  if (dbError) throw dbError;
  return true;
}

async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function loginAdmin(email, password) {
  return loginUser(email, password);
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch (err) {
    return null;
  }
}

/**
 * GAMIFICATION & PROGRESS
 */

async function updateXP(userId, points) {
  // Step 1: Try to find profile by user_id
  let { data: profile } = await supabaseClient.from('enlistments').select('id, xp, level, callsign, user_id, commlink').eq('user_id', userId).single();
  
  // Step 2: If not found, the enlistment row might have user_id=null or an old user_id.
  //         Try to find by email using auth_users_view
  if (!profile) {
    try {
      const { data: authData } = await supabaseClient.from('auth_users_view').select('email').eq('id', userId).single();
      if (authData && authData.email) {
        const { data: emailProfile } = await supabaseClient.from('enlistments').select('id, xp, level, callsign, user_id, commlink').eq('commlink', authData.email).single();
        if (emailProfile) {
          // Patch the wrong user_id so future lookups work
          await supabaseClient.from('enlistments').update({ user_id: userId }).eq('id', emailProfile.id);
          profile = emailProfile;
        }
      }
    } catch (_authErr) {}
  }

  // Step 3: Still not found? Fallback to unlinked profiles
  if (!profile) {
    try {
      const { data: unlinked } = await supabaseClient.from('enlistments').select('id, xp, level, callsign, user_id, commlink').is('user_id', null);
      if (unlinked && unlinked.length > 0) {
        profile = unlinked[0];
        await supabaseClient.from('enlistments').update({ user_id: userId }).eq('id', profile.id);
      }
    } catch (_e) {}
  }

  if (!profile) {
    throw new Error("Could not find or link an enlistment profile for this user.");
  }

  let currentXP = profile.xp || 0;
  let currentLevel = profile.level || 1;
  let newXP = currentXP + points;
  let newLevel = currentLevel;

  const targetLevel = Math.floor(newXP / 100) + 1;

  if (targetLevel > currentLevel) {
    newLevel = targetLevel;
    await createNotification(
      userId,
      'PROMOTION',
      `Congratulations Commander ${escapeHTML(profile.callsign)}! You have been promoted to Level ${newLevel}.`,
      'recruit-dashboard.html'
    );
  }

  const { error: updateError } = await supabaseClient.from('enlistments').update({ xp: newXP, level: newLevel }).eq('id', profile.id);
  if (updateError) throw updateError;
  
  return { newXP, newLevel, promoted: targetLevel > currentLevel };
}

async function updateAvatar(userId, avatarUrl) {
  const safeUrl = typeof avatarUrl === 'string' ? avatarUrl.substring(0, 2000) : avatarUrl;
  const { error: authError } = await supabaseClient.auth.updateUser({
    data: { avatar_url: safeUrl }
  });
  if (authError) throw authError;

  try {
    await supabaseClient
      .from('enlistments')
      .update({ avatar_url: safeUrl })
      .eq('user_id', userId);
  } catch (_e) {
    // Column may not exist; non-critical
  }

  return true;
}

/**
 * RECRUIT DASHBOARD FEATURES
 */

async function getRecruitData(userId) {
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user || null;
  const [enlistmentResponse, projects, submissions, missionUpdates] = await Promise.all([
    getEnlistmentByUserId(userId),
    supabaseClient.from('user_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseClient.from('submissions').select('*').eq('author_id', userId),
    supabaseClient.from('mission_updates').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  let enlistment = enlistmentResponse;

  if (!enlistment && user) {
    enlistment = {
      callsign: user?.user_metadata?.callsign || 'Explorer',
      division: 'UNASSIGNED',
      xp: 0,
      level: 1,
      avatar_url: user?.user_metadata?.avatar_url || null
    };
  }

  if (enlistment && user && user.user_metadata) {
    enlistment.avatar_url = enlistment.avatar_url || user.user_metadata.avatar_url || null;
  }

  return {
    enlistment,
    projects: projects.data || [],
    submissions: submissions.data || [],
    updates: missionUpdates.data || []
  };
}

async function submitProjectProposal(project) {
  const { error } = await supabaseClient.from('projects').insert([project]);
  if (error) throw error;
}

async function createProject(userId, title) {
  const { data, error } = await supabaseClient
    .from('user_projects')
    .insert([{ user_id: userId, title: title }])
    .select();
  if (error) throw error;
  return data[0];
}

async function addProjectUpdate(projectId, userId, updateText, file = null) {
  let imageUrl = null;
  if (file) {
    const fileName = Date.now() + '_' + file.name.replace(/\s+/g, '_');
    const filePath = 'updates/' + fileName;
    imageUrl = await uploadFile('mission-evidence', filePath, file);
  }

  const { error } = await supabaseClient
    .from('mission_updates')
    .insert([{
      project_id: projectId,
      user_id: userId,
      update_text: updateText,
      image_url: imageUrl
    }]);
    
  if (error) throw error;
}

/**
 * COMMUNITY INTERACTIONS (Comments & Upvotes)
 */

async function getInteractions(targetId) {
  const { data: interactions, error: intError } = await supabaseClient
    .from('interactions')
    .select('*')
    .eq('target_id', targetId)
    .order('created_at', { ascending: true });

  if (intError || !interactions || interactions.length === 0) return [];

  const userIds = [...new Set(interactions.map(i => i.user_id))];
  const { data: profiles, error: profError } = await supabaseClient
    .from('enlistments')
    .select('user_id, callsign, avatar_url')
    .in('user_id', userIds);

  const profileMap = {};
  if (profiles) {
    profiles.forEach(p => profileMap[p.user_id] = p);
  }

  return interactions.map(i => ({
    ...i,
    enlistments: profileMap[i.user_id] || { callsign: 'Explorer', avatar_url: null }
  }));
}

/**
 * TOAST NOTIFICATION SYSTEM
 */

function showToast(message, type, title) {
  type = type || 'info';
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  let icon = '🚀';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '📡';
  if (!title) {
    title = type === 'success' ? 'Mission Success' : (type === 'error' ? 'System Anomaly' : 'Incoming Signal');
  }

  const safeMessage = escapeHTML(message);
  const safeTitle = escapeHTML(title);

  toast.innerHTML =
    '<div class="toast-icon">' + icon + '</div>' +
    '<div class="toast-content">' +
    '<span class="toast-title">' + safeTitle + '</span>' +
    '<span class="toast-message">' + safeMessage + '</span>' +
    '</div>' +
    '<div class="toast-progress"></div>';

  container.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add('show');
  });

  const progressBar = toast.querySelector('.toast-progress');
  progressBar.style.animation = 'toast-progress 5000ms linear forwards';

  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () {
      toast.remove();
    }, 600);
  }, 5000);
}

async function addComment(userId, targetId, content) {
  const { error } = await supabaseClient.from('interactions').insert([{
    user_id: userId,
    target_id: targetId,
    type: 'comment',
    content: content
  }]);
  if (error) throw error;
  await updateXP(userId, 10);
}

async function castVote(userId, targetId) {
  const { data: existing } = await supabaseClient
    .from('interactions')
    .select('id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .eq('type', 'upvote')
    .single();

  if (existing) return;

  const { error } = await supabaseClient.from('interactions').insert([{
    user_id: userId,
    target_id: targetId,
    type: 'upvote'
  }]);
  if (error) throw error;
  await updateXP(userId, 5);
}

/**
 * NOTIFICATIONS
 */

async function createNotification(userId, type, message, link) {
  const { error } = await supabaseClient.from('notifications').insert([{
    user_id: userId,
    type: type,
    message: message,
    link: link,
    is_read: false
  }]);
  if (error) {
    throw new Error('Notification delivery failed');
  }
}

async function getMyNotifications(userId) {
  const { data, error } = await supabaseClient
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

/**
 * ADMIN & CONTENT MANAGEMENT
 * SECURITY: These operations are gated by RLS — only admins or data owners can proceed.
 */

async function getEnlistments() {
  const { data, error } = await supabaseClient.from('enlistments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getEnlistmentByUserId(userId) {
  let { data, error } = await supabaseClient.from('enlistments').select('*').eq('user_id', userId).single();
  
  if (!data) {
    // If not found by user_id, it might be an unlinked profile from OTP signup
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const email = authData?.user?.email;
      if (email) {
        const { data: emailProfile } = await supabaseClient.from('enlistments').select('*').eq('commlink', email).single();
        if (emailProfile) {
          // Attempt to link the ID so future lookups are fast (may be blocked by RLS, but UI will still work)
          await supabaseClient.from('enlistments').update({ user_id: userId }).eq('id', emailProfile.id);
          data = { ...emailProfile, user_id: userId };
        }
      }
    } catch (e) {}
  }
  
  return data || null;
}

/**
 * STORAGE ENGINE
 */

async function uploadFile(bucket, path, file) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });

  if (error) {
    throw new Error('Storage upload failed');
  }

  const { data: { publicUrl } } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * ADMIN RESEARCH UPLINK
 */

async function handleAdminResearchUpload(paperData, file) {
  try {
    const fileName = Date.now() + '_' + file.name.replace(/\s+/g, '_');
    const filePath = 'research/' + fileName;
    const pdfUrl = await uploadFile('mission-evidence', filePath, file);

    const { error } = await supabaseClient
      .from('papers')
      .insert([{
        ...paperData,
        pdf_url: pdfUrl,
        published_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    throw err;
  }
}

/**
 * RECRUIT RESEARCH SUBMISSION
 */

async function handleRecruitResearchSubmission(submissionData, file) {
  try {
    const fileName = Date.now() + '_' + file.name.replace(/\s+/g, '_');
    const filePath = 'submissions/' + fileName;
    const pdfUrl = await uploadFile('mission-evidence', filePath, file);

    const { error } = await supabaseClient
      .from('submissions')
      .insert([{
        title: submissionData.title,
        abstract: submissionData.abstract,
        pdf_url: pdfUrl,
        author_id: submissionData.author_id,
        status: 'pending'
      }]);

    if (error) throw error;

    await createNotification(
      null,
      'NEW_SUBMISSION',
      'New research data received from recruit: ' + submissionData.title,
      'admin.html'
    );

    return { success: true };
  } catch (err) {
    throw err;
  }
}

async function upsertBlogPost(blogData) {
  const { data, error } = await supabaseClient.from('blogs').insert([blogData]).select();
  if (error) throw error;
  return data[0];
}

async function deleteBlogPost(id) {
  await supabaseClient.from('blogs').delete().eq('id', id);
}

async function deleteResearchPaper(id) {
  await supabaseClient.from('papers').delete().eq('id', id);
}

async function upsertEvent(eventData) {
  const { data, error } = await supabaseClient.from('events').insert([eventData]).select();
  if (error) throw error;
  return data[0];
}

async function deleteEventRecord(id) {
  await supabaseClient.from('events').delete().eq('id', id);
}

/**
 * MISSION SYSTEM
 */

async function getAvailableMissions() {
  const { data, error } = await supabaseClient
    .from('missions')
    .select('*')
    .order('xp_reward', { ascending: true });

  if (error) throw error;
  return data;
}

async function createMission(missionData) {
  const { data, error } = await supabaseClient
    .from('missions')
    .insert([missionData])
    .select();
  if (error) throw error;
  return data[0];
}

async function getUserCompletedMissions(userId) {
  const { data, error } = await supabaseClient
    .from('user_missions')
    .select('mission_id')
    .eq('user_id', userId);
  if (error) return [];
  return data.map(function (m) { return m.mission_id; });
}

async function completeMission(userId, missionId) {
  const { data: existing } = await supabaseClient
    .from('user_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .single();

  if (existing) return;

  const { data: mission } = await supabaseClient
    .from('missions')
    .select('xp_reward, title')
    .eq('id', missionId)
    .single();

  await supabaseClient.from('user_missions').insert([{ user_id: userId, mission_id: missionId }]);
  await updateXP(userId, mission.xp_reward);
  await createNotification(userId, 'MISSION_COMPLETE', 'Mission Accomplished: ' + mission.title + '! +' + mission.xp_reward + ' XP', 'recruit-dashboard.html');
}

/**
 * PUBLIC PROFILES & LEADERBOARD
 */

async function getLeaderboard() {
  const { data, error } = await supabaseClient
    .from('enlistments')
    .select('callsign, identifier, level, xp, division')
    .order('xp', { ascending: false })
    .limit(10);
  if (error) return [];
  return data;
}
