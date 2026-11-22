/* Aggregate page views; no visitor ID, cookie, token or background polling. */
(() => {
  const root=document.querySelector('[data-site-visits]');if(!root)return;
  const client=new window.BlogApiClient({base:root.dataset.api,timeoutMs:5000});
  const key='blog.last-visit-total.v1';let cached='';
  try{cached=localStorage.getItem(key)||'';}catch{}
  if(!/^\d+$/.test(cached))cached='';
  if(/^\d+$/.test(cached))root.textContent='总访问 '+Number(cached).toLocaleString()+' 次 · 上次记录';
  client.request('/visits/','POST',{}).then(result=>{
    if(!Number.isSafeInteger(result.total)||result.total<0)throw Error('invalid count');
    root.textContent='总访问 '+result.total.toLocaleString()+' 次';
    root.title='从 '+new Date(result.started).toLocaleDateString()+' 起累计的页面访问次数';
    try{localStorage.setItem(key,String(result.total));}catch{}
  }).catch(()=>{if(!cached)root.textContent='总访问 · 暂不可用';}).finally(()=>client.destroy());
  window.addEventListener('pagehide',()=>client.destroy(),{once:true});
})();
