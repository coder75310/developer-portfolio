/**
 * Portfolio v4.1 — Performance-Optimized
 * Single rAF loop, single mousemove/scroll handler, GPU-accelerated transforms
 */

(function () {
    'use strict';

    // ============================================
    // BROWSER DETECTION — Firefox performance overrides
    // ============================================

    if (typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf('Firefox') !== -1) {
        document.body.classList.add('is-firefox');
    }

    // ============================================
    // SHARED STATE — Single source of truth
    // ============================================

    var mouseX = -100, mouseY = -100;
    var scrollY = 0;
    var docHeight = 1;
    var isTouch = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;

    // ============================================
    // ELEMENT REFS — Cache once
    // ============================================

    var mouseGlow = document.getElementById('mouseGlow');
    var scrollProgressBar = document.querySelector('.scroll-progress-bar');
    var header = document.getElementById('header');
    var glassCards = document.querySelectorAll('.glass-card');
    var tiltCards = document.querySelectorAll('[data-tilt]');
    var codeWindow = document.querySelector('.code-window.tilt-card');
    var projectCards = document.querySelectorAll('.project-showcase');
    var magneticEls = document.querySelectorAll('.magnetic');
    var mouseGlowActive = false;
    var headerScrolled = false;

    // ============================================
    // SINGLE MOUSEMOVE HANDLER
    // ============================================

    var mouseMoved = false;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        mouseMoved = true;
    }, { passive: true });

    if (mouseGlow) {
        document.addEventListener('mouseleave', function () {
            mouseGlowActive = false;
            mouseGlow.classList.remove('active');
        });
    }

    // ============================================
    // MAGNETIC BUTTONS — individual mousemove (lightweight)
    // ============================================

    magneticEls.forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var rect = btn.getBoundingClientRect();
            var x = e.clientX - rect.left - rect.width / 2;
            var y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = 'translate3d(' + (x * 0.25) + 'px,' + (y * 0.25) + 'px,0)';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = '';
        });
    });

    // ============================================
    // TILT CARDS — individual mousemove (only fire when hovering)
    // ============================================

    tiltCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var rx = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 6;
            var ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 6;
            card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px) scale(1.02)';
        });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });

    if (codeWindow) {
        codeWindow.addEventListener('mousemove', function (e) {
            var rect = codeWindow.getBoundingClientRect();
            var ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4;
            var rx = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 4;
            codeWindow.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        });
        codeWindow.addEventListener('mouseleave', function () { codeWindow.style.transform = ''; });
    }

    // Card shine — individual mousemove
    glassCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            card.style.setProperty('--shine-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
            card.style.setProperty('--shine-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
        });
    });

    // Project spotlight
    projectCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
            card.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
        });
    });

    // ============================================
    // SINGLE SCROLL HANDLER — rAF throttled
    // ============================================

    var scrollTicking = false;
    var scrollPauseTimer = null;
    var bgAnimEls = document.querySelectorAll('.aurora, .gradient-orb, .morph-blob, .hero-glow-ring');

    window.addEventListener('scroll', function () {
        if (!scrollTicking) {
            // Pause background CSS animations during scroll
            for (var b = 0; b < bgAnimEls.length; b++) {
                bgAnimEls[b].style.animationPlayState = 'paused';
            }
            requestAnimationFrame(onScroll);
            scrollTicking = true;
        }
        // Resume animations 150ms after scrolling stops
        clearTimeout(scrollPauseTimer);
        scrollPauseTimer = setTimeout(function () {
            for (var b = 0; b < bgAnimEls.length; b++) {
                bgAnimEls[b].style.animationPlayState = '';
            }
        }, 150);
    }, { passive: true });

    function onScroll() {
        scrollY = window.scrollY;
        docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Scroll progress bar — use scaleX (compositor-only, no layout)
        if (scrollProgressBar) {
            var progress = docHeight > 0 ? scrollY / docHeight : 0;
            scrollProgressBar.style.transform = 'scaleX(' + progress + ')';
        }

        // Header scroll state
        var shouldScroll = scrollY > 50;
        if (shouldScroll !== headerScrolled) {
            headerScrolled = shouldScroll;
            header.classList.toggle('scrolled', shouldScroll);
        }

        scrollTicking = false;
    }

    // ============================================
    // SINGLE rAF LOOP — Mouse Glow
    // ============================================

    if (mouseGlow) {
        (function glowTick() {
            if (mouseMoved) {
                mouseMoved = false;
                if (!mouseGlowActive && mouseX > 0) {
                    mouseGlowActive = true;
                    mouseGlow.classList.add('active');
                }
                mouseGlow.style.transform = 'translate3d(' + (mouseX - 200) + 'px,' + (mouseY - 200) + 'px,0)';
            }
            requestAnimationFrame(glowTick);
        })();
    }

    // ============================================
    // CONSTELLATION — Optimized (30 particles, spatial skip)
    // ============================================

    var canvas = document.getElementById('constellation');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var particles = [];
        var PCOUNT = 20;
        var CONN_DIST = 100;
        var CONN_DIST_SQ = CONN_DIST * CONN_DIST;
        var MOUSE_DIST = 150;
        var MOUSE_DIST_SQ = MOUSE_DIST * MOUSE_DIST;
        var cAnimId;
        var cRunning = false;
        var cFrameSkip = 0;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        for (var k = 0; k < PCOUNT; k++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                o: Math.random() * 0.4 + 0.2
            });
        }

        // Pre-create style strings
        var particleColor = 'rgba(129,140,248,';
        var lineColor = 'rgba(129,140,248,';
        var mouseLineColor = 'rgba(52,211,153,';

        function drawFrame() {
            // Render every other frame
            cFrameSkip++;
            if (cFrameSkip & 1) {
                if (cRunning) cAnimId = requestAnimationFrame(drawFrame);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = 0; i < PCOUNT; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                else if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                else if (p.y > canvas.height) p.y = 0;

                // Mouse attraction (squared distance, no sqrt)
                var dx = mouseX - p.x;
                var dy = mouseY - p.y;
                var distSq = dx * dx + dy * dy;
                if (distSq < MOUSE_DIST_SQ) {
                    p.vx += dx * 0.00006;
                    p.vy += dy * 0.00006;
                }

                p.vx *= 0.998;
                p.vy *= 0.998;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                ctx.fillStyle = particleColor + p.o + ')';
                ctx.fill();

                // Connections (only check forward, use squared distance)
                for (var j = i + 1; j < PCOUNT; j++) {
                    var p2 = particles[j];
                    var cdx = p.x - p2.x;
                    var cdy = p.y - p2.y;
                    var cdSq = cdx * cdx + cdy * cdy;
                    if (cdSq < CONN_DIST_SQ) {
                        var alpha = (1 - Math.sqrt(cdSq) / CONN_DIST) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = lineColor + alpha + ')';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }

                // Mouse line
                if (distSq < MOUSE_DIST_SQ) {
                    var mAlpha = (1 - Math.sqrt(distSq) / MOUSE_DIST) * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = mouseLineColor + mAlpha + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            if (cRunning) cAnimId = requestAnimationFrame(drawFrame);
        }

        var canvasObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                if (!cRunning) { cRunning = true; drawFrame(); }
            } else {
                cRunning = false;
                cancelAnimationFrame(cAnimId);
            }
        });
        canvasObs.observe(canvas);
    }

    // ============================================
    // SCROLL REVEAL
    // ============================================

    var revealObs = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) entries[i].target.classList.add('visible');
        }
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

    // ============================================
    // ACTIVE NAV TRACKING
    // ============================================

    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');

    var navObs = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                var id = entries[i].target.id;
                navLinks.forEach(function (link) {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        }
    }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(function (s) { navObs.observe(s); });

    // ============================================
    // SMOOTH SCROLL
    // ============================================

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            var target = document.querySelector(href);
            if (target) {
                var offset = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 20;
                window.scrollTo({ top: offset, behavior: 'smooth' });
            }
            if (navLinksEl && navLinksEl.classList.contains('active')) {
                navLinksEl.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });

    // ============================================
    // MOBILE MENU
    // ============================================

    var menuToggle = document.querySelector('.mobile-menu-toggle');
    var navLinksEl = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            navLinksEl.classList.toggle('active');
        });
    }

    document.addEventListener('click', function (e) {
        if (navLinksEl && navLinksEl.classList.contains('active') &&
            !navLinksEl.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinksEl.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinksEl && navLinksEl.classList.contains('active')) {
            navLinksEl.classList.remove('active');
            menuToggle.classList.remove('active');
            menuToggle.focus();
        }
    });

    // ============================================
    // COUNTER ANIMATION
    // ============================================

    var counters = document.querySelectorAll('.stat-number[data-count]');
    var countersAnimated = false;

    var counterObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !countersAnimated) {
            countersAnimated = true;
            counters.forEach(function (counter) {
                var target = parseInt(counter.getAttribute('data-count'), 10);
                var start = performance.now();
                (function update(now) {
                    var p = Math.min((now - start) / 2000, 1);
                    counter.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
                    if (p < 1) requestAnimationFrame(update);
                })(start);
            });
        }
    }, { threshold: 0.5 });

    var heroStats = document.querySelector('.hero-stats');
    if (heroStats) counterObs.observe(heroStats);

    // ============================================
    // TYPEWRITER
    // ============================================

    document.querySelectorAll('.typewriter').forEach(function (el) {
        var text = el.getAttribute('data-text');
        if (!text) return;
        var idx = 0;
        el.textContent = '';
        var twObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                twObs.disconnect();
                (function type() {
                    if (idx < text.length) {
                        el.textContent += text.charAt(idx++);
                        setTimeout(type, 40 + Math.random() * 30);
                    }
                })();
            }
        }, { threshold: 0.5 });
        twObs.observe(el);
    });

    // ============================================
    // CONTACT FORM
    // ============================================

    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = this.querySelector('button[type="submit"]');
            var orig = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            setTimeout(function () {
                btn.innerHTML = '<span>Message Sent!</span> <i class="fas fa-check"></i>';
                btn.style.background = '#34d399';
                setTimeout(function () {
                    btn.innerHTML = orig;
                    btn.style.background = '';
                    btn.disabled = false;
                    contactForm.reset();
                }, 2500);
            }, 1500);
        });
    }
})();