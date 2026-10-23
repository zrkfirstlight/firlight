import {nextGeneration} from './life-engine.js';
document.querySelectorAll('.life-lab').forEach(root=>{
  const abort=new AbortController(),on=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  const w=44,h=28;let grid=new Uint8Array(w*h),generation=0,running=false,frame=0,last=0;
  const status=root.querySelector('[data-life-status]'),play=root.querySelector('[data-life-play]');
  function paint(){
    const dpr=Math.min(devicePixelRatio||1,2),scale=12;canvas.width=w*scale*dpr;canvas.height=h*scale*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#21324a';ctx.fillRect(0,0,w*scale,h*scale);ctx.fillStyle='#adcae4';let population=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(grid[y*w+x]){ctx.fillRect(x*scale+1,y*scale+1,scale-2,scale-2);population++;}
    status.textContent=`第${generation}代 · ${population}个亮格 · ${running?'运行中':'已暂停'}`;play.textContent=running?'暂停':'开始';
  }
  function pause(){running=false;cancelAnimationFrame(frame);frame=0;last=0;paint();}
  function step(){grid=nextGeneration(grid,w,h);generation++;paint();}
  function reset(){pause();grid.fill(0);generation=0;const presets={glider:[[1,0],[2,1],[0,2],[1,2],[2,2]],blinker:[[0,1],[1,1],[2,1]],block:[[0,0],[1,0],[0,1],[1,1]]};for(const [x,y] of presets[root.querySelector('select').value])grid[(y+12)*w+x+20]=1;paint();}
  function animate(now){if(!running)return;if(!last||now-last>=160){step();last=now;}frame=requestAnimationFrame(animate);}
  on(play,'click',()=>{if(running)pause();else{running=true;frame=requestAnimationFrame(animate);paint();}});
  on(root.querySelector('[data-life-step]'),'click',()=>{pause();step();});on(root.querySelector('[data-life-reset]'),'click',reset);on(root.querySelector('select'),'change',reset);
  on(root.querySelector('[data-life-clear]'),'click',()=>{pause();grid.fill(0);generation=0;paint();});
  on(canvas,'click',e=>{pause();const r=canvas.getBoundingClientRect(),x=Math.min(w-1,Math.max(0,Math.floor((e.clientX-r.left)/r.width*w))),y=Math.min(h-1,Math.max(0,Math.floor((e.clientY-r.top)/r.height*h)));grid[y*w+x]^=1;paint();});
  on(document,'visibilitychange',()=>{if(document.hidden)pause();});
  let observer;if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();});observer.observe(root);}
  on(window,'pagehide',()=>{pause();observer?.disconnect();abort.abort();});reset();
});
