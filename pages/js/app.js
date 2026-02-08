(() => {
  // ------------------------------
  // IntersectionObserver for reveal animations
  // ------------------------------
  // Updated selector to find .reveal or the Fluent Glass Cards
  const reveals = document.querySelectorAll('.reveal, .fui-GlassCard');
  
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('revealed');
        
        // Trigger sheen for Fluent Glass structure
        const glass = el.classList.contains('fui-GlassCard') ? el : el.closest('.fui-GlassCard');
        if (glass) glass.classList.add('revealed');
        
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(r => io.observe(r));

  // ------------------------------
  // Hero parallax & Scroll logic
  // ------------------------------
  const hero = document.getElementById('hero');
  const bg = document.querySelector('.bg-layer');
  let scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        // Hero Parallax Logic
        if (bg && hero) {
          const rect = hero.getBoundingClientRect();
          const pct = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
          bg.style.transform = `translate3d(0, ${pct * -20}px, 0) scale(${1 + pct * 0.02})`;
        }
        
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // ------------------------------
  // Sheen micro-interaction for Fluent Glass cards
  // ------------------------------
  // Updated selector to target .fui-GlassCard
  document.querySelectorAll('.fui-GlassCard').forEach(card => {
    // Note: If using the ::before sheen from CSS, you may need a physical 
    // .sheen element inside the card if you want mouse-tracking.
    const sheen = card.querySelector('.sheen');
    if (!sheen) return;

    let mouseTicking = false;
    card.addEventListener('pointermove', e => {
      if (!mouseTicking) {
        window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          // Subtle tilt/shift effect for the liquid surface
          sheen.style.transform = `translate3d(${(x - 0.5) * 25}px, ${(y - 0.5) * 25}px, 0)`;
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    });
  });

  // ------------------------------
  // Mobile menu toggle (Fluent Style)
  // ------------------------------
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
      // Adding ARIA support for Fluent accessibility standards
      const isHidden = menu.classList.contains('hidden');
      btn.setAttribute('aria-expanded', !isHidden);
    });
  }

  // ------------------------------
  // External Actions
  // ------------------------------
  // Updated to include .fui-ActionButton
  document.querySelectorAll('.fui-ActionButton, .action-btn, .join-now, .report-now').forEach(btn => {
    btn.addEventListener('click', () => {
      window.open('https://discord.gg/QbbnNPacMZ', '_blank');
    });
  });

  // ------------------------------
  // Generate starfield dots
  // ------------------------------
  (function makeStars(){
    const field = document.querySelector('.starfield');
    if(!field) return;
    const count = 60;
    const fragment = document.createDocumentFragment(); // Performance optimization
    
    for(let i=0; i<count; i++){
      const s = document.createElement('span');
      s.style.left = Math.random()*100 + '%';
      s.style.top = Math.random()*100 + '%';
      s.style.animationDelay = (Math.random()*6).toFixed(2) + 's';
      s.style.opacity = (0.3 + Math.random()*0.7).toFixed(2);
      fragment.appendChild(s);
    }
    field.appendChild(fragment);
  })();

})();