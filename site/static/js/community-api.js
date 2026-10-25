/* Theme-independent JSON transport. No DOM selectors or browser storage. */
(() => {
  class BlogApiClient {
    constructor({base, timeoutMs = 6000}) {
      this.base = base.replace(/\/$/, '');
      this.timeoutMs = timeoutMs;
      this.controllers = new Set(); this.destroyed = false;
    }
    validateBase(pageProtocol) {
      if (!this.base) return '尚未配置动态服务地址；文章与搜索可正常使用。';
      let url;
      try { url = new URL(this.base); } catch { return '动态服务地址无效，请检查配置。'; }
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname) && pageProtocol === 'http:')) {
        return '正式网站必须连接 HTTPS API；仅本地 HTTP 预览允许 localhost。';
      }
      if (url.username || url.password || url.search || url.hash) return 'API 地址不能包含账号、查询参数或片段。';
      return null;
    }
    async request(path, method = 'GET', data, token = '') {
      if (this.destroyed) throw new Error('页面连接已关闭');
      if (!path.startsWith('/') || path.startsWith('//')) throw new Error('接口路径必须是相对 API 根地址的路径');
      const controller = new AbortController();
      this.controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.base + path, {
          method, credentials:'omit', cache:'no-store', signal:controller.signal,
          headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Token ${token}`} : {})},
          ...(data ? {body:JSON.stringify(data)} : {})
        });
        if (!response.ok) {
          let body = {}; try { body = await response.json(); } catch {}
          const details = Object.entries(body).map(([key,value]) => `${key === 'detail' ? '' : key+'：'}${Array.isArray(value) ? value.join('；') : typeof value === 'string' ? value : '输入无效'}`).join('；');
          const message=response.status>=500?'互动服务当前不可用，请稍后再试。':response.status===401?'登录已过期或无效，请重新登录。':response.status===429?'操作过于频繁，请稍后再试。':details || `请求失败 (${response.status})，请稍后重试。`;
          const error = new Error(message);
          error.status = response.status;
          error.unavailable = response.status>=500;
          throw error;
        }
        if(response.status===204)return null;
        try{return await response.json();}catch{const failure=new Error('互动服务当前不可用，请稍后再试。服务响应格式无效。');failure.unavailable=true;failure.status=502;throw failure;}
      } catch (error) {
        if (error.name === 'AbortError' || error instanceof TypeError) {
          const failure = new Error('互动服务当前不可用，请稍后再试。'+(error.name === 'AbortError' ? '连接超时；提交结果未确认，请重连后查看我的评论，避免重复提交。' : '网络请求失败；输入仍留在本页，提交结果未确认。'));
          failure.offline = true;
          throw failure;
        }
        throw error;
      } finally { clearTimeout(timer); this.controllers.delete(controller); }
    }
    destroy() { this.destroyed = true; for (const c of this.controllers) c.abort(); this.controllers.clear(); }
  }
  window.BlogApiClient = BlogApiClient;
})();
