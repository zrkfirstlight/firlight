/* Per-tab credentials only. No password, profile or comment draft is stored. */
(() => {
  class BlogSession {
    constructor(base, storage = window.sessionStorage, now = () => Date.now()) {
      this.base = base.replace(/\/$/, ''); this.storage = storage; this.now = now;
      this.key = 'blog.auth.v1'; this.expires = 0;
    }
    clear() { this.expires = 0; try { this.storage.removeItem(this.key); } catch {} }
    read() {
      try {
        const v = JSON.parse(this.storage.getItem(this.key));
        if (!v || v.base !== this.base || !/^[a-f0-9]{40}$/.test(v.token) ||
            !Number.isFinite(v.expires) || v.expires <= this.now() || v.expires > this.now() + 28800000) {
          this.clear(); return '';
        }
        this.expires = v.expires; return v.token;
      } catch { this.clear(); return ''; }
    }
    save(token, seconds) {
      this.expires = this.now() + Math.min(28800, Math.max(0, Number(seconds) || 0)) * 1000;
      try { this.storage.setItem(this.key, JSON.stringify({base:this.base, token, expires:this.expires})); return true; }
      catch { return false; }
    }
  }
  window.BlogSession = BlogSession;
})();
