/* Only firlight's server-verified owner role may operate these panels. */
(() => {
 const root=document.querySelector('[data-owner-tools]');if(!root?.dataset.api)return;
 const $=s=>root.querySelector(s),client=new window.BlogApiClient({base:root.dataset.api});
 let storage;try{storage=sessionStorage;}catch{storage={getItem:()=>null,removeItem(){}};}
 const session=new window.BlogSession(root.dataset.api,storage);let busy=false,commentPage=1,userPage=1,retryAt=0,dead=false;
 const message=text=>{if(!dead)$('[data-owner-status]').textContent=text;};
 function node(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
 async function api(path,method='GET',data){const token=session.read();if(!token)throw Error('请先登录 firlight 账号。');try{return await client.request(path,method,data,token);}catch(e){if(e.status===401){session.clear();$('[data-owner-panels]').hidden=true;$('[data-owner-login]').hidden=false;}throw e;}}
 function action(fn){return async()=>{if(busy)return;busy=true;try{await fn();}catch(e){message(e.message);}finally{busy=false;}};}
 function button(target,label,fn){const b=node('button',label);b.type='button';b.onclick=action(fn);target.append(b);return b;}
 function pages(target,data,change){const nav=node('nav');nav.className='owner-pagination';if(data.previous)button(nav,'上一页',()=>change(-1));if(data.next)button(nav,'下一页',()=>change(1));target.append(nav);}
 async function comments(){
  const form=$('[data-comment-search]'),query=new URLSearchParams({manage:'1',page:commentPage,status:form.elements.status.value,q:form.elements.q.value});
  const data=await api('/comments/?'+query),target=$('[data-comments-list]');target.replaceChildren();
  if(!data.results.length)target.append(node('p','没有符合条件的评论。'));
  for(const c of data.results){const row=node('article');row.className='owner-row';row.append(node('strong',c.nickname+' · #'+c.id+(c.parent?' · 回复 #'+c.parent:'')),node('small',c.thread+' · '+new Date(c.created).toLocaleString()),node('p',c.body));
   const controls=node('div');controls.className='owner-actions';
   for(const [status,label] of [['approved','通过'],['hidden','隐藏'],['pending','待审核']]){if(c.status!==status)button(controls,label,async()=>{await api('/comments/'+c.id+'/','PATCH',{status});await comments();message('审核状态已更新。');});}
   button(controls,'删除',async()=>{if(!confirm('永久删除这条评论？回复将保留，不能通过此界面撤销。'))return;await api('/comments/'+c.id+'/','DELETE');await comments();message('评论已删除。');});row.append(controls);target.append(row);
  }pages(target,data,async n=>{commentPage+=n;await comments();});
 }
 async function users(){
  const data=await api('/users/?page='+userPage),target=$('[data-users-list]');target.replaceChildren();
  for(const u of data.results){const row=node('article');row.className='owner-row';row.append(node('strong',u.nickname+' · '+u.username),node('p',u.admin?'超级管理员':(u.active?'正常':'已停用')+' · '+(u.can_publish?'可管理自己的文章':'可参与评论')));
   if(!u.admin){const controls=node('div');controls.className='owner-actions';button(controls,u.active?'停用账号':'启用账号',async()=>{if(!confirm('确认调整此账号的使用状态？停用将撤销其登录。'))return;await api('/users/'+u.id+'/','PATCH',{active:!u.active});await users();message('账号状态已更新。');});button(controls,u.can_publish?'收回写作权限':'允许写作',async()=>{if(!confirm('调整此账号管理自己文章的权限？'))return;await api('/users/'+u.id+'/','PATCH',{can_publish:!u.can_publish});await users();message('写作权限已更新。');});row.append(controls);}target.append(row);
  }pages(target,data,async n=>{userPage+=n;await users();});
 }
 async function init(){if(Date.now()<retryAt)return;retryAt=Date.now()+5000;try{const user=await api('/me/');if(!user.admin)throw Error('此管理工具仅供 firlight 超级管理员使用。');$('[data-owner-panels]').hidden=false;$('[data-owner-login]').hidden=true;message('管理工具已连接。');await comments();await users();}catch(e){message(e.message);}}
 $('[data-comment-search]').addEventListener('submit',e=>{e.preventDefault();commentPage=1;action(comments)();});$('[data-load-users]').onclick=action(users);$('[data-owner-retry]').onclick=action(init);
 $('[data-new-user]').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;action(async()=>{try{await api('/users/','POST',{username:f.elements.username.value,nickname:f.elements.nickname.value,password:f.elements.password.value,can_publish:f.elements.can_publish.checked});f.reset();await users();message('朋友账号已创建；公开注册仍然关闭。');}finally{f.elements.password.value='';}})();});
 window.addEventListener('blog:account',()=>{if(!session.read()){$('[data-owner-panels]').hidden=true;message('请登录 firlight 账号。');}});
 window.addEventListener('pagehide',()=>{dead=true;client.destroy();},{once:true});init();
})();
