// Original bounded, event-driven decoration; independent of article/API markup.
export function mountMotion(config, storage) {
  const abort = new AbortController();
  const on = (el, type, fn, options = {}) => el.addEventListener(type, fn, {...options, signal: abort.signal});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), pointer = matchMedia('(hover: hover) and (pointer: fine)'), mobile = matchMedia('(max-width: 767px)');
  let choice = true; try { choice = storage.getItem('blog.motion.v1') !== 'off'; } catch {}
  const button = document.getElementById('motion-toggle'), windowEl = document.querySelector('.ambience-window');
  let inView = false, frame = 0, particles = [], lastPoint = 0, lastFrame = 0, canvas, ctx;
  const enabled = () => choice && !reduce.matches && !document.hidden;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; particles = []; if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight); };
  function background() { windowEl?.classList.toggle('is-visible', enabled() && inView && !mobile.matches); }
  function update() {
    document.documentElement.dataset.motion = choice && !reduce.matches ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(choice && !reduce.matches));
    const configured = config.motion.trail || config.motion.background;
    button.textContent = !configured ? '动效：已停用' : reduce.matches ? '动效：系统已减少' : `动效：${choice ? '开' : '关'}`;
    button.disabled = reduce.matches || !configured;
    background(); if (!enabled() || !pointer.matches) stop();
  }
  on(button, 'click', () => { choice = !choice; try { storage.setItem('blog.motion.v1', choice ? 'on' : 'off'); } catch {} update(); });
  on(reduce, 'change', update); on(pointer, 'change', update); on(mobile, 'change', update); on(document, 'visibilitychange', update);
  let observer;
  if (windowEl && 'IntersectionObserver' in window) { observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; background(); }); observer.observe(windowEl); }
  // No observer support: static fallback rather than off-screen animation.
  const intensity = Math.min(.5, Math.max(.05, Number(config.motion.intensity) || .32));
  const max = Math.min(24, Math.max(1, Number(config.motion.maxParticles) || 16));
  const life = Math.min(800, Math.max(150, Number(config.motion.lifetimeMs) || 520));
  function size() {
    if (!canvas) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 2048 / Math.max(innerWidth, innerHeight), Math.sqrt(2000000 / (innerWidth * innerHeight)));
    canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); stop();
  }
  function draw(now) {
    frame = 0; if (!enabled() || !pointer.matches) { stop(); return; }
    const dt = lastFrame ? Math.min(64, now - lastFrame) : 16; lastFrame = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight); particles = particles.filter(p => (p.age += dt) < life);
    for (const p of particles) { ctx.beginPath(); ctx.fillStyle = `rgba(126,157,202,${(1-p.age/life)*intensity})`; ctx.arc(p.x, p.y - p.age / 160, p.radius, 0, Math.PI*2); ctx.fill(); }
    if (particles.length) frame = requestAnimationFrame(draw); else { lastFrame = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  if (config.motion.trail) {
    on(window, 'pointermove', e => {
      if (!enabled() || !pointer.matches || e.pointerType === 'touch') return;
      if (e.target.closest('a,button,input,textarea,select,form,.article-content,.community,[contenteditable]')) { stop(); return; }
      if (e.timeStamp - lastPoint < 35) return; lastPoint = e.timeStamp;
      if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'star-trail'; canvas.setAttribute('aria-hidden', 'true'); document.body.append(canvas); ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); canvas = null; return; } size(); }
      if (particles.length >= max) particles.shift(); particles.push({x:e.clientX,y:e.clientY,age:0,radius:1 + Math.random()});
      if (!frame) frame = requestAnimationFrame(draw);
    }, {passive:true});
    on(window, 'resize', size); on(document.documentElement, 'pointerleave', stop);
  }
  update();
  return () => { abort.abort(); observer?.disconnect(); stop(); canvas?.remove(); };
}
