/* Login and service status only. Reuses the existing eight-hour tab session. */
(() => {
  const root=document.querySelector('[data-account-access]');if(!root)return;
  const $=selector=>root.querySelector(selector),form=$('.account-login-form'),retry=$('[data-account-retry]');
  const client=new window.BlogApiClient({base:root.dataset.api});
  let storage;try{storage=window.sessionStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error();},removeItem(){}};}
  const session=new window.BlogSession(root.dataset.api,storage);
  let token=session.read(),user=null,online=false,busy=false,checking=false,dead=false,retryAt=0,retryTimer,expiryTimer;
  function network(message,state){if(dead)return;root.dataset.state=state;$('[data-connection-status]').textContent=message;}
  function message(value){if(!dead)$('[data-login-status]').textContent=value;}
  function render(){
    if(dead)return;
    form.hidden=!!token;$('.account-session').hidden=!token;
    form.querySelector('button').disabled=!online||busy||checking;
    $('[data-account-exit]').disabled=busy;
    $('[data-current-account]').textContent=token?(user?`已登录 · ${user.nickname || user.username}`:'登录状态待确认'):'';
    const ownerEntry=$('[data-owner-entry]');if(ownerEntry)ownerEntry.hidden=!user?.admin;
    window.dispatchEvent(new CustomEvent('blog:account',{detail:user?{nickname:user.nickname || user.username}:null}));
  }
  function clear(){session.clear();token='';user=null;clearTimeout(expiryTimer);render();}
  function expire(){clearTimeout(expiryTimer);if(!token)return;expiryTimer=setTimeout(()=>{clear();message('登录已过期，请重新登录。');},Math.max(0,session.expires-Date.now()));}
  async function request(path,method='GET',data,anonymous=false){
    try{
      if(!anonymous&&(!token||session.expires<=Date.now())){clear();throw Object.assign(new Error('登录已过期，请重新登录。'),{status:401});}
      return await client.request(path,method,data,anonymous?'':token);
    }catch(error){
      if(!anonymous&&error.status===401)clear();
      if(error.offline||error.unavailable){online=false;network('互动服务当前不可用，请稍后再试。','offline');render();}
      throw error;
    }
  }
  async function check(){
    if(checking||busy||Date.now()<retryAt)return;
    checking=true;retry.disabled=true;retryAt=Date.now()+5000;clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{if(!dead&&!checking)retry.disabled=false;},5000);
    online=false;network('正在连接互动服务…','connecting');render();
    try{
      const invalid=client.validateBase(location.protocol);if(invalid)throw new Error(invalid);
      const result=await request('/health/','GET',null,true);
      if(result.api_version!==1)throw new Error('互动服务版本不兼容，请稍后再试。');
      online=true;network('互动服务可用','online');
      if(token){try{user=await request('/me/');expire();}catch(error){message(error.message);}}
    }catch(error){if(!dead){network(error.offline||error.unavailable?'互动服务当前不可用，请稍后再试。':error.message,error.offline||error.unavailable?'offline':'failed');}}
    finally{checking=false;if(Date.now()>=retryAt)retry.disabled=false;render();}
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!online||busy||checking)return;
    busy=true;message('正在登录…');render();
    try{
      const result=await request('/login/','POST',{username:form.elements.username.value,password:form.elements.password.value},true);
      if(dead)return;
      if(!/^[a-f0-9]{40}$/.test(result.token)||!Number.isFinite(result.expires_in)||result.expires_in<=0)throw new Error('登录响应无效，请重新尝试。');
      token=result.token;const saved=session.save(token,result.expires_in);user=result.user;expire();
      message(saved?'登录成功。可前往栏目页面写作。':'登录成功；浏览器无法保存会话，离开本页后需重新登录。');
    }catch(error){message(error.offline||error.unavailable?'登录尚未完成，请恢复连接后重试。':error.status===401?'用户名或密码不正确，请重新输入。':error.message);}
    finally{form.elements.password.value='';busy=false;render();}
  });
  async function logout(){
    if(busy)return;busy=true;render();let confirmed=false;
    try{if(token){await request('/logout/','POST');confirmed=true;}}catch(error){confirmed=error.status===401;}
    finally{clear();busy=false;render();message(confirmed?'已退出登录。':'已清除此标签页登录；服务端退出尚未确认。');}
  }
  retry.addEventListener('click',check);$('[data-account-exit]').addEventListener('click',logout);
  window.addEventListener('blog:logout',logout);
  window.addEventListener('offline',()=>{online=false;network('互动服务当前不可用，请稍后再试。','offline');render();});
  window.addEventListener('pagehide',()=>{dead=true;token='';clearTimeout(retryTimer);clearTimeout(expiryTimer);client.destroy();},{once:true});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  expire();check();
})();
