/* Shares the existing per-tab session; never stores passwords or logs credentials. */
(() => {
  const root=document.querySelector('[data-sidebar-account]'); if(!root?.dataset.api)return;
  const name=root.querySelector('[data-account-name]'),login=root.querySelector('[data-account-login]'),logout=root.querySelector('[data-account-logout]'),status=root.querySelector('[data-account-status]');
  let storage;try{storage=window.sessionStorage;}catch{storage={getItem:()=>null,removeItem:()=>{}};}
  const session=new window.BlogSession(root.dataset.api,storage),client=new window.BlogApiClient({base:root.dataset.api});
  let revision=0,dead=false,expiryTimer;
  function show(user){name.textContent=user?.nickname || (session.read()?'已登录':'未登录');login.hidden=!!user || !!session.read();logout.hidden=!login.hidden;}
  async function refresh(){
    const rev=++revision,token=session.read();show(null);if(!token)return;
    clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>{session.read();show(null);},Math.max(0,session.expires-Date.now())+50);
    try{const user=await client.request('/me/','GET',null,token);if(!dead&&rev===revision)show(user);}
    catch(error){if(dead||rev!==revision)return;if(error.status===401){session.clear();show(null);}status.textContent=error.message;}
  }
  window.addEventListener('blog:account',event=>{revision++;show(event.detail);});
  logout.addEventListener('click',async()=>{
    if(document.querySelector('.community')){window.dispatchEvent(new Event('blog:logout'));return;}
    logout.disabled=true;const token=session.read();let message='已退出登录。';
    try{if(token)await client.request('/logout/','POST',null,token);}catch(error){message=error.status===401?'已退出登录。':'已清除本标签页登录；服务端退出未确认。';}
    finally{session.clear();show(null);status.textContent=message;location.reload();}
  });
  window.addEventListener('pagehide',()=>{dead=true;clearTimeout(expiryTimer);client.destroy();},{once:true});
  refresh();
})();
