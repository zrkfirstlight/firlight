/* Native audio controller. No credentials, third-party requests or autoplay. */
const KEY = 'blog.music.v1';
const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const icons = {
  play:svg('<path d="m8 5 11 7-11 7Z"/>'),
  pause:svg('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'),
  list:svg('<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3m5 11H6l3 3M20 8v3M4 16v-3"/></g>'),
  shuffle:svg('<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h3c5 0 6 12 11 12h4m-3-3 3 3-3 3M3 18h3c5 0 6-12 11-12h4m-3-3 3 3-3 3"/></g>'),
  single:svg('<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3-3m5 11H6l3 3M20 8v3M4 16v-3M11 10l1-1v6"/></g>')
};
const modes = ['list','shuffle','single'];
const modeNames = {list:'列表循环',shuffle:'随机播放',single:'单曲循环'};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const clock = n => `${Math.floor((Number.isFinite(n) ? n : 0) / 60)}:${String(Math.floor((Number.isFinite(n) ? n : 0) % 60)).padStart(2, '0')}`;
export function safeMediaURL(value, base) {
  if (!value) return '';
  try {
    const u = new URL(value, base);
    // Local assets follow the page origin. Remote media must use HTTPS.
    return u.protocol === 'https:' || (u.origin === new URL(base).origin && ['http:', 'https:'].includes(u.protocol)) ? u.href : '';
  } catch { return ''; }
}
export class MusicPlayer {
  constructor(root, config, {audio = new Audio(), storage = window.localStorage, base = document.baseURI} = {}) {
    this.base = base; this.root = root; this.audio = audio; this.storage = storage; this.abort = new AbortController(); this.generation = 0;
    this.tracks = (config.tracks || []).map(t => ({...t, src: safeMediaURL(t.src, base), cover: safeMediaURL(t.cover, base)}));
    this.q = s => root.querySelector(s); this.index = 0; this.lastSave = 0; this.resume = 0; this.dead = false; this.failure = '';
    let saved = {};
    try { saved = JSON.parse(storage.getItem(KEY) || '{}') || {}; } catch { /* Private browsing/storage denied: use defaults. */ }
    this.mode = modes.includes(saved.mode) ? saved.mode : 'list';
    const remembered = this.tracks.findIndex(t => t.id === saved.id);
    if (remembered >= 0) { this.index = remembered; this.resume = Number.isFinite(saved.time) ? Math.max(0, saved.time) : 0; }
    audio.preload = 'none'; audio.loop = false;
    audio.volume = Number.isFinite(saved.volume) ? clamp(saved.volume, 0, 1) : .6;
    audio.muted = saved.muted === true;
    this.on = (el, type, fn) => el.addEventListener(type, fn, {signal: this.abort.signal});
    this.q('[data-volume]').value = audio.volume;
    this.on(this.q('[data-play]'), 'click', () => audio.paused ? this.play() : audio.pause());
    this.on(this.q('[data-prev]'), 'click', () => this.select(this.index - 1, !audio.paused));
    this.on(this.q('[data-next]'), 'click', () => this.select(this.nextIndex(), !audio.paused));
    this.on(this.q('[data-mode]'), 'click', () => { this.mode=modes[(modes.indexOf(this.mode)+1)%modes.length]; this.renderMode(); this.save(); });
    this.on(this.q('[data-current]'), 'click', () => { this.renderInfo(); this.q('[data-info]').showModal(); });
    this.on(this.q('[data-info-close]'), 'click', () => this.q('[data-info]').close());
    this.on(this.q('[data-volume]'), 'input', e => { audio.volume = Number(e.target.value); this.save(); });
    this.on(this.q('[data-mute]'), 'click', () => { audio.muted = !audio.muted; this.renderMute(); this.save(); });
    this.on(this.q('[data-cover]'), 'error', e => { e.currentTarget.hidden = true; });
    this.on(this.q('[data-seek]'), 'input', e => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) { audio.currentTime = clamp(Number(e.target.value), 0, audio.duration); this.resume = audio.currentTime; this.updateTime(); this.save(); }
    });
    const list = this.q('[data-playlist]'); list.replaceChildren();
    this.tracks.forEach((t, i) => {
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      b.textContent = `${t.title}${t.src ? '' : ' · 音源待配置'}`;
      this.on(b, 'click', () => this.select(i, !audio.paused)); li.append(b); list.append(li);
    });
    this.on(audio, 'loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) { audio.currentTime = clamp(this.resume, 0, Math.max(0, audio.duration - .1)); this.resume = 0; }
      this.updateTime();
    });
    this.on(audio, 'timeupdate', () => { this.updateTime(); if (Date.now() - this.lastSave > 5000) this.save(); });
    this.on(audio, 'playing', () => { this.state('正在播放'); this.renderPlay(true,'暂停'); });
    this.on(audio, 'waiting', () => this.state('正在缓冲…'));
    this.on(audio, 'pause', () => { if (!this.dead && audio.paused) { this.state(this.failure || '已暂停'); this.renderPlay(false,'继续播放'); this.save(); } });
    this.on(audio, 'error', () => this.failed('加载失败，请检查音源；可手动重试。'));
    this.on(audio, 'ended', () => this.select(this.nextIndex(true), true));
    this.render(); this.renderMute(); this.renderMode();
  }
  state(text) { this.q('[data-status]').textContent = text; this.q('[data-mini]').textContent = text; }
  render() {
    this.failure = '';
    const t = this.tracks[this.index];
    const current=this.q('[data-current]'); current.textContent = t?.title || '音乐';
    current.setAttribute('title',t?.title || '歌曲信息'); this.renderInfo(); this.renderPlay(false,'播放');
    this.q('[data-artist]').textContent = t?.artist || '';
    const cover = this.q('[data-cover]'); cover.hidden = !t?.cover;
    if (t?.cover) cover.src = t.cover; else cover.removeAttribute('src');
    this.q('[data-play]').disabled = !t?.src;
    this.q('[data-prev]').disabled = this.q('[data-next]').disabled = this.tracks.length < 2;
    this.q('[data-seek]').disabled = true; this.q('[data-seek]').value = 0;
    this.q('[data-time]').textContent = `${clock(this.resume)} / 0:00`;
    this.q('[data-playlist]').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-current', String(i === this.index)));
    this.state(t?.src ? (this.resume ? '已恢复曲目与进度 · 点击继续' : '待播放 · 点击开始') : '音源待配置');
  }
  nextIndex(ended = false) {
    if (ended && this.mode === 'single') return this.index;
    if (this.mode === 'shuffle' && this.tracks.length > 1) return (this.index + 1 + Math.floor(Math.random() * (this.tracks.length - 1))) % this.tracks.length;
    return this.index + 1;
  }
  renderPlay(playing,label) {
    const button=this.q('[data-play]'); button.innerHTML=icons[playing?'pause':'play']; button.setAttribute('aria-label',label); button.setAttribute('title',label);
    this.root.classList?.toggle('is-playing',playing);
  }
  renderMode() { const button=this.q('[data-mode]'); button.innerHTML=icons[this.mode]; button.setAttribute('aria-label',modeNames[this.mode]); button.setAttribute('title',modeNames[this.mode]); }
  renderInfo() {
    const t=this.tracks[this.index];
    this.q('[data-info-title]').textContent=t?.title || '音乐'; this.q('[data-info-artist]').textContent=t?.artist || '';
    const cover=this.q('[data-info-cover]'); cover.hidden=!t?.cover; if(t?.cover)cover.src=t.cover;
    const source=this.q('[data-info-source]'); const url=safeMediaURL(t?.source,this.base); source.hidden=!url; if(url)source.setAttribute('href',url);
  }
  renderMute() { const b = this.q('[data-mute]'); b.textContent = this.audio.muted ? '取消静音' : '静音'; b.setAttribute('aria-pressed', String(this.audio.muted)); }
  select(index, autoplay = false) {
    if (!this.tracks.length || this.dead) return;
    this.generation++; this.audio.pause(); this.index = (index + this.tracks.length) % this.tracks.length; this.resume = 0;
    this.audio.removeAttribute('src'); this.audio.load(); this.render(); this.save();
    if (autoplay) this.play();
  }
  async play() {
    const t = this.tracks[this.index]; if (!t?.src || this.dead) return;
    const generation = ++this.generation, retry = Boolean(this.failure); this.failure = '';
    if (retry || this.audio.getAttribute('src') !== t.src) { this.audio.src = t.src; this.audio.load(); }
    this.state('正在加载…');
    try { await this.audio.play(); }
    catch (e) {
      if (generation !== this.generation || this.dead) return;
      this.failed(e.name === 'NotAllowedError' ? '浏览器阻止了播放，请再次点击播放。' : '播放失败，请检查音源后手动重试。');
    }
  }
  failed(message) { if (this.dead) return; this.failure = message; this.audio.pause(); this.renderPlay(false,'播放'); this.q('[data-play]').setAttribute('title',message); this.state(message); }
  updateTime() {
    const a = this.audio, valid = Number.isFinite(a.duration) && a.duration > 0;
    const seek = this.q('[data-seek]'); seek.disabled = !valid; seek.max = valid ? a.duration : 100; seek.value = valid ? a.currentTime : 0;
    this.q('[data-time]').textContent = `${clock(a.currentTime)} / ${clock(a.duration)}`;
  }
  save() {
    const t = this.tracks[this.index]; if (!t) return;
    const a = this.audio, time = a.getAttribute('src') ? a.currentTime : this.resume;
    try { this.storage.setItem(KEY, JSON.stringify({id: t.id, time: Number.isFinite(time) ? time : 0, volume: a.volume, muted: a.muted, mode:this.mode})); } catch { /* Optional preference storage. */ }
    this.lastSave = Date.now();
  }
  destroy() {
    if (this.dead) return;
    this.save(); this.dead = true; this.generation++; this.abort.abort(); this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load();
  }
}
