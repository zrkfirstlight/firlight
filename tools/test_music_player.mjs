// No npm packages: deterministic media-policy/lifecycle tests with a fake audio device.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code = await readFile(new URL('../site/static/js/music-player.js', import.meta.url), 'utf8');
const {MusicPlayer, safeMediaURL} = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
class Element extends EventTarget {
  constructor() { super(); this.attrs = {}; this.children = []; this.value = ''; this.textContent = ''; }
  setAttribute(k,v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  append(e) { this.children.push(e); }
  replaceChildren() { this.children = []; }
  querySelectorAll() { return this.children.flatMap(li => li.children); }
  click() { this.dispatchEvent(new Event('click')); }
}
globalThis.document = {createElement: () => new Element()};
class AudioDevice extends Element {
  constructor() { super(); this.paused = true; this.duration = NaN; this.currentTime = 0; this.loads = 0; this.plays = 0; }
  getAttribute(k) { return this.attrs[k] || null; }
  set src(v) { this.attrs.src = v; }
  load() { this.loads++; this.duration = NaN; this.currentTime = 0; }
  async play() { this.plays++; if (this.reject) throw Object.assign(new Error('blocked'), {name: this.reject}); this.paused = false; this.dispatchEvent(new Event('playing')); }
  pause() { if (!this.paused) { this.paused = true; this.dispatchEvent(new Event('pause')); } }
  metadata(seconds = 120) { this.duration = seconds; this.dispatchEvent(new Event('loadedmetadata')); }
}
const tracks = ['后来','恋如雨止','侧脸'].map((title,i) => ({id:String(i), title, src:`/project/audio/test-${i}.wav`, cover:'', artist:''}));
function fixture(config = {tracks}, saved = {}) {
  const map = new Map(), root = {querySelector:s => { if (!map.has(s)) map.set(s, new Element()); return map.get(s); }};
  let data = JSON.stringify(saved); const storage = {getItem:()=>data,setItem:(_,v)=>{data=v;}}; const audio = new AudioDevice();
  const player = new MusicPlayer(root,config,{audio,storage,base:'http://localhost:1313/project/'});
  return {player,audio,q:root.querySelector,stored:()=>JSON.parse(data)};
}
const flush = () => new Promise(resolve => setTimeout(resolve,0));
{
  const f = fixture({tracks},{id:'1',time:37,volume:.25,muted:true});
  assert.equal(f.audio.plays,0); assert.equal(f.audio.loads,0); assert.equal(f.audio.getAttribute('src'),null);
  assert.equal(f.player.index,1); assert.equal(f.audio.volume,.25); assert.equal(f.audio.muted,true);
  await f.player.play(); f.audio.metadata(); assert.equal(f.audio.currentTime,37);
  f.q('[data-play]').click(); assert.equal(f.audio.paused,true);
  f.q('[data-play]').click(); await flush(); assert.equal(f.audio.paused,false);
  f.q('[data-seek]').value='52'; f.q('[data-seek]').dispatchEvent(new Event('input')); assert.equal(f.audio.currentTime,52);
  f.q('[data-volume]').value='.8'; f.q('[data-volume]').dispatchEvent(new Event('input')); f.q('[data-mute]').click();
  assert.equal(f.stored().volume,.8); assert.equal(f.stored().muted,false);
  f.q('[data-next]').click(); await flush(); assert.equal(f.player.index,2); assert.equal(f.audio.paused,false);
  f.audio.dispatchEvent(new Event('ended')); await flush(); assert.equal(f.player.index,0); assert.equal(f.audio.paused,false);
  f.q('[data-prev]').click(); await flush(); assert.equal(f.player.index,2);
  const playCount=f.audio.plays; f.audio.metadata(); f.audio.currentTime=19; f.player.destroy();
  assert.equal(f.stored().time,19); assert.equal(f.audio.paused,true); assert.equal(f.audio.getAttribute('src'),null);
  f.q('[data-play]').click(); await f.player.play(); assert.equal(f.audio.plays,playCount);
}
{
  const f = fixture(); f.audio.reject='NotAllowedError'; await f.player.play();
  assert.match(f.q('[data-status]').textContent,/浏览器阻止/); assert.equal(f.audio.paused,true); assert.equal(f.audio.plays,1);
  const oldLoads=f.audio.loads;
  f.audio.reject='NotSupportedError'; await f.player.play(); assert.match(f.q('[data-status]').textContent,/播放失败/); assert.equal(f.audio.loads,oldLoads+1);
  f.audio.dispatchEvent(new Event('error')); assert.match(f.q('[data-status]').textContent,/加载失败/);
  f.audio.dispatchEvent(new Event('pause')); assert.match(f.q('[data-status]').textContent,/加载失败/); // Native pause is queued after error.
  await flush(); assert.equal(f.audio.plays,2); f.player.destroy();
}
{
  const f=fixture({tracks:tracks.map(t=>({...t,src:''}))}); await f.player.play();
  assert.equal(f.audio.plays,0); assert.equal(f.q('[data-play]').disabled,true); assert.match(f.q('[data-status]').textContent,/音源待配置/);
  f.q('[data-next]').click(); assert.equal(f.player.index,1); assert.equal(f.audio.loads,1); assert.equal(f.audio.getAttribute('src'),null); f.player.destroy();
}
{
  const f=fixture({tracks:[tracks[0],{...tracks[1],src:''},tracks[2]]}); await f.player.play(); f.audio.dispatchEvent(new Event('ended')); await flush();
  assert.equal(f.player.index,1); assert.equal(f.audio.paused,true); assert.equal(f.audio.plays,1); f.player.destroy();
}
assert.equal(safeMediaURL('javascript:alert(1)','https://site.test/'),'');
assert.equal(safeMediaURL('http://other.test/a.mp3','https://site.test/'),'');
assert.equal(safeMediaURL('audio/a.mp3','https://site.test/project/'),'https://site.test/project/audio/a.mp3');
console.log('PASS: no autoplay/download, restore, transport, seek, volume/mute, ordered loop, denied/error states, missing source, destroy cleanup, URL policy.');
