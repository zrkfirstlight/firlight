// Deterministic reduced-motion/visibility/idle/resource-limit regression, no DOM package.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code = await readFile(new URL('../site/static/js/motion-effects.js', import.meta.url), 'utf8');
const {mountMotion} = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
class Node extends EventTarget {
  constructor() { super(); this.dataset = {}; this.attrs = {}; this.style = {}; this.classes = new Set(); this.classList={toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)}; }
  setAttribute(k,v) { this.attrs[k]=String(v); }
}
const win = new Node(), doc = new Node(), button = new Node(), decoration = new Node();
globalThis.window = win; globalThis.document = doc; doc.hidden=false; doc.documentElement=new Node();
doc.querySelector = () => decoration; doc.getElementById=()=>button;
const canvases=[], frames=new Map(); let serial=0, drawCount=0, clears=0;
const ctx={setTransform(){},clearRect(){clears++;},beginPath(){},arc(){drawCount++;},fill(){}};
doc.createElement=()=>{const c=new Node(); c.getContext=()=>ctx; c.remove=()=>{const i=canvases.indexOf(c);if(i>=0)canvases.splice(i,1);};return c;};
doc.body={append:c=>canvases.push(c)};
globalThis.innerWidth=4000; globalThis.innerHeight=2000; globalThis.devicePixelRatio=4;
globalThis.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const media=new Map(); globalThis.matchMedia=query=>{if(!media.has(query)){const m=new Node();m.matches=query.includes('pointer: fine');media.set(query,m);}return media.get(query);};
let observer;
globalThis.IntersectionObserver=class {constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;} enter(v){this.fn([{isIntersecting:v}]);}};
win.IntersectionObserver=globalThis.IntersectionObserver;
const store=new Map(); const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
const cfg={motion:{trail:true,background:true,maxParticles:16,lifetimeMs:520,intensity:.32}};
const stop=mountMotion(cfg,storage);
function move(time,form=false,touch=false){const e=new Event('pointermove');Object.defineProperties(e,{timeStamp:{value:time},clientX:{value:10},clientY:{value:20},pointerType:{value:touch?'touch':'mouse'},target:{value:{closest:()=>form}}});win.dispatchEvent(e);}
function tick(time){const f=[...frames.values()];frames.clear();for(const fn of f)fn(time);}
observer.enter(true); assert.equal(decoration.classes.has('is-visible'),true);
for(let i=1;i<=100;i++)move(i*40); assert.equal(canvases.length,1); assert.equal(frames.size,1);
assert.ok(canvases[0].width<=2048); assert.ok(canvases[0].width*canvases[0].height<=2000000);
tick(0); assert.ok(drawCount<=16);
for(let i=1;i<=40;i++)tick(i*20); assert.equal(frames.size,0); // Idle becomes zero work.
move(5000); move(5040,true); assert.equal(frames.size,0); // Reading/form area clears immediately.
move(5100,false,true); assert.equal(frames.size,0); // Touch is ignored.
move(5200); doc.hidden=true; doc.dispatchEvent(new Event('visibilitychange')); assert.equal(frames.size,0); assert.equal(decoration.classes.has('is-visible'),false);
doc.hidden=false; doc.dispatchEvent(new Event('visibilitychange')); observer.enter(false); assert.equal(decoration.classes.has('is-visible'),false);
observer.enter(true); button.dispatchEvent(new Event('click')); assert.equal(doc.documentElement.dataset.motion,'off'); move(5300); assert.equal(frames.size,0); assert.equal(store.get('blog.motion.v1'),'off');
button.dispatchEvent(new Event('click')); const reduce=matchMedia('(prefers-reduced-motion: reduce)'); reduce.matches=true; reduce.dispatchEvent(new Event('change'));
assert.equal(button.disabled,true); assert.equal(doc.documentElement.dataset.motion,'off'); move(5400); assert.equal(frames.size,0); assert.equal(decoration.classes.has('is-visible'),false);
reduce.matches=false; reduce.dispatchEvent(new Event('change')); const pointer=matchMedia('(hover: hover) and (pointer: fine)');pointer.matches=false;pointer.dispatchEvent(new Event('change')); move(5500); assert.equal(frames.size,0);
pointer.matches=true; pointer.dispatchEvent(new Event('change')); move(5600); assert.equal(frames.size,1);
stop(); assert.equal(frames.size,0); assert.equal(canvases.length,0); assert.equal(observer.disconnected,true); move(5700); assert.equal(canvases.length,0); assert.ok(clears>0);
console.log('PASS: bounded particles/canvas, idle stop, form/reading/touch exclusion, hidden/offscreen pause, preference toggle, reduced motion, pointer policy, teardown.');
