/**
 * BLOG - DYNAMIC CMS LOGIC
 * SECURITY: All DB-rendered values are escaped via escapeHTML().
 * Blog content is rendered as text, not raw HTML, to prevent XSS.
 */

async function initBlogHub() {
    const grid = document.getElementById('blogGrid');
    const featureLayout = document.getElementById('blogFeatureLayout');
    const searchInput = document.getElementById('blogSearch');
    const filterBtns = document.querySelectorAll('.category-btn');

    if (!grid) return;

    try {
        const blogs = await getBlogPosts();
        renderBlogs(blogs);
        setupHandlers(blogs);
    } catch (_error) {
        grid.innerHTML = '<p style="color:var(--accent-pink)">Failed to load dispatches.</p>';
    }

    function renderBlogs(blogsList) {
        grid.innerHTML = '';
        if (featureLayout) featureLayout.innerHTML = '';

        if (blogsList.length > 0) {
            const featured = blogsList[0];
            if (featureLayout) {
                const safeTitle = escapeHTML(featured.title);
                const safeDesc = escapeHTML(featured.description);
                const safeAuthor = escapeHTML(featured.author);
                const safeDate = escapeHTML(featured.date);
                const safeTag = escapeHTML(featured.tag);
                const bgImage = featured.image_url ? 'background-image: url(\'' + escapeHTML(featured.image_url) + '\');' : '';

                featureLayout.innerHTML =
                    '<div class="feature-visual" style="' + bgImage + '">' +
                        '<div class="feature-visual-overlay"></div>' +
                    '</div>' +
                    '<div class="feature-details">' +
                        '<div class="glass-tag">' + safeTag + '</div>' +
                        '<h2 class="section-title" style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 20px;">' + safeTitle + '</h2>' +
                        '<p class="section-subtitle" style="font-size: 1.1rem; margin-bottom: 30px; opacity: 0.9;">' + safeDesc + '</p>' +
                        '<div class="blog-meta-premium">' +
                            '<div class="meta-item">' +
                                '<span class="meta-label">COMMANDER:</span>' +
                                '<span class="meta-value">' + safeAuthor + '</span>' +
                            '</div>' +
                            '<div class="meta-item">' +
                                '<span class="meta-label">TIMESTAMP:</span>' +
                                '<span class="meta-value">' + safeDate + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="hero-cta-group" style="justify-content: flex-start; gap: 20px; margin-top: 20px;">' +
                            '<button class="btn-primary premium-btn" onclick="openBlogModal(\'' + featured.id + '\')">' +
                                '<span>ACCESS DISPATCH</span>' +
                                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
                            '</button>' +
                            '<div id="interactions-feature" class="interactions-hub"></div>' +
                        '</div>' +
                    '</div>';
                var intFeature = document.getElementById('interactions-feature');
                if (intFeature) renderInteractions(intFeature, featured.id);
            }

            blogsList.slice(1).forEach(function(blog, index) {
                var article = document.createElement('article');
                article.className = 'paper-node reveal visible';
                article.style.transitionDelay = String((index % 3) * 0.1) + 's';

                var safeTitle = escapeHTML(blog.title);
                var safeDesc = escapeHTML(blog.description);
                var safeAuthor = escapeHTML(blog.author);
                var safeTag = escapeHTML(blog.tag);
                var imgHtml = blog.image_url
                    ? '<img src="' + escapeHTML(blog.image_url) + '" alt="' + safeTitle + '">'
                    : '';

                article.innerHTML =
                    '<div class="paper-cover-premium">' +
                        imgHtml +
                        '<div class="paper-tag-overlay">' + safeTag + '</div>' +
                    '</div>' +
                    '<div class="paper-content">' +
                        '<h3 class="paper-title" onclick="openBlogModal(\'' + blog.id + '\')">' + safeTitle + '</h3>' +
                        '<p class="paper-excerpt">' + safeDesc + '</p>' +
                        '<div class="paper-footer-premium">' +
                            '<div class="author-info">' +
                                '<div class="author-avatar-small">' + safeAuthor.charAt(0) + '</div>' +
                                '<span>' + safeAuthor + '</span>' +
                            '</div>' +
                            '<div id="interactions-' + blog.id + '" class="interactions-mini"></div>' +
                        '</div>' +
                    '</div>';
                grid.appendChild(article);
                var intEl = document.getElementById('interactions-' + blog.id);
                if (intEl) renderInteractions(intEl, blog.id);
            });
        }
    }

    function setupHandlers(allBlogs) {
        searchInput.addEventListener('input', function() {
            var query = searchInput.value.toLowerCase();
            var filtered = allBlogs.filter(function(b) {
                return b.title.toLowerCase().includes(query) ||
                    b.description.toLowerCase().includes(query) ||
                    b.tag.toLowerCase().includes(query);
            });
            renderBlogs(filtered);
        });

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.textContent.toLowerCase();
                var filtered = (filter === 'all topics')
                    ? allBlogs
                    : allBlogs.filter(function(b) { return b.tag.toLowerCase().includes(filter); });
                renderBlogs(filtered);
            });
        });
    }
}

// Modal Logic — renders content as text to prevent XSS
window.openBlogModal = function(blogId) {
    var blogs = window.__cachedBlogs || [];
    var blog = blogs.find(function(b) { return b.id === blogId; });
    if (!blog) {
        // Fetch single blog if not cached
        supabaseClient.from('blogs').select('*').eq('id', blogId).single().then(function(res) {
            if (res.data) renderModal(res.data);
        });
        return;
    }
    renderModal(blog);
};

function renderModal(blog) {
    var modal = document.getElementById('blogModal');
    var modalBody = document.getElementById('modalBody');
    var progressBar = document.getElementById('readingProgress');

    document.getElementById('modalTitle').textContent = escapeHTML(blog.title);
    document.getElementById('modalMeta').textContent = 'By ' + escapeHTML(blog.author) + ' | ' + escapeHTML(blog.date);
    // Use textContent, not innerHTML, to prevent XSS
    modalBody.textContent = blog.content || '';

    if (progressBar) progressBar.style.width = '0%';

    modal.classList.add('active');

    modalBody.onscroll = function() {
        var winScroll = modalBody.scrollTop;
        var height = modalBody.scrollHeight - modalBody.clientHeight;
        var scrolled = (winScroll / height) * 100;
        if (progressBar) progressBar.style.width = scrolled + '%';
    };
}

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('blogModal').classList.remove('active');
});

window.addEventListener('click', function(e) {
    var modal = document.getElementById('blogModal');
    if (e.target === modal) modal.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', function() {
    initBlogHub();
    // Cache blogs for modal access
    getBlogPosts().then(function(blogs) {
        window.__cachedBlogs = blogs;
    });
});
