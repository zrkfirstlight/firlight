// Original CSS sky: a bounded DOM, no continuous JavaScript drawing or timers.
export function mountSky(config, storage) {
  const cfg=config.motion?.sky;
  if(!cfg?.enabled)return ()=>{};
  const abort=new AbortController(), reduce=matchMedia('(prefers-reduced-motion: reduce)'), mobile=matchMedia('(max-width: 767px)');
  const roots=[...document.querySelectorAll('[data-sky]')], visible=new Set();
  const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
  const stars=Math.round(clamp(cfg.stars,8,56,36)), meteors=Math.round(clamp(cfg.meteors,0,3,2));
  let saved=true;try{saved=storage.getItem('blog.motion.v1')!=='off';}catch{}
  function update(){
    const enabled=document.documentElement.dataset.motion ? document.documentElement.dataset.motion==='on' : saved;
    for(const root of roots)root.classList.toggle('sky-running',enabled&&!reduce.matches&&!document.hidden&&visible.has(root)&&!(mobile.matches&&root.dataset.sky==='margin'));
  }
  for(const root of roots){
    root.style.setProperty('--sky-opacity',String(clamp(cfg.opacity,.1,.65,.42)));
    root.style.setProperty('--sky-drift',`${clamp(cfg.driftSeconds,40,160,80)}s`);
    const fragment=document.createDocumentFragment(),count=root.dataset.sky==='margin'?stars:12;
    // Fixed distribution: no noisy layout changes between navigations.
    for(let i=0;i<count;i++){
      const dot=document.createElement('i');dot.className='sky-dot';
      dot.style.cssText=`--x:${(i*37+11)%100}%;--y:${(i*61+7)%100}%;--phase:-${i*2.7}s;--size:${i%5===0?2:1}px`;
      fragment.append(dot);
    }
    for(let i=0;i<meteors;i++){
      const tail=document.createElement('i');tail.className='sky-meteor';
      tail.style.cssText=`--x:${30+i*35}%;--y:${12+i*21}%;--period:${23+i*14}s;--phase:-${7+i*12}s`;
      fragment.append(tail);
    }
    root.append(fragment);
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries){entry.isIntersecting?visible.add(entry.target):visible.delete(entry.target);}update();}):null;
  roots.forEach(root=>observer?.observe(root)); // Without observation support, remain static.
  const changes=new MutationObserver(update);changes.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  for(const [node,event] of [[document,'visibilitychange'],[reduce,'change'],[mobile,'change']])node.addEventListener(event,update,{signal:abort.signal});
  update();
  return ()=>{abort.abort();observer?.disconnect();changes.disconnect();for(const root of roots){root.classList.remove('sky-running');root.replaceChildren();}visible.clear();};
}
