/* API data only; no auth tokens, passwords or comment drafts in browser storage. */
(() => {
  const root=document.querySelector('.community'); if (!root) return;
  const $=s=>root.querySelector(s), accountOnly=root.dataset.kind==='account';
  const client=new window.BlogApiClient({base:root.dataset.api});
  let token='',user=null,online=false,busy=false,parent=null,page=1,next=false,registered=false,dead=false,revision=0;
  let mode=accountOnly?'mine':'public'; const list=$('.comment-list');
  const state=(message,kind=online?'online':'failed')=>{if(dead)return;root.dataset.state=kind;$('.service-status').textContent=message;};
  function resetUser(){token='';user=null;parent=null;mode=accountOnly?'mine':'public';page=1;$('.reply-status').textContent='';}
  function text(target,tag,value){const e=document.createElement(tag);e.textContent=value;target.append(e);return e;}
  function button(target,label,fn,write=false){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.write=String(write);b.disabled=write&&(!online||busy);b.addEventListener('click',()=>Promise.resolve().then(fn).catch(fail));target.append(b);return b;}
  function controls(){
    $('.auth-box').hidden=!!user;$('.profile-form').hidden=!user;
    $('.auth-form [data-mode="login"]').disabled=!online||busy;
    $('.auth-form [data-mode="register"]').hidden=!root.registration;
    $('.auth-form [data-mode="register"]').disabled=!online||busy||!root.registration;
    $('.registration-note').textContent=online?(root.registration?'注册已开放 · 阅读公开评论无需账号':'注册已关闭 · 已有账号仍可登录'):'';
    $('.profile-form button').disabled=!online||busy;
    $('[data-submit]').disabled=!online||busy||!user||!registered;
    $('[data-action="manage"]').hidden=!user?.admin;$('[data-action="users"]').hidden=!user?.admin;
    $('[data-action="mine"]').disabled=!user;
    root.querySelectorAll('[data-write="true"]').forEach(b=>b.disabled=!online||busy);
    $('.account').replaceChildren();
    if(user){text($('.account'),'strong',`${user.nickname} · ${user.username}${user.admin?' · 管理员':''}`);button($('.account'),'退出',logout);}
  }
  async function api(path,method='GET',data,auth=token){
    try{return await client.request(path,method,data,auth);}
    catch(e){
      if(e.status===401){resetUser();controls();}
      if(e.offline||e.status>=500){online=false;controls();}
      throw e;
    }
  }
  function fail(e){if(!dead)state(e.message,e.offline?'offline':'failed');}
  async function write(fn){if(!online||busy)return;busy=true;controls();try{await fn();}finally{busy=false;controls();}}
  async function logout(){
    let error;
    try{if(online)await api('/logout/','POST');else error=true;}catch(e){error=e;}
    resetUser();list.replaceChildren();controls();
    state(error?'已清除此页登录；服务端撤销结果未确认。':'已退出登录。');
    if(online)await load();
  }
  function query(){if(mode==='users')return `/users/?page=${page}`;return '/comments/?'+new URLSearchParams({page,...(mode==='public'?{thread:root.dataset.thread}:{[mode==='mine'?'mine':'manage']:'1'})});}
  async function load(){
    if(!online)return;
    $('.list-heading').textContent={public:'本页评论',mine:'我的评论',manage:'审核评论',users:'用户管理'}[mode];
    if((mode==='mine'||mode==='manage'||mode==='users')&&!user){list.replaceChildren();text(list,'p','登录后查看自己的记录。');return;}
    const mine=++revision;let result;
    try{result=await api(query());if(mode==='public')registered=true;}
    catch(e){if(e.status===404&&mode==='public'){registered=false;controls();}throw e;}
    if(mine!==revision||dead)return;next=!!result.next;list.replaceChildren();
    if(!result.results.length)text(list,'p','暂无记录。');
    for(const c of result.results){
      const article=document.createElement('article');article.dataset.record=String(c.id);list.append(article);
      if(mode==='users'){
        text(article,'p',`${c.nickname} / ${c.username} · ${c.active?'正常':'已禁用'}${c.admin?' · 管理员':''}`);
        if(!c.admin)button(article,c.active?'禁用用户':'启用用户',()=>write(async()=>{await api(`/users/${c.id}/`,'PATCH',{active:!c.active});await load();state('用户状态已更新。');}),true);
        continue;
      }
      text(article,'strong',`${c.nickname} · #${c.id}${c.parent?' 回复 #'+c.parent:''}`);
      text(article,'small',` · ${new Date(c.created).toLocaleString()} · ${{approved:'公开',pending:'待审核',hidden:'隐藏'}[c.status]}${mode!=='public'?' · '+c.thread:''}`);
      text(article,'p',c.body);
      if(user&&!accountOnly&&!c.parent&&c.status==='approved'&&mode==='public')button(article,'回复',()=>{parent=c.id;$('.reply-status').textContent=`正在回复 #${c.id}`;$('.comment-form textarea').focus();});
      if(user&&(c.author_id===user.id||user.admin)){
        button(article,'编辑',()=>edit(article,c));
        button(article,'删除',()=>{
          if(article.querySelector('.delete-confirm'))return;
          const box=document.createElement('div');box.className='delete-confirm';text(box,'p','确认永久删除这一条记录？回复不会连带删除。');article.append(box);
          button(box,'确认删除',()=>write(async()=>{await api(`/comments/${c.id}/`,'DELETE');await load();state('记录已删除。');}),true);button(box,'取消',()=>box.remove());
        });
      }
      if(user?.admin)for(const [status,label] of [['approved','通过'],['hidden','隐藏'],['pending','待审核']])button(article,label,()=>write(async()=>{await api(`/comments/${c.id}/`,'PATCH',{status});await load();state('审核状态已更新。');}),true);
    }
    $('[data-action="more"]').hidden=!next;controls();
  }
  function edit(article,c){
    if(article.querySelector('.comment-edit'))return;
    const form=document.createElement('form');form.className='comment-edit';const label=document.createElement('label');label.textContent='修改正文';
    const input=document.createElement('textarea');input.value=c.body;input.required=true;input.maxLength=3000;input.rows=4;label.append(input);form.append(label);article.append(form);
    const save=document.createElement('button');save.type='submit';save.textContent='保存修改';save.dataset.write='true';form.append(save);button(form,'取消编辑',()=>form.remove());
    form.addEventListener('submit',e=>{e.preventDefault();write(async()=>{await api(`/comments/${c.id}/`,'PATCH',{body:input.value});await load();state(user.admin?'修改已保存。':'修改已保存，等待重新审核。');}).catch(fail);});input.focus();
  }
  async function connect(){
    if(busy)return;online=false;registered=false;controls();state('连接中…','connecting');
    const invalid=client.validateBase(location.protocol);if(invalid){state(invalid,root.dataset.api?'failed':'unconfigured');return;}
    try{
      const h=await api('/health/','GET',null,'');if(h.api_version!==1)throw new Error('动态服务版本不兼容。');
      online=true;root.registration=h.registration_open;controls();state('动态服务正常 · 评论审核后公开');await load();
    }catch(e){fail(e);}
  }
  $('.auth-form').addEventListener('submit',e=>{
    e.preventDefault();const form=e.currentTarget,action=e.submitter?.dataset.mode||'login';
    const data={username:form.elements.username.value,password:form.elements.password.value};
    if(action==='register'&&form.elements.nickname.value)data.nickname=form.elements.nickname.value;
    write(async()=>{
      const result=await api(`/${action}/`,'POST',data,'');
      if(action==='login'){token=result.token;user=result.user;$('.profile-form input').value=user.nickname;page=1;controls();await load();state('登录成功 · 整页跳转或刷新后需重新登录。');}
      else state('注册成功，请使用刚才的账号登录。');
    }).catch(fail).finally(()=>{form.elements.password.value='';});
  });
  $('.profile-form').addEventListener('submit',e=>{e.preventDefault();const nickname=e.currentTarget.elements.nickname.value;write(async()=>{user=await api('/me/','PATCH',{nickname});controls();await load();state('昵称已保存。');}).catch(fail);});
  $('.comment-form').addEventListener('submit',e=>{
    e.preventDefault();if(!user||!registered)return;const form=e.currentTarget,body=form.elements.body.value;
    write(async()=>{await api('/comments/','POST',{thread:root.dataset.thread,body,parent});form.elements.body.value='';parent=null;$('.reply-status').textContent='';await load();state('提交成功，等待审核。');}).catch(fail);
  });
  root.addEventListener('click',e=>{
    const action=e.target.dataset.action;
    if(action==='retry')connect();
    if(action==='cancel-reply'){parent=null;$('.reply-status').textContent='';}
    if(['public','mine','manage','users'].includes(action)){mode=action;page=1;load().catch(fail);}
    if(action==='more'&&next){page++;load().catch(fail);}
  });
  window.addEventListener('offline',()=>{online=false;controls();state('浏览器离线，未发送输入只留在当前页面。','offline');});
  window.addEventListener('pagehide',()=>{dead=true;token='';client.destroy();},{once:true});
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  connect();
})();
