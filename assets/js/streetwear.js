// Register Plugins
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER & HERO ANIME.JS ---
const counterElement = document.querySelector('.counter');
const loaderProgress = document.querySelector('.loader-progress');
const preloader = document.querySelector('.preloader');

let count = 0;
const updateCounter = () => {
    if (!counterElement || !preloader) return;

    count++;
    counterElement.textContent = count;
    if (loaderProgress) loaderProgress.style.width = count + '%';

    if (count < 100) {
        setTimeout(updateCounter, 15);
    } else {
        // Anime.js Preloader Exit - Always hide preloader
        anime({
            targets: preloader,
            translateY: '-100%',
            easing: 'easeInOutExpo',
            duration: 1200,
            delay: 500,
            complete: () => {
                preloader.style.display = 'none'; // Ensure it's hidden
                startHeroAnime(); // Start hero animation if elements exist
            }
        });
    }
};

window.addEventListener('load', () => {
    updateCounter();
});

// --- HERO ANIMATION (ANIME.JS) ---
function startHeroAnime() {
    // Only animate if elements exist
    const heroLines = document.querySelectorAll('.hero-title .line');
    const heroFooter = document.querySelector('.hero-footer');

    if (heroLines.length > 0) {
        anime({
            targets: '.hero-title .line',
            translateY: [100, 0],
            opacity: [0, 1],
            skewY: [10, 0],
            easing: 'easeOutElastic(1, .6)',
            duration: 1800,
            delay: anime.stagger(150)
        });
    }

    if (heroFooter) {
        anime({
            targets: '.hero-footer',
            opacity: [0, 1],
            translateY: [20, 0],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: 800
        });
    }
}

// --- PARALLAX (GSAP is best for scroll scrub) ---
gsap.to('.hero-bg img', {
    yPercent: 30,
    ease: 'none',
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

// --- CUSTOM CURSOR & MAGNETIC (ANIME.JS) ---
// Using pure Anime.js for smoother tick
const cursor = document.querySelector('.cursor');
const magneticBtns = document.querySelectorAll('.btn-ticket, .nav-link');

if (cursor && window.innerWidth > 992) {
    document.addEventListener('mousemove', (e) => {
        // Very fast easing for cursor
        anime({
            targets: cursor,
            translateX: e.clientX,
            translateY: e.clientY,
            easing: 'linear', // Immediate follow
            duration: 0
        });
    });

    // Magnetic Links
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            anime({
                targets: btn,
                translateX: x * 0.4,
                translateY: y * 0.4,
                easing: 'easeOutElastic(1, .5)',
                duration: 800
            });
        });

        btn.addEventListener('mouseleave', () => {
            anime({
                targets: btn,
                translateX: 0,
                translateY: 0,
                easing: 'easeOutElastic(1, .5)',
                duration: 600
            });
        });
    });

    // Scale on Hover
    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
}

// --- VISUAL REVEALS (ANIME.JS + INTERSECTION OBSERVER) ---
// We use IntersectionObserver to trigger Anime.js timelines

const observeAnime = (selector, animationOpts) => {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Play animation
                anime({
                    targets: entry.target,
                    ...animationOpts
                });
                observer.unobserve(entry.target); // Run once
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));
};

// 1. Narrative Text
observeAnime('.narrative-text', {
    translateY: [50, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1500
});

// 2. Info Panels (Staggered Children if any, or just self)
observeAnime('.event-info', {
    translateX: [-50, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1200
});

// 3. Grid Items (Stagger) - Complex case, observe wrapper
const grid = document.querySelector('.archive-grid');
if (grid) {
    const gridObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anime({
                    targets: '.archive-item',
                    translateY: [100, 0],
                    opacity: [0, 1],
                    easing: 'easeOutExpo',
                    delay: anime.stagger(150),
                    duration: 1200
                });
                gridObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    gridObserver.observe(grid);
}

// --- TEXT SCRAMBLE (Vanilla + Anime helper) ---
const scrambleElements = document.querySelectorAll('[data-scramble]');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

scrambleElements.forEach(el => {
    el.addEventListener('mouseenter', event => {
        const originalText = event.target.dataset.scramble || event.target.innerText;
        let iteration = 0;

        // Anime.js object for value tweening could be used, but setInterval is fine for raw text
        let interval = setInterval(() => {
            event.target.innerText = event.target.innerText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return letters[Math.floor(Math.random() * 26)]
                })
                .join("");

            if (iteration >= originalText.length) {
                clearInterval(interval);
            }
            iteration += 1 / 2;
        }, 30);
    });
});
