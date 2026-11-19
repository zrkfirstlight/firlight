// Original bounded, event-driven decoration; independent of article/API markup.
export function mountMotion(config, storage) {
  const abort = new AbortController();
  const on = (el, type, fn, options = {}) => el.addEventListener(type, fn, {...options, signal: abort.signal});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), pointer = matchMedia('(hover: hover) and (pointer: fine)'), mobile = matchMedia('(max-width: 767px)');
  let choice = true; try { choice = storage.getItem('blog.motion.v1') !== 'off'; } catch {}
  const button = document.getElementById('motion-toggle'), windowEl = document.querySelector('.ambience-window');
  let inView = false, frame = 0, particles = [], lastPoint = -Infinity, lastPosition, lastFrame = 0, canvas, ctx;
  const enabled = () => choice && !reduce.matches && !document.hidden;
  // The pointer trail is continuous across reading/controls and independent of
  // the background preference. Touch and reduced-motion remain motion-free.
  const trailEnabled = () => config.motion.trail && !reduce.matches && !document.hidden && pointer.matches;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; lastPosition = null; particles = []; if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight); };
  function background() { windowEl?.classList.toggle('is-visible', enabled() && inView && !mobile.matches); }
  function update() {
    document.documentElement.dataset.motion = choice && !reduce.matches ? 'on' : 'off';
    button?.setAttribute('aria-pressed', String(choice && !reduce.matches));
    const configured = config.motion.trail || config.motion.background || config.motion.sky?.enabled;
    if (button) button.textContent = !configured ? '动效：已停用' : reduce.matches ? '动效：系统已减少' : `动效：${choice ? '开' : '关'}`;
    if (button) button.disabled = reduce.matches || !configured;
    background(); if (!trailEnabled()) stop();
  }
  if (button) on(button, 'click', () => { choice = !choice; try { storage.setItem('blog.motion.v1', choice ? 'on' : 'off'); } catch {} update(); });
  on(reduce, 'change', update); on(pointer, 'change', update); on(mobile, 'change', update); on(document, 'visibilitychange', update);
  let observer;
  if (windowEl && 'IntersectionObserver' in window) { observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; background(); }); observer.observe(windowEl); }
  // No observer support: static fallback rather than off-screen animation.
  const intensity = Math.min(.9, Math.max(.05, Number(config.motion.intensity) || .68));
  const max = Math.min(48, Math.max(1, Number(config.motion.maxParticles) || 36));
  const life = Math.min(1200, Math.max(150, Number(config.motion.lifetimeMs) || 850));
  function size() {
    if (!canvas) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 2048 / Math.max(innerWidth, innerHeight), Math.sqrt(2000000 / (innerWidth * innerHeight)));
    canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); stop();
  }
  function draw(now) {
    frame = 0; if (!trailEnabled()) { stop(); return; }
    const dt = lastFrame ? Math.min(64, now - lastFrame) : 16; lastFrame = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight); particles = particles.filter(p => (p.age += dt) < life);
    for (const p of particles) {
      const fade = Math.pow(1-p.age/life, 1.5), glint = .6+.4*Math.pow(Math.sin(p.phase+p.age/95), 2);
      const alpha = fade*intensity*p.soft*glint, angle = p.angle+p.spin*p.age/1000;
      const x = p.x+p.dx*p.age/1000, y = p.y+p.dy*p.age/1000;
      ctx.beginPath();
      for (let i=0;i<p.vertices.length;i++) {
        const theta=angle+i*Math.PI*2/p.vertices.length, radius=p.radius*p.vertices[i];
        const px=x+Math.cos(theta)*radius, py=y+Math.sin(theta)*radius;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.fillStyle=`rgba(${p.color},${alpha})`;ctx.fill();
      // Soft amber edges keep the tiny sunrise stars visible without a glow.
      ctx.strokeStyle=`rgba(166,113,56,${alpha*.35})`;ctx.lineWidth=.5;ctx.stroke();
    }
    if (particles.length) frame = requestAnimationFrame(draw); else { lastFrame = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  if (config.motion.trail) {
    on(window, 'pointermove', e => {
      if (!trailEnabled() || e.pointerType === 'touch') return;
      if (e.timeStamp - lastPoint < 22) return; lastPoint = e.timeStamp;
      if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'star-trail'; canvas.setAttribute('aria-hidden', 'true'); document.body.append(canvas); ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); canvas = null; return; } size(); }
      const soft=e.target?.closest?.('input,textarea,select,form,.article-content,.community,.am-editor,[contenteditable]') ? .67 : 1;
      const origin=lastPosition||{x:e.clientX,y:e.clientY};
      for(let i=1;i<=2;i++) {
        if (particles.length >= max) particles.shift();
        // Four unequal tips with narrow valleys form irregular diamond stars.
        const vertices=Array.from({length:8},(_,j)=>j%2 ? .20+Math.random()*.12 : .76+Math.random()*.34);
        particles.push({x:origin.x+(e.clientX-origin.x)*i/2+(Math.random()-.5)*4,y:origin.y+(e.clientY-origin.y)*i/2+(Math.random()-.5)*4,age:0,radius:2+Math.random()*1.5,soft,vertices,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.8,phase:Math.random()*Math.PI,dx:(Math.random()-.5)*15,dy:4+Math.random()*10,color:['255,199,116','242,166,85','255,218,151'][Math.floor(Math.random()*3)]});
      }
      lastPosition={x:e.clientX,y:e.clientY};
      if (!frame) frame = requestAnimationFrame(draw);
    }, {passive:true});
    on(window, 'resize', size); on(document.documentElement, 'pointerleave', stop);
  }
  update();
  return () => { abort.abort(); observer?.disconnect(); stop(); canvas?.remove(); };
}
