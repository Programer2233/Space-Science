/**
 * RESEARCH HUB - DYNAMIC CMS LOGIC
 * SECURITY: All DB-rendered values are escaped via escapeHTML().
 */

async function initResearchHub() {
  var grid = document.querySelector('.archive-grid');
  var searchInput = document.getElementById('hubSearch');
  var filterBtns = document.querySelectorAll('.category-btn');

  if (!grid) return;

  try {
    var papers = await getResearchPapers();
    renderPapers(papers);
    setupHandlers(papers);
  } catch (_error) {
    grid.innerHTML = '<p style="color:var(--accent-pink)">Failed to connect to Research Database.</p>';
  }

  function renderPapers(papersList) {
    var featureLayout = document.getElementById('featureLayout');
    grid.innerHTML = '';
    if (featureLayout) featureLayout.innerHTML = '';

    if (papersList.length > 0) {
      var featuredPaper = papersList[0];
      if (featureLayout) {
        var safeTitle = escapeHTML(featuredPaper.title);
        var safeDesc = escapeHTML(featuredPaper.description);
        var safeAuthor = escapeHTML(featuredPaper.author);
        var safeDate = featuredPaper.date || 'Unknown';
        var coverUrl = featuredPaper.cover_url || 'assets/images/hero-bg.png';

        featureLayout.innerHTML =
          '<div class="feature-visual" style="background-image: url(\'' + escapeHTML(coverUrl) + '\');"></div>' +
          '<div class="feature-details">' +
            '<span class="label">Latest Discovery</span>' +
            '<h2 class="section-title" style="font-size: 2.5rem;">' + safeTitle + '</h2>' +
            '<p class="section-subtitle" style="font-size: 1rem; margin-bottom: 24px;">' + safeDesc + '</p>' +
            '<div class="research-card-meta" style="margin-bottom: 30px;">' +
              '<div class="author" style="display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:0.9rem;color:var(--text-secondary)">' +
                '<div class="author-avatar" style="width:30px;height:30px;border-radius:50%;background:var(--accent-blue);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">Res</div>' +
                '<span>Lead Researcher: ' + safeAuthor + '</span>' +
              '</div>' +
              '<span style="display:block;margin-top:10px;font-family:var(--font-mono);font-size:0.8rem;color:var(--text-secondary)">Published: ' + safeDate + '</span>' +
            '</div>' +
            '<div class="hero-cta-group" style="justify-content: flex-start;">' +
              '<a href="' + escapeHTML(featuredPaper.pdf_url) + '" target="_blank" class="btn-primary">Download PDF</a>' +
            '</div>' +
          '</div>';
      }

      var gridPapers = papersList.slice(1);
      gridPapers.forEach(function(paper) {
        var article = document.createElement('article');
        article.className = 'paper-node reveal visible';

        var safeCategory = escapeHTML(paper.category);
        var safeTitle = escapeHTML(paper.title);
        var safeDesc = escapeHTML(paper.description);
        var safeAuthor = escapeHTML(paper.author);

        var coverHtml = '';
        if (paper.cover_url) {
          coverHtml = '<div class="paper-cover" style="width: calc(100% + 60px); height: 200px; margin: -30px -30px 20px -30px;">' +
            '<img src="' + escapeHTML(paper.cover_url) + '" alt="Cover Image" style="width: 100%; height: 100%; object-fit: cover; border-bottom: 1px solid var(--border-glass);">' +
          '</div>';
        }

        article.innerHTML =
          coverHtml +
          '<div class="paper-content">' +
            '<span class="research-card-tag">' + safeCategory + '</span>' +
            '<h3>' + safeTitle + '</h3>' +
            '<p>' + safeDesc + '</p>' +
            '<div class="paper-meta">' +
              '<div class="author">' +
                '<span>' + safeAuthor + '</span>' +
              '</div>' +
              '<div class="paper-actions">' +
                '<a href="#" class="action-icon" title="View Abstract">👁️</a>' +
                '<a href="' + escapeHTML(paper.pdf_url) + '" class="action-icon" title="Download Paper" target="_blank">📥</a>' +
              '</div>' +
            '</div>' +
          '</div>';
        grid.appendChild(article);

        var intContainer = document.createElement('div');
        intContainer.className = 'interaction-container';
        article.querySelector('.paper-content').appendChild(intContainer);
        renderInteractions(intContainer, paper.id);
      });
    }
  }

  function setupHandlers(allPapers) {
    searchInput.addEventListener('input', function() {
      var query = searchInput.value.toLowerCase();
      var filtered = allPapers.filter(function(p) {
        return (p.title && p.title.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query));
      });
      renderPapers(filtered);
    });

    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var filter = btn.textContent.toLowerCase();
        var filtered = (filter === 'all fields')
          ? allPapers
          : allPapers.filter(function(p) { return p.category && p.category.toLowerCase().includes(filter); });

        renderPapers(filtered);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initResearchHub();
});
