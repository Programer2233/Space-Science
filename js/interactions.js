/**
 * COMMUNITY INTERACTIONS UI HELPER
 * SECURITY: All user-generated content is escaped via escapeHTML().
 */

async function renderInteractions(container, targetId) {
    var interactions = await getInteractions(targetId);
    var upvotes = interactions.filter(function(i) { return i.type === 'upvote'; });
    var comments = interactions.filter(function(i) { return i.type === 'comment'; });
    var user = await getCurrentUser();

    var upvoteColor = hasUserVoted(upvotes, user && user.id)
        ? 'var(--accent-blue)' : 'var(--border-glass)';
    var upvoteTextColor = hasUserVoted(upvotes, user && user.id)
        ? 'var(--accent-blue)' : 'var(--text-secondary)';

    var commentsHtml = '';
    if (comments.length === 0) {
        commentsHtml = '<p style="font-size: 0.75rem; color: var(--text-muted);">No transmissions yet. Be the first to comment!</p>';
    } else {
        commentsHtml = comments.map(function(c) {
            var safeCallsign = escapeHTML(c.enlistments && c.enlistments.callsign) || 'Explorer';
            var safeDate = new Date(c.created_at).toLocaleDateString();
            var safeContent = escapeHTML(c.content);
            return '<div class="comment-item" style="margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">' +
                '<div style="font-size: 0.7rem; color: var(--accent-cyan); font-family: var(--font-mono);">' + safeCallsign + ' // ' + safeDate + '</div>' +
                '<div style="font-size: 0.8rem; color: white;">' + safeContent + '</div>' +
            '</div>';
        }).join('');
    }

    var authHtml = '';
    if (user) {
        authHtml =
            '<div class="comment-input-group" style="display: flex; gap: 10px;">' +
                '<input type="text" id="input-' + targetId + '" placeholder="Transmit a thought..." style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: white; padding: 8px 12px; border-radius: 4px; font-size: 0.8rem;">' +
                '<button onclick="handleComment(\'' + targetId + '\')" style="background: var(--accent-blue); color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">SEND</button>' +
            '</div>';
    } else {
        authHtml = '<p style="font-size: 0.7rem; color: var(--text-muted);">Login to participate in the discussion.</p>';
    }

    container.innerHTML =
        '<div class="interaction-bar" style="display: flex; gap: 20px; margin-top: 15px; border-top: 1px solid var(--border-glass); padding-top: 15px;">' +
            '<button class="upvote-btn" onclick="handleVote(\'' + targetId + '\')" style="background: none; border: 1px solid ' + upvoteColor + '; color: ' + upvoteTextColor + '; padding: 5px 12px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">' +
                '🚀 ' + upvotes.length +
            '</button>' +
            '<button class="comment-btn" onclick="toggleComments(\'' + targetId + '\')" style="background: none; border: 1px solid var(--border-glass); color: var(--text-secondary); padding: 5px 12px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">' +
                '💬 ' + comments.length +
            '</button>' +
        '</div>' +
        '<div id="comments-' + targetId + '" class="comments-section" style="display: none; margin-top: 15px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">' +
            '<div class="comments-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">' +
                commentsHtml +
            '</div>' +
            authHtml +
        '</div>';
}

function hasUserVoted(votes, userId) {
    if (!userId) return false;
    return votes.some(function(v) { return v.user_id === userId; });
}

window.toggleComments = function(id) {
    var el = document.getElementById('comments-' + id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.handleVote = async function(id) {
    var user = await getCurrentUser();
    if (!user) {
        showToast('You must be logged in to upvote.', 'warning');
        return;
    }
    try {
        await castVote(user.id, id);
        location.reload();
    } catch (_e) { /* Vote failed silently */ }
};

window.handleComment = async function(id) {
    var input = document.getElementById('input-' + id);
    if (!input) return;
    var content = input.value.trim();
    if (!content) return;

    var user = await getCurrentUser();
    try {
        await addComment(user.id, id, content);
        input.value = '';
        location.reload();
    } catch (_e) { /* Comment failed silently */ }
};
