/* No credentials, tokens, or drafts are written to browser storage. */
(() => {
  const root = document.querySelector('.community');
  if (!root) return;
  const $ = s => root.querySelector(s);
  const base = root.dataset.api.replace(/\/$/, '');
  const client = new window.BlogApiClient({base});
  let token = '', user = null, online = false, parent = null, mode = 'public', page = 1, next = false;
  const status = $('.service-status'), list = $('.comment-list');
  function message(s) { status.textContent = s; }
  function controls() {
    root.querySelectorAll('.auth-form button').forEach(b => b.disabled = !online || (b.dataset.mode === 'register' && !root.registration));
    $('[data-submit]').disabled = !online || !user;
    $('.auth-box').hidden = !!user;
    $('[data-action="manage"]').hidden = !user?.admin;
    $('[data-action="users"]').hidden = !user?.admin;
    $('.account').replaceChildren();
    if (user) {
      $('.account').append(document.createTextNode(`已登录：${user.nickname}（${user.username}） `));
      button($('.account'), '修改昵称', async () => {
        const nickname = prompt('新昵称（最多 40 字）', user.nickname);
        if (nickname) { user = await api('/me/', 'PATCH', {nickname}); controls(); }
      });
      button($('.account'), '退出', async () => { await api('/logout/', 'POST'); token = ''; user = null; controls(); await load(); });
    }
  }
  async function api(path, method = 'GET', data) {
    try {
      return await client.request(path, method, data, token);
    } catch (error) {
      if (error.status === 401) { token = ''; user = null; controls(); }
      if (error.offline || error.status >= 500) { online = false; controls(); }
      throw error;
    }
  }
  function fail(e) { message(e.message); }
  function button(target, text, action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = text;
    b.addEventListener('click', () => Promise.resolve().then(action).catch(fail)); target.append(b); return b;
  }
  function text(target, tag, value) { const e = document.createElement(tag); e.textContent = value; target.append(e); return e; }
  async function connect() {
    online = false; controls();
    if (!base) { message('尚未配置动态服务地址；文章与搜索可正常使用。'); return; }
    const invalid = client.validateBase(location.protocol);
    if (invalid) { message(invalid); return; }
    message('连接中…');
    try { const h = await api('/health/'); online = true; root.registration = h.registration_open; controls(); message('动态服务正常 · 评论审核后公开'); await load(); } catch(e) { fail(e); }
  }
  function query() {
    if (mode === 'users') return `/users/?page=${page}`;
    const q = new URLSearchParams({page, ...(mode === 'public' ? {thread: root.dataset.thread} : {[mode === 'mine' ? 'mine' : 'manage']: '1'})});
    return '/comments/?' + q;
  }
  async function load() {
    if (!online) return;
    const result = await api(query()); next = !!result.next;
    list.replaceChildren();
    if (!result.results.length) text(list, 'p', '暂无记录。');
    for (const c of result.results) {
      const article = document.createElement('article'); list.append(article);
      if (mode === 'users') {
        text(article,'p',`${c.nickname} / ${c.username} · ${c.active ? '正常' : '已禁用'}${c.admin ? ' · 管理员' : ''}`);
        if (!c.admin) button(article,c.active ? '禁用用户' : '启用用户',async()=>{await api(`/users/${c.id}/`,'PATCH',{active:!c.active}); await load();});
        continue;
      }
      text(article,'strong',`${c.nickname} · #${c.id}${c.parent ? ` 回复 #${c.parent}` : ''}`);
      text(article,'small',` · ${new Date(c.created).toLocaleString()} · ${c.status === 'approved' ? '公开' : c.status === 'pending' ? '待审核' : '隐藏'}${mode !== 'public' ? ' · '+c.thread : ''}`);
      text(article,'p',c.body);
      if (user && !c.parent && c.status === 'approved') button(article,'回复',()=>{parent=c.id; $('.reply-status').textContent=`正在回复 #${c.id}`; $('.comment-form textarea').focus();});
      if (user && (c.author_id === user.id || user.admin)) {
        button(article,'编辑',async()=>{const body=prompt('修改正文；普通用户修改后需重新审核',c.body); if(body) {await api(`/comments/${c.id}/`,'PATCH',{body}); await load();}});
        button(article,'删除',async()=>{if(confirm('永久删除这条评论？')) {await api(`/comments/${c.id}/`,'DELETE'); await load();}});
      }
      if (user?.admin) for (const [state,label] of [['approved','通过'],['hidden','隐藏'],['pending','待审核']]) button(article,label,async()=>{await api(`/comments/${c.id}/`,'PATCH',{status:state}); await load();});
    }
    $('[data-action="more"]').hidden = !next;
  }
  $('.auth-form').addEventListener('submit', async e => {
    e.preventDefault(); if (!online) return;
    const form = e.currentTarget, data = Object.fromEntries(new FormData(form));
    if (!data.nickname) delete data.nickname;
    const action = e.submitter.dataset.mode;
    try {
      const result = await api(`/${action}/`,'POST',data);
      if (action === 'login') { token = result.token; user = result.user; controls(); await load(); message('登录成功。刷新页面后需要重新登录。'); }
      else message('注册成功，请登录。');
    } catch(e) { fail(e); } finally { form.elements.password.value = ''; }
  });
  $('.comment-form').addEventListener('submit',async e=>{
    e.preventDefault(); if(!online || !user) return;
    const form=e.currentTarget; $('[data-submit]').disabled=true;
    try { await api('/comments/','POST',{thread:root.dataset.thread,body:form.elements.body.value,parent}); form.elements.body.value=''; parent=null; $('.reply-status').textContent=''; await load(); message('提交成功，等待审核。'); }
    catch(e) {fail(e);} finally {controls();}
  });
  root.addEventListener('click',e=>{
    const action=e.target.dataset.action;
    if(action==='retry') connect();
    if(action==='cancel-reply') {parent=null; $('.reply-status').textContent='';}
    if(['public','mine','manage','users'].includes(action)) {mode=action; page=1; load().catch(fail);}
    if(action==='more' && next) {page++; load().catch(fail);}
  });
  window.addEventListener('offline',()=>{online=false; controls(); message('浏览器已离线，未发送输入仍留在当前页面。');});
  connect();
})();
