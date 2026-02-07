// DJ Posaxa - Opiniones interactions
(function(){
  const cards = Array.from(document.querySelectorAll('.card'));

  // Stagger reveal delay
  cards.forEach((card, i)=>{
    card.style.transitionDelay = `${Math.min(i*70, 400)}ms`;
    card.classList.add('reveal');
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:.15 });
  cards.forEach(c=> io.observe(c));

  // Gradient spotlight follows mouse on hover
  const root = document.documentElement;
  function onMove(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    e.currentTarget.style.setProperty('--mx', `${x}%`);
  }
  cards.forEach(card=>{
    card.addEventListener('mousemove', onMove);
  });

  // Subtle tilt for image figure
  document.querySelectorAll('.figure').forEach(fig=>{
    let raf = null;
    function handle(e){
      const r = fig.getBoundingClientRect();
      const cx = e.clientX - r.left; const cy = e.clientY - r.top;
      const rx = ((cy/r.height)-.5)*-6; // rotateX
      const ry = ((cx/r.width)-.5)*6;   // rotateY
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        fig.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    }
    function reset(){ fig.style.transform = 'perspective(800px)'; }
    fig.addEventListener('mousemove', handle);
    fig.addEventListener('mouseleave', reset);
  });

  // Smooth scroll for nav links (same page anchors)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id.length>1){
        const el = document.querySelector(id);
        if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });
})();