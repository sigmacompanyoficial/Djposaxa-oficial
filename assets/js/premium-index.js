document.addEventListener("DOMContentLoaded", function () {

    // 1. Native Smooth Scrolling Enforced
    document.documentElement.style.scrollBehavior = 'smooth';


    // Sync GSAP
    gsap.registerPlugin(ScrollTrigger);

    // 2. Custom Cursor
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
        });
        document.querySelectorAll('a, button, .event-card, .project-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 3, opacity: 0 });
                gsap.to(follower, { scale: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.1)' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, opacity: 1 });
                gsap.to(follower, { scale: 1, borderColor: 'rgba(255, 255, 255, 1)', backgroundColor: 'transparent' });
            });
        });
    }

    // 3. Hero Animations (Corporate Style)
    // Split text for hero lines
    if (document.querySelector('.hero-title')) {
        // Wrap content in lines if not present, or just split chars
        const typeSplit = new SplitType('.hero-title', { types: 'lines, chars' });

        const heroTl = gsap.timeline();
        heroTl.from(typeSplit.chars, {
            y: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.03,
            ease: "power4.out",
            delay: 0.2
        })
            .from('.hero-subtitle', { y: 20, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.5");
    }

    // 4. Bio Text Reveal (The "Scrub" effect requested)
    if (document.querySelector('.bio-text')) {
        const revealText = new SplitType('.bio-text', { types: 'words' });
        gsap.from(revealText.words, {
            scrollTrigger: {
                trigger: ".bio-section",
                start: "top 70%",
                end: "bottom 80%",
                scrub: true, // IMPORTANT: User specifically requested this
            },
            opacity: 0.1,
            stagger: 0.1
        });
    }

    // 5. Parallax Section
    if (document.querySelector('.hero-bg')) {
        gsap.to('.hero-bg', {
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            yPercent: 50,
            ease: "none"
        });
    }

    // 6. Horizontal Scroll (Features)
    // 6. Horizontal Scroll (Optimized)
    const horizontalSection = document.querySelector(".horizontal-scroll");
    if (horizontalSection) {
        const wrapper = horizontalSection.querySelector(".horizontal-wrap");
        if (wrapper) {
            let mm = gsap.matchMedia();

            // Desktop: Pin and scrub
            mm.add("(min-width: 769px)", () => {
                const xMove = -(wrapper.scrollWidth - window.innerWidth);

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: horizontalSection,
                        start: "top top",
                        end: () => "+=" + (wrapper.scrollWidth * 2), // SLOWER SCROLL (2x distance)
                        pin: true,
                        scrub: 1.5, // Smoother scrub
                        invalidateOnRefresh: true,
                    }
                });

                tl.to(wrapper, {
                    x: xMove,
                    ease: "none"
                });
            });

            // Mobile: Native scroll (cleanup if switching)
            mm.add("(max-width: 768px)", () => {
                // Should return a cleanup function if needed, but mainly just NOT adding the tween is enough.
                // We might want to ensure 'x' is reset if resizing window
                gsap.set(wrapper, { x: 0 });
            });
        }
    }

    // 7. Generic Scroll Reveal (Events / Timelines)
    const scrollReveals = document.querySelectorAll('.scroll-reveal, .timeline-item, .event-card');
    scrollReveals.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%", // Start earlier for better visibility
                toggleActions: "play none none none" // Play once, stay visible (no reverse)
            },
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 7. Color Changer
    const sections = document.querySelectorAll('[data-color]');
    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: "top 50%",
            end: "bottom 50%",
            onEnter: () => updateColor(section.dataset.color),
            onEnterBack: () => updateColor(section.dataset.color)
        });
    });

    function updateColor(color) {
        if (color === 'light') {
            gsap.to('body', { backgroundColor: '#ffffff', color: '#050505', duration: 0.5 });
            gsap.to('.nav', { color: '#050505', duration: 0.5 });
        } else {
            gsap.to('body', { backgroundColor: '#050505', color: '#ffffff', duration: 0.5 });
            gsap.to('.nav', { color: '#ffffff', duration: 0.5 });
        }
    }

});
