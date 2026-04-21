document.addEventListener("DOMContentLoaded", function () {

    // 1. Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync ScrollTrigger with Lenis
    gsap.registerPlugin(ScrollTrigger);

    // 2. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    // Only init cursor if elements exist
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
        });

        const interactables = document.querySelectorAll('a, button, .project-card');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 3, opacity: 0 });
                gsap.to(follower, { scale: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.1)' });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, opacity: 1 });
                gsap.to(follower, { scale: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' });
            });
        });
    }

    // 3. Hero Animation
    const heroTl = gsap.timeline();

    // Split text for hero lines
    new SplitType('.hero-title .line', { types: 'lines, chars' });

    heroTl.from('.hero-title .line .char', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: "power4.out",
        delay: 0.5
    })
        .from('.hero-subtitle', {
            y: 20,
            opacity: 0,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5")
        .from('.scroll-indicator', {
            opacity: 0,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5");

    // 4. Text Reveal Animation
    const revealText = new SplitType('.reveal-text', { types: 'words' });

    gsap.from(revealText.words, {
        scrollTrigger: {
            trigger: ".intro",
            start: "top 70%",
            end: "bottom 80%",
            scrub: true,
        },
        opacity: 0.1,
        stagger: 0.1
    });

    // 5. Parallax Section
    gsap.to('.parallax-bg', {
        scrollTrigger: {
            trigger: ".parallax-section",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        },
        yPercent: 30, // Move background slower than scroll
        ease: "none"
    });

    // 6. Horizontal Scroll Section
    const horizontalWrap = document.querySelector('.horizontal-wrap');

    // Calculate scroll amount based on width
    const getScrollAmount = () => -(horizontalWrap.scrollWidth - window.innerWidth);

    const tween = gsap.to(horizontalWrap, {
        x: getScrollAmount,
        ease: "none",
    });

    ScrollTrigger.create({
        trigger: ".horizontal-scroll",
        start: "top top",
        end: () => `+=${getScrollAmount() * -1}`, // Adjust end based on scroll width
        pin: true,
        animation: tween,
        scrub: 1,
        invalidateOnRefresh: true,
        // markers: true // for debugging
    });

    // 7. Grid Animation (Fade and Scale In)
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 8. Footer Reveal
    gsap.from('.footer h2', {
        scrollTrigger: {
            trigger: ".footer",
            start: "top 70%",
        },
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out"
    });

    // Background color change based on section data-color
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
        } else { // dark or black
            const bg = color === 'black' ? '#000000' : '#050505';
            gsap.to('body', { backgroundColor: bg, color: '#ffffff', duration: 0.5 });
            gsap.to('.nav', { color: '#ffffff', duration: 0.5 });
        }
    }

});
