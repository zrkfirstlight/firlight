// Scroll changes mist height and color opacity independently; no translated image.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const smooth=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
export function dawnState(progress) {
  const p=clamp(Number(progress)||0,0,2);
  const rise=smooth(p/1.6),mist=smooth(p/2);
  return {mistY:72-50*mist,night:1-rise,mist:1-.62*mist};
}
export function mountDawn(config) {
  const layer=document.querySelector('.dawn-backdrop');
  if(!layer||!config.motion.dawn?.enabled)return()=>{};
  const abort=new AbortController(),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const on=(el,type,fn)=>el.addEventListener(type,fn,{passive:true,signal:abort.signal});
  const active=()=>!reduce.matches&&document.documentElement.dataset.motion!=='off';
  let target=0,current=0,frame=0,previous=0;
  function paint(p){
    const s=dawnState(p);
    for(const [key,value] of Object.entries({'--mist-y':s.mistY.toFixed(3)+'%',
      '--night-opacity':s.night.toFixed(4),'--mist-opacity':s.mist.toFixed(4)}))layer.style.setProperty(key,value);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;previous=0;}
  function draw(now){
    frame=0;if(document.hidden)return;
    const dt=previous?clamp(now-previous,1,64):16;previous=now;
    current+=(target-current)*(1-Math.exp(-dt/110));
    if(Math.abs(target-current)<.0005){current=target;previous=0;}else frame=requestAnimationFrame(draw);
    paint(current);
  }
  function update(snap=false){
    target=active()?clamp(scrollY/Math.max(1,innerHeight),0,2):2;
    if(document.hidden){stop();return;}
    if(snap||!active()){stop();current=target;paint(current);}
    else if(!frame&&Math.abs(target-current)>=.0005)frame=requestAnimationFrame(draw);
  }
  on(window,'scroll',()=>update());on(window,'resize',()=>update(true));
  on(document,'visibilitychange',()=>update(true));on(reduce,'change',()=>update(true));
  const observer=new MutationObserver(()=>update(true));
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  update(true);
  return()=>{abort.abort();observer.disconnect();stop();};
}
