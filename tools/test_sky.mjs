import assert from 'node:assert/strict';
import {mountSky} from '../site/static/js/sky-effects.js';
class Node extends EventTarget {
  constructor(kind){super();this.dataset={sky:kind};this.children=[];this.classes=new Set();this.style={setProperty(){}};this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k),remove:k=>this.classes.delete(k)};}
  append(node){this.children.push(...(node.fragment?node.children:[node]));}replaceChildren(){this.children=[];}
}
const roots=[new Node('margin'),new Node('local')],doc=new Node(),html=new Node();html.dataset.motion='on';
globalThis.document=doc;doc.documentElement=html;doc.hidden=false;doc.querySelectorAll=()=>roots;doc.createElement=()=>new Node();doc.createDocumentFragment=()=>Object.assign(new Node(),{fragment:true});
const media=new Map();globalThis.matchMedia=q=>{if(!media.has(q))media.set(q,Object.assign(new Node(),{matches:false}));return media.get(q);};
let intersection,mutation;
globalThis.window={IntersectionObserver:true};
globalThis.IntersectionObserver=class{constructor(fn){this.fn=fn;intersection=this;}observe(){}disconnect(){this.closed=true;}enter(value){this.fn(roots.map(target=>({target,isIntersecting:value})));}};
globalThis.MutationObserver=class{constructor(fn){this.fn=fn;mutation=this;}observe(){}disconnect(){this.closed=true;}};
const config={motion:{sky:{enabled:true,stars:999,meteors:999}}};
let stop=mountSky(config,{getItem:()=>null});assert.equal(roots[0].children.length,59);assert.equal(roots[1].children.length,15);
intersection.enter(true);assert.ok(roots.every(root=>root.classes.has('sky-running')));
doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.ok(roots.every(root=>!root.classes.has('sky-running')));
doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));intersection.enter(false);assert.ok(roots.every(root=>!root.classes.has('sky-running')));
intersection.enter(true);html.dataset.motion='off';mutation.fn();assert.ok(roots.every(root=>!root.classes.has('sky-running')));
html.dataset.motion='on';mutation.fn();const reduce=media.get('(prefers-reduced-motion: reduce)');reduce.matches=true;reduce.dispatchEvent(new Event('change'));assert.ok(roots.every(root=>!root.classes.has('sky-running')));
reduce.matches=false;const mobile=media.get('(max-width: 767px)');mobile.matches=true;mobile.dispatchEvent(new Event('change'));assert.ok(!roots[0].classes.has('sky-running'));assert.ok(roots[1].classes.has('sky-running'));
stop();assert.ok(intersection.closed&&mutation.closed);assert.ok(roots.every(root=>root.children.length===0&&!root.classes.has('sky-running')));
stop=mountSky(config,{getItem:()=>null});assert.equal(roots[0].children.length,59);stop();
console.log('PASS: sky bounds, visibility/offscreen/reduced-motion/shared switch, mobile reduction, remount and listener cleanup.');
