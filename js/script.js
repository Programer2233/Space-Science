/* ============================================
   SPACE SCIENCE CLUB - INTERACTIVE SCRIPTS
   ============================================ */

// ==========================================
// 1. INTERACTIVE STAR FIELD CANVAS (ENHANCED)
// ==========================================
class StarField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Multi-layer stars
    this.bgStars = [];      // tiny distant background stars
    this.midStars = [];     // mid-layer interactive stars
    this.fgStars = [];      // bright foreground stars
    this.nebulaDust = [];   // floating nebula particles
    this.shootingStars = [];
    this.ripples = [];      // mouse click ripples

    this.mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000 };
    this.mouseSpeed = 0;
    this.mouseRadius = 400; // Expanded to reveal huge swathes of constellation webs
    this.rafId = null;

    this.resize();
    this.createAllParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  createAllParticles() {
    this.bgStars = [];
    this.midStars = [];
    this.fgStars = [];
    this.nebulaDust = [];

    // Background layer — lots of tiny static-ish stars
    const bgCount = Math.floor(this.w * this.h / 2500);
    for (let i = 0; i < bgCount; i++) {
      this.bgStars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: Math.random() * 1 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        twinkleSpeed: Math.random() * 0.01 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Mid-layer — interactive stars
    const midCount = Math.floor(this.w * this.h / 3000); // Increased density
    const palette = [160, 200, 220, 280, 320, 340, 140, 180, 0]; // Greens, blues, purples, cyans, reds
    for (let i = 0; i < midCount; i++) {
      const x = Math.random() * this.w;
      const y = Math.random() * this.h;
      
      this.midStars.push({
        x, y, baseX: x, baseY: y,
        size: Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.8 + 0.2,
        baseOpacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.01 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: 0, vy: 0,
        // Mostly whitish/blue, but random brilliant colored stars matching the reference
        hue: Math.random() > 0.85 ? palette[Math.floor(Math.random() * palette.length)] : 210,
        linked: [] // To store persistent connections if needed
      });
    }

    // Foreground — fewer, bigger, brighter stars with cross-shaped flare
    const fgCount = Math.floor(this.w * this.h / 40000);
    for (let i = 0; i < fgCount; i++) {
      const x = Math.random() * this.w;
      const y = Math.random() * this.h;
      this.fgStars.push({
        x, y, baseX: x, baseY: y,
        size: Math.random() * 2 + 1.5,
        opacity: Math.random() * 0.4 + 0.6,
        baseOpacity: Math.random() * 0.4 + 0.6,
        twinkleSpeed: Math.random() * 0.008 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: 0, vy: 0,
        flareSize: Math.random() * 12 + 6,
        hue: [200, 220, 240, 260, 180][Math.floor(Math.random() * 5)],
      });
    }

    // Nebula dust — large, soft, slow-drifting colored blobs
    const dustCount = Math.floor(this.w * this.h / 80000);
    for (let i = 0; i < dustCount; i++) {
      this.nebulaDust.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: Math.random() * 120 + 60,
        opacity: Math.random() * 0.02 + 0.008,
        baseOpacity: Math.random() * 0.02 + 0.008,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: (Math.random() - 0.5) * 0.05,
        hue: [220, 260, 280, 200][Math.floor(Math.random() * 4)],
        sat: Math.random() * 30 + 40,
      });
    }
  }

  bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.resize();
        this.createAllParticles();
      }, 150);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      const dx = this.mouse.x - this.mouse.prevX;
      const dy = this.mouse.y - this.mouse.prevY;
      this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
      this.mouseSpeed = 0;
    });

    // Ripple on click
    window.addEventListener('click', (e) => {
      this.ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 300,
        opacity: 0.4,
        speed: 4,
      });
    });
  }

  // --- SHOOTING STARS ---
  spawnShootingStar() {
    if (Math.random() < 0.005) {
      const startX = Math.random() * this.w * 0.8;
      this.shootingStars.push({
        x: startX,
        y: Math.random() * this.h * 0.4,
        length: Math.random() * 180 + 80,
        speed: Math.random() * 10 + 7,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
        opacity: 1,
        width: Math.random() * 1.5 + 1,
      });
    }
  }

  updateShootingStars() {
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= 0.006;
      if (ss.opacity <= 0 || ss.x > this.w + 50 || ss.y > this.h + 50) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  drawShootingStars() {
    this.shootingStars.forEach(ss => {
      const tailX = ss.x - Math.cos(ss.angle) * ss.length;
      const tailY = ss.y - Math.sin(ss.angle) * ss.length;

      // Outer glow trail
      const glowGrad = this.ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      glowGrad.addColorStop(0, `rgba(74, 158, 255, 0)`);
      glowGrad.addColorStop(0.7, `rgba(120, 180, 255, ${ss.opacity * 0.2})`);
      glowGrad.addColorStop(1, `rgba(200, 230, 255, ${ss.opacity * 0.5})`);
      this.ctx.strokeStyle = glowGrad;
      this.ctx.lineWidth = ss.width + 4;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(ss.x, ss.y);
      this.ctx.stroke();

      // Core bright trail
      const coreGrad = this.ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
      coreGrad.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`);
      this.ctx.strokeStyle = coreGrad;
      this.ctx.lineWidth = ss.width;
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(ss.x, ss.y);
      this.ctx.stroke();

      // Bright head glow
      const headGlow = this.ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 8);
      headGlow.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
      headGlow.addColorStop(0.5, `rgba(150, 200, 255, ${ss.opacity * 0.4})`);
      headGlow.addColorStop(1, `rgba(74, 158, 255, 0)`);
      this.ctx.beginPath();
      this.ctx.arc(ss.x, ss.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = headGlow;
      this.ctx.fill();
    });
    this.ctx.lineCap = 'butt';
  }

  // --- RIPPLES ---
  updateRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity -= 0.004;
      if (r.opacity <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  drawRipples() {
    this.ripples.forEach(r => {
      this.ctx.strokeStyle = `rgba(74, 158, 255, ${r.opacity})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner ring
      if (r.radius > 20) {
        this.ctx.strokeStyle = `rgba(199, 125, 255, ${r.opacity * 0.5})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }

  // --- NEBULA DUST ---
  drawNebulaDust(time) {
    this.nebulaDust.forEach(d => {
      d.x += d.driftX;
      d.y += d.driftY;
      // Wrap around
      if (d.x < -d.size) d.x = this.w + d.size;
      if (d.x > this.w + d.size) d.x = -d.size;
      if (d.y < -d.size) d.y = this.h + d.size;
      if (d.y > this.h + d.size) d.y = -d.size;

      // Brighten near mouse
      let opacity = d.baseOpacity;
      const dx = this.mouse.x - d.x;
      const dy = this.mouse.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouseRadius + d.size) {
        const force = 1 - dist / (this.mouseRadius + d.size);
        opacity += force * 0.04;
      }

      const grad = this.ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size);
      grad.addColorStop(0, `hsla(${d.hue}, ${d.sat}%, 50%, ${opacity})`);
      grad.addColorStop(1, `hsla(${d.hue}, ${d.sat}%, 50%, 0)`);
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });
  }

  // --- DRAW STAR WITH OPTIONAL CROSS FLARE ---
  drawStarDot(x, y, size, opacity, hue = 210) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = `hsla(${hue}, 60%, 85%, ${opacity})`;
    this.ctx.fill();
  }

  drawStarGlow(x, y, size, opacity, glowStrength, hue = 210) {
    this.drawStarDot(x, y, size, opacity, hue);

    if (glowStrength > 0.05) {
      const glowR = size + glowStrength * 12;
      const grad = this.ctx.createRadialGradient(x, y, size * 0.5, x, y, glowR);
      grad.addColorStop(0, `hsla(${hue}, 70%, 70%, ${glowStrength * 0.5})`);
      grad.addColorStop(0.5, `hsla(${hue}, 60%, 50%, ${glowStrength * 0.15})`);
      grad.addColorStop(1, `hsla(${hue}, 60%, 50%, 0)`);
      this.ctx.beginPath();
      this.ctx.arc(x, y, glowR, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }
  }

  drawCrossFlare(x, y, flareSize, opacity) {
    this.ctx.save();
    this.ctx.globalAlpha = opacity * 0.3;
    this.ctx.strokeStyle = `rgba(200, 220, 255, ${opacity})`;
    this.ctx.lineWidth = 0.5;
    // Horizontal flare
    this.ctx.beginPath();
    this.ctx.moveTo(x - flareSize, y);
    this.ctx.lineTo(x + flareSize, y);
    this.ctx.stroke();
    // Vertical flare
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - flareSize);
    this.ctx.lineTo(x, y + flareSize);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // --- CONSTELLATIONS ---
  drawConstellations() {
    const connectionRadius = 160;
    const maxEdges = 4;
    
    // Evaluate stars that are close to the mouse to act as network nodes
    const activeNodes = this.midStars.filter(s => {
      const dx = this.mouse.x - s.x;
      const dy = this.mouse.y - s.y;
      return Math.sqrt(dx * dx + dy * dy) < this.mouseRadius * 1.2;
    });

    this.ctx.lineWidth = 0.8;
    
    for (let i = 0; i < activeNodes.length; i++) {
      let edgesCount = 0;
      for (let j = 0; j < this.midStars.length; j++) {
        if (activeNodes[i] === this.midStars[j]) continue;
        
        const dx = activeNodes[i].x - this.midStars[j].x;
        const dy = activeNodes[i].y - this.midStars[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < connectionRadius) {
          // Glow intensity based on distance to mouse AND distance between stars
          const distToMouse = Math.sqrt(
            Math.pow(this.mouse.x - activeNodes[i].x, 2) + Math.pow(this.mouse.y - activeNodes[i].y, 2)
          );
          
          let opacity = (1 - dist / connectionRadius) * (1 - distToMouse / (this.mouseRadius * 1.2));
          opacity = Math.max(0, opacity);

          if (opacity > 0.05) {
            // Draw line
            this.ctx.strokeStyle = `hsla(${activeNodes[i].hue}, 80%, 70%, ${opacity * 0.8})`;
            this.ctx.beginPath();
            this.ctx.moveTo(activeNodes[i].x, activeNodes[i].y);
            this.ctx.lineTo(this.midStars[j].x, this.midStars[j].y);
            this.ctx.stroke();
            edgesCount++;
          }
        }
        if (edgesCount >= maxEdges) break;
      }
    }
  }

  // --- MOUSE GLOW ---
  drawMouseGlow() {
    if (this.mouse.x < 0) return;
    const intensity = Math.min(this.mouseSpeed / 15, 1) * 0.08 + 0.03;
    const grad = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 0,
      this.mouse.x, this.mouse.y, this.mouseRadius
    );
    grad.addColorStop(0, `rgba(74, 158, 255, ${intensity})`);
    grad.addColorStop(0.4, `rgba(74, 158, 255, ${intensity * 0.4})`);
    grad.addColorStop(1, `rgba(74, 158, 255, 0)`);
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = grad;
    this.ctx.fill();
  }

  // --- MAIN ANIMATE LOOP ---
  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    const time = performance.now() * 0.001;

    // 1) Nebula dust (bottom layer)
    this.drawNebulaDust(time);

    // 2) Background stars — simple twinkle, no interaction
    this.bgStars.forEach(star => {
      const op = star.opacity + Math.sin(time * star.twinkleSpeed * 50 + star.twinkleOffset) * 0.15;
      this.drawStarDot(star.x, star.y, star.size, Math.max(0.05, Math.min(0.6, op)));
    });

    // 3) Mid-layer stars — interactive
    this.midStars.forEach(star => {
      star.opacity = star.baseOpacity + Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.25;
      star.opacity = Math.max(0.1, Math.min(1, star.opacity));

      const dx = this.mouse.x - star.x;
      const dy = this.mouse.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let glowStrength = 0;

      if (dist < this.mouseRadius) {
        const force = (this.mouseRadius - dist) / this.mouseRadius;
        // Significantly reduced push force so stars stay mostly in place like a rigid constellation
        star.vx -= (dx / dist) * force * 0.05; 
        star.vy -= (dy / dist) * force * 0.05;
        star.opacity = Math.min(1, star.opacity + force * 0.8);
        glowStrength = force * 1.5;
        const drawSize = star.size + force * 1.5;
        this.drawStarGlow(star.x, star.y, drawSize, star.opacity, glowStrength, star.hue);
      } else {
        this.drawStarGlow(star.x, star.y, star.size, star.opacity, 0, star.hue);
      }

      // Ripple interaction
      this.ripples.forEach(r => {
        const rdx = star.x - r.x;
        const rdy = star.y - r.y;
        const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
        if (Math.abs(rDist - r.radius) < 30) {
          const push = r.opacity * 2;
          star.vx += (rdx / rDist) * push;
          star.vy += (rdy / rDist) * push;
        }
      });

      star.x += star.vx;
      star.y += star.vy;
      star.vx *= 0.94;
      star.vy *= 0.94;
      star.x += (star.baseX - star.x) * 0.012;
      star.y += (star.baseY - star.y) * 0.012;
    });

    // 4) Foreground stars — bright with cross flares
    this.fgStars.forEach(star => {
      star.opacity = star.baseOpacity + Math.sin(time * star.twinkleSpeed * 40 + star.twinkleOffset) * 0.2;
      star.opacity = Math.max(0.3, Math.min(1, star.opacity));

      const dx = this.mouse.x - star.x;
      const dy = this.mouse.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let glowStrength = 0;

      if (dist < this.mouseRadius * 1.2) {
        const force = (this.mouseRadius * 1.2 - dist) / (this.mouseRadius * 1.2);
        star.vx -= (dx / dist) * force * 0.03;
        star.vy -= (dy / dist) * force * 0.03;
        glowStrength = force;
        star.opacity = Math.min(1, star.opacity + force * 0.3);
      }

      this.drawStarGlow(star.x, star.y, star.size, star.opacity, glowStrength, star.hue);
      this.drawCrossFlare(star.x, star.y, star.flareSize * (1 + glowStrength * 0.5), star.opacity);

      star.x += star.vx;
      star.y += star.vy;
      star.x += (star.baseX - star.x) * 0.008;
      star.y += (star.baseY - star.y) * 0.008;
    });

    // 5) Constellation lines
    this.drawConstellations();

    // 6) Mouse glow overlay
    this.drawMouseGlow();

    // 7) Shooting stars
    this.spawnShootingStar();
    this.updateShootingStars();
    this.drawShootingStars();

    // 8) Ripples
    this.updateRipples();
    this.drawRipples();

    this.rafId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 2. HERO GLOW FOLLOW MOUSE
// ==========================================
function initHeroGlow() {
  const glow = document.getElementById('hero-glow') || document.getElementById('heroGlow');
  if (!glow) return;

  window.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = '0.6';
  });
}

// ==========================================
// 3. NAVBAR SCROLL EFFECT
// ==========================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    // Scrolled background
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link tracking
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });
}

// ==========================================
// 4. MOBILE NAV TOGGLE
// ==========================================
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (navLinks.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    }
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    });
  });
}

// ==========================================
// 5. SCROLL REVEAL ANIMATIONS
// ==========================================
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  reveals.forEach(el => observer.observe(el));
}

// ==========================================
// 6. SMOOTH SCROLL FOR ANCHOR LINKS
// ==========================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ==========================================
// 7. PROGRESS BAR ANIMATION ON SCROLL
// ==========================================
function initProgressBars() {
  const fills = document.querySelectorAll('.progress-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const width = fill.style.width;
        fill.style.width = '0%';
        setTimeout(() => {
          fill.style.width = width;
        }, 200);
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.5 });

  fills.forEach(fill => observer.observe(fill));
}

// ==========================================
// 14. TEAM HOVER INTERACTION
// ==========================================
function initTeamInteractions() {
  const teamCards = document.querySelectorAll('.team-member-card');
  const teamItems = document.querySelectorAll('.team-info-item');

  if (!teamCards.length || !teamItems.length) return;

  teamCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const memberId = card.getAttribute('data-member');
      teamItems.forEach(item => {
        if (item.getAttribute('data-member') === memberId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      teamItems.forEach(item => item.classList.remove('active'));
    });
  });

  // Inverse interaction
  teamItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      const memberId = item.getAttribute('data-member');
      teamCards.forEach(card => {
        if (card.getAttribute('data-member') === memberId) {
          card.style.transform = 'translateY(-5px) scale(1.02)';
          card.querySelector('img').style.filter = 'grayscale(0%)';
        }
      });
    });

    item.addEventListener('mouseleave', () => {
      teamCards.forEach(card => {
        card.style.transform = '';
        card.querySelector('img').style.filter = '';
      });
    });
  });
}

// ==========================================
// 8. FORM HANDLING
// ==========================================
// Handle submission via Formspree AJAX in index.html instead.

// ==========================================
// 9. PARALLAX EFFECT ON HERO
// ==========================================
function initParallax() {
  const hero = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg img');
  const astronaut = document.querySelector('.hero-astronaut');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < window.innerHeight) {
      if (heroBg) {
        heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.1)`;
      }
      if (astronaut) {
        astronaut.style.transform = `translateY(${scrollY * -0.15}px)`;
      }
    }
  });
}

// ==========================================
// 10. COUNTER ANIMATION FOR STATS
// ==========================================
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const match = text.match(/(\d+)/);
        if (match) {
          const target = parseInt(match[1]);
          const suffix = text.replace(match[1], '');
          let current = 0;
          const increment = target / 60;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = Math.round(current) + suffix;
          }, 25);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ==========================================
// 11. CARD TILT EFFECT ON HOVER
// ==========================================
function initCardTilt() {
  const cards = document.querySelectorAll('.research-card, .event-card, .mission-card, .blog-card, .paper-node');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -3;
      const rotateY = (x - centerX) / centerX * 3;
      card.style.transform = `translateY(-10px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


// ==========================================
// 12. DYNAMIC RECENT BLOGS
// ==========================================
async function initRecentBlogs() {
  const grid = document.getElementById('blogGridHome');
  if (!grid) return;

  try {
    const blogs = await getBlogPosts();
    // blogs are already ordered by created_at DESC in supabaseClient.js
    
    // Take top 3 for home
    const latest = blogs.slice(0, 3);
    grid.innerHTML = '';

    latest.forEach((blog, index) => {
      const card = document.createElement('article');
      card.className = `blog-card ${index === 0 ? 'blog-featured' : 'blog-card-small'} reveal`;
      card.style.visibility = 'visible'; // Ensure it shows up if reveal delay is tricky
      
      card.innerHTML = `
        <img src="${blog.image_url}" alt="${escapeHTML(blog.title)}" class="blog-card-image">
        <div class="blog-card-body">
          <span class="blog-tag">${escapeHTML(blog.tag)}</span>
          <h3>${escapeHTML(blog.title)}</h3>
          <p>${escapeHTML(blog.description)}</p>
          <div class="blog-card-footer">
            <span>${escapeHTML(blog.date)}</span>
            <a href="blog.html" class="read-more">Read ${index === 0 ? 'More' : ''} →</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Re-initialize reveal and tilt for new elements
    if (typeof initRevealAnimations === 'function') initRevealAnimations();
    if (typeof initCardTilt === 'function') initCardTilt();

  } catch (error) {
    console.error('Error loading home blog dispatches:', error);
    grid.innerHTML = '<p style="color:var(--text-muted)">Unable to connect to the blog database.</p>';
  }
}

// ==========================================
// 13. DYNAMIC EVENTS
// ==========================================
async function initDynamicEvents() {
  const grid = document.getElementById('eventsGridHome');
  if (!grid) return;

  try {
    const events = await getEvents();
    // events are already sorted by date in supabaseClient.js
    
    // Sort by date (closest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    grid.innerHTML = '';
    if (events.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; width:100%;">No upcoming events scheduled. Check back soon!</p>';
      return;
    }

    events.forEach((ev, index) => {
      const card = document.createElement('article');
      card.className = `event-card reveal reveal-delay-${(index % 3) + 1}`;
      
      // Format date: YYYY-MM-DD -> Month DD, YYYY
      const dateObj = new Date(ev.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      card.innerHTML = `
        <img src="${ev.image_url}" alt="${ev.title}" class="event-card-image">
        <div class="event-card-body">
          <span class="event-date-badge">📅 ${formattedDate}</span>
          <span class="event-type-tag ${ev.type.toLowerCase().includes('astronomical') ? 'astronomical' : 'school'}">${ev.type}</span>
          <h3>${ev.title}</h3>
          <p>${ev.description}</p>
        </div>
      `;
      grid.appendChild(card);
    });

    if (typeof initRevealAnimations === 'function') initRevealAnimations();
    if (typeof initCardTilt === 'function') initCardTilt();

  } catch (error) {
    console.error('Error loading events:', error);
    grid.innerHTML = '<p style="color:var(--text-muted)">Unable to sync with Event Nexus.</p>';
  }
}

// ==========================================
// 14. DYNAMIC RESEARCH (HOME)
// ==========================================
async function initRecentResearch() {
  const grid = document.getElementById('researchGridHome');
  if (!grid) return;

  try {
    const papers = await getResearchPapers();
    // papers are already ordered by published_at DESC in supabaseClient.js
    
    // Top 3
    const latest = papers.slice(0, 3);
    grid.innerHTML = '';

    latest.forEach((paper, index) => {
      const card = document.createElement('article');
      card.className = `research-card reveal reveal-delay-${index + 1}`;
      
      // Get initials for avatar
      const initials = paper.author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

      card.innerHTML = `
        <span class="research-card-tag">${escapeHTML(paper.category)}</span>
        <h3>${escapeHTML(paper.title)}</h3>
        <p>${escapeHTML(paper.description)}</p>
        <div class="research-card-meta">
          <div class="author">
            <div class="author-avatar">${initials}</div>
            <span>${escapeHTML(paper.author)}</span>
          </div>
          <a href="research.html" class="read-more">Read Paper →</a>
        </div>
      `;
      grid.appendChild(card);
    });

    if (typeof initRevealAnimations === 'function') initRevealAnimations();
    if (typeof initCardTilt === 'function') initCardTilt();

  } catch (error) {
    console.error('Error loading home research archives:', error);
    grid.innerHTML = '<p style="color:var(--text-muted)">Unable to access Research Hub.</p>';
  }
}

// ==========================================
// INITIALIZE EVERYTHING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  new StarField('star-canvas');
  initHeroGlow();
  initNavbar();
  initMobileNav();
  initRevealAnimations();
  initSmoothScroll();
  initProgressBars();
  initParallax();
  initCounters();
  initCardTilt();
  initRecentBlogs();
  initDynamicEvents();
  initRecentResearch();
  initTeamInteractions();
  initLoader();
  fetchISSPosition();
  setInterval(fetchISSPosition, 5000);
});

// ==========================================
// 15. LOADING SCREEN SEQUENCE
// ==========================================
function initLoader() {
  const loader = document.getElementById('loader');
  const lines = document.querySelectorAll('.terminal-line');
  const progressBar = document.querySelector('.loader-progress-bar');

  if (!loader) return;

  // Start progress bar
  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
  }, 100);

  // Animate terminal lines
  lines.forEach(line => {
    const delay = parseInt(line.getAttribute('data-delay'));
    setTimeout(() => {
      line.classList.add('visible');
    }, delay);
  });

  // Hide loader faster for better UX
  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
    
    // Smooth jump to hash if present (e.g., from research.html#contact)
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, 1200);
}

// ==========================================
// 16. LIVE ISS TELEMETRY
// ==========================================
async function fetchISSPosition() {
  const latEl = document.getElementById('iss-lat');
  const lngEl = document.getElementById('iss-lng');
  const dotEl = document.getElementById('iss-dot');
  
  if (!latEl || !lngEl) return;

  try {
    const response = await fetch('http://api.open-notify.org/iss-now.json');
    const data = await response.json();
    
    if (data.message === 'success') {
      const { latitude, longitude } = data.iss_position;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      latEl.textContent = lat.toFixed(4);
      lngEl.textContent = lng.toFixed(4);
      
      // Update map dot position
      // Map is approx. -90 to 90 lat, -180 to 180 lng
      if (dotEl) {
        const x = ((lng + 180) / 360) * 100;
        const y = (1 - (lat + 90) / 180) * 100;
        dotEl.style.left = `${x}%`;
        dotEl.style.top = `${y}%`;
      }
      
      // Subtle glow effect on update
      [latEl, lngEl].forEach(el => {
        el.style.color = '#fff';
        setTimeout(() => { el.style.color = ''; }, 1000);
      });
    }
  } catch (error) {
    console.warn('Unable to connect to ISS data. Retrying...');
  }
}
