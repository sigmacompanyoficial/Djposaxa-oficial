// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER ---
const counterElement = document.querySelector('.counter');
const loaderProgress = document.querySelector('.loader-progress');
const preloader = document.querySelector('.preloader');

let count = 0;
const updateCounter = () => {
    // Only run if preloader exists
    if (!counterElement || !preloader) return;

    count++;
    counterElement.textContent = count;
    if (loaderProgress) loaderProgress.style.width = count + '%';

    if (count < 100) {
        setTimeout(updateCounter, 20); // Adjust speed here
    } else {
        // Animation complete
        gsap.to(preloader, {
            yPercent: -100,
            duration: 1.5,
            ease: 'power4.inOut',
            delay: 0.5
        });

        // Start Hero Animation after preloader
        startHeroAnimation();
    }
};

// Start loading on page load
window.addEventListener('load', () => {
    updateCounter();
});


// --- CUSTOM CURSOR ---
const cursor = document.querySelector('.cursor');
const links = document.querySelectorAll('a, button, .feature-item, .gallery-item');

if (cursor) {
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: 'power2.out'
        });
    });

    links.forEach(link => {
        link.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        link.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
}

// --- HERO ANIMATION (Called after preloader) ---
function startHeroAnimation() {
    const heroTl = gsap.timeline();

    heroTl.from('.glitch-text', {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out',
        skewY: 7
    })
        .from('.subtitle', {
            opacity: 0,
            y: 20,
            duration: 1,
            ease: 'power2.out'
        }, '-=1');
}

// Parallax Hero BG
gsap.to('.hero-bg img', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    }
});

// --- EVENT REVEAL ---
gsap.from('.event-image-wrapper', {
    clipPath: 'inset(100% 0 0 0)',
    duration: 1.5,
    ease: 'power4.out',
    scrollTrigger: {
        trigger: '.section-event',
        start: 'top 70%'
    }
});

gsap.from('.event-image-wrapper img', {
    scale: 1.4,
    duration: 2,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '.section-event',
        start: 'top 70%'
    }
});

// --- BIO IMAGE REVEAL (For new layout) ---
gsap.from('.bio-image', {
    x: -50,
    opacity: 0,
    duration: 1.5,
    scrollTrigger: {
        trigger: '.section-bio',
        start: 'top 70%'
    }
});

gsap.from('.bio-content', {
    x: 50,
    opacity: 0,
    duration: 1.5,
    scrollTrigger: {
        trigger: '.section-bio',
        start: 'top 70%'
    }
});

// --- FEATURES/GALLERY STAGGER ---
gsap.from('.feature-item', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
        trigger: '.section-features',
        start: 'top 80%'
    }
});

gsap.from('.gallery-item', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    scrollTrigger: {
        trigger: '.section-gallery',
        start: 'top 80%'
    }
});

// --- TEXT SCRAMBLE EFFECT ---
const scrambleElements = document.querySelectorAll('[data-scramble]');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

scrambleElements.forEach(el => {
    el.addEventListener('mouseenter', event => {
        let iteration = 0;
        const originalText = event.target.dataset.value;

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

            iteration += 1 / 3;
        }, 30);
    });
});

// --- SCROLL MARQUEE (Left to Right) ---
gsap.fromTo('.marquee-content',
    { xPercent: -50 },
    { xPercent: 0, ease: 'none', duration: 15, repeat: -1 }
);

// --- PROCESS STEPS STAGGER ---
gsap.from('.process-step', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
        trigger: '.section-process',
        start: 'top 80%'
    }
});

// --- FAQ ACCORDION LOGIC ---
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
        item.classList.toggle('active');
    });
});

// --- BTS PHOTOS STAGGER REVEAL ---
gsap.from('.bts-photo', {
    scale: 0.8,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    scrollTrigger: {
        trigger: '.section-bts',
        start: 'top 75%'
    }
});

// --- TIMELINE ITEMS REVEAL ---
gsap.from('.timeline-item', {
    x: (index) => index % 2 === 0 ? -100 : 100,
    opacity: 0,
    duration: 1,
    stagger: 0.3,
    scrollTrigger: {
        trigger: '.section-timeline',
        start: 'top 70%'
    }
});

// Timeline dots scale
gsap.from('.timeline-dot', {
    scale: 0,
    duration: 0.5,
    stagger: 0.3,
    ease: 'back.out(2)',
    scrollTrigger: {
        trigger: '.section-timeline',
        start: 'top 70%'
    }
});

// --- TESTIMONIALS CARDS STAGGER ---
gsap.from('.testimonial-card', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    scrollTrigger: {
        trigger: '.section-testimonials',
        start: 'top 75%'
    }
});

// --- IMPACT NUMBERS COUNTER ANIMATION ---
const impactNumbers = document.querySelectorAll('.impact-number');

impactNumbers.forEach(num => {
    const target = parseInt(num.dataset.target);

    ScrollTrigger.create({
        trigger: num,
        start: 'top 80%',
        once: true,
        onEnter: () => {
            gsap.to(num, {
                textContent: target,
                duration: 2,
                ease: 'power1.out',
                snap: { textContent: 1 },
                onUpdate: function () {
                    num.textContent = Math.ceil(this.targets()[0].textContent);
                }
            });
        }
    });
});


// --- LENIS SMOOTH SCROLL (FASTER CONFIG) ---
const lenis = new Lenis({
    duration: 0.8, // Lower = faster/snappier (default ~1.2)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1.2, // Slightly higher sensitivity
    smoothTouch: false, // Default native scroll on touch devices is usually better/faster perception
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
