/* Article authoring is permission-checked by the API. Never render Markdown as HTML here. */
(() => {
  const root=document.querySelector('[data-article-manager]');if(!root)return;
  const $=s=>root.querySelector(s),form=$('.am-editor'),list=$('.am-list'),status=$('.am-status'),jobBox=$('.am-job');
  let storage;try{storage=window.sessionStorage;}catch{storage={getItem:()=>null,removeItem:()=>{}};}
  const session=new window.BlogSession(root.dataset.api,storage),client=new window.BlogApiClient({base:root.dataset.api});
  let current=null,job=null,busy=false,dirty=false,dead=false,timer=0,polls=0,page=1;
  const labels={queued:'发布已排队',running:'正在构建与推送',pushed:'已推送，等待 GitHub Pages 部署',deployed:'已发布：GitHub Pages 部署成功',failed:'发布未完成'};
  function message(v){if(!dead)status.textContent=v;}
  function lock(value){busy=value;root.querySelectorAll('button').forEach(b=>b.disabled=value);}
  async function api(path,method='GET',data){
    const token=session.read();if(!token){root.hidden=true;throw new Error('请重新登录；本页尚未保存的输入仍保留。');}
    try{return await client.request(path,method,data,token);}catch(e){
      if(e.status===401){session.clear();root.hidden=true;}else if(e.offline||e.unavailable)$('[data-am-retry]').hidden=false;
      throw e;
    }
  }
  function action(fn){return async()=>{if(busy)return;lock(true);try{await fn();}catch(e){message(e.message);}finally{lock(false);}};}
  function btn(target,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action(fn));target.append(b);return b;}
  function dateValue(value){const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
  function show(a=null){current=a;form.hidden=false;form.reset();form.elements.title.value=a?.title||'';form.elements.slug.value=a?.slug||'';form.elements.summary.value=a?.summary||'';form.elements.body.value=a?.body||'';form.elements.date.value=dateValue(a?.date||Date.now());form.elements.categories.value=(a?.categories||[]).join('，');form.elements.tags.value=(a?.tags||[]).join('，');form.elements.draft.checked=a?.draft??true;$('[data-am-heading]').textContent=a?'编辑文章':'写文章';dirty=false;form.elements.title.focus();if(a?.publication)watch(a.publication);}
  async function open(id){if(dirty&&!confirm('尚有未保存的修改，确定载入另一篇？'))return;show(await api('/articles/'+encodeURIComponent(id)+'/'));}
  async function listing(){
    const d=await api('/articles/?kind='+encodeURIComponent(root.dataset.kind)+'&page='+page);list.hidden=false;list.replaceChildren();
    if(!d.results.length){const p=document.createElement('p');p.textContent='当前栏目还没有你可管理的文章。';list.append(p);}
    for(const a of d.results){const row=document.createElement('div');row.className='am-row';const text=document.createElement('span');text.textContent=a.title+' · '+(a.deleted?'已归档':a.draft?'草稿':a.published_revision===a.revision?'已发布':'有未发布修改')+' · '+a.owner;row.append(text);
      if(a.deleted){btn(row,'恢复草稿',async()=>{if(!confirm('恢复为草稿？不会立即公开。'))return;await api('/articles/'+encodeURIComponent(a.id)+'/','PATCH',{action:'restore',revision:a.revision});await listing();message('已恢复到数据库；如需重新公开，请编辑后发布。');});}
      else{btn(row,'编辑',()=>open(a.id));btn(row,'删除',async()=>{if(!confirm('归档并从网站撤下《'+a.title+'》？评论和原文将保留，可恢复。'))return;const d=await api('/articles/'+encodeURIComponent(a.id)+'/','DELETE',{revision:a.revision});if(current?.id===a.id){current=null;form.hidden=true;dirty=false;}watch(d.publication);await listing();message(d.detail);});}
      if(a.publication){btn(row,'发布状态',async()=>{watch(a.publication);await checkJob();});}list.append(row);
    }
    const nav=document.createElement('div');nav.className='am-pagination';if(d.previous)btn(nav,'上一页',async()=>{page--;await listing();});if(d.next)btn(nav,'下一页',async()=>{page++;await listing();});list.append(nav);
  }
  const split=v=>v.split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  async function save(publish){
    if(!form.reportValidity())return;
    if(publish&&!confirm('发布当前文章到公开网站？这会保存正文、提交源码并触发 GitHub Pages 部署。'))return;
    const f=form.elements;const payload={kind:root.dataset.kind,title:f.title.value,slug:f.slug.value,summary:f.summary.value,body:f.body.value,date:new Date(f.date.value).toISOString(),categories:split(f.categories.value),tags:split(f.tags.value),draft:publish?false:f.draft.checked,publish,...(current?{revision:current.revision}:{})};
    const a=await api('/articles/'+(current?encodeURIComponent(current.id)+'/':''),current?'PUT':'POST',payload);current=a;dirty=false;f.draft.checked=a.draft;
    message(publish?'已保存到数据库，发布任务已排队；现在还不能视为上线。':'已保存到数据库；未提交、未推送。');if(a.publication)watch(a.publication);if(!list.hidden)await listing();
  }
  function watch(j){job=j;jobBox.hidden=false;polls=0;clearTimeout(timer);renderJob();if(['queued','running','pushed'].includes(j.status))timer=setTimeout(poll,10000);}
  function renderJob(){if(!job)return;$('[data-am-job-status]').textContent=(job.revision?'第'+job.revision+'版：':'')+(labels[job.status]||job.status)+(job.error?'：'+job.error:'')+(job.commit?' · '+job.commit.slice(0,8):'');$('[data-am-job-retry]').hidden=job.status!=='failed';}
  async function checkJob(){if(!job)return;job=await api('/publications/'+job.id+'/');renderJob();}
  async function poll(){if(dead||document.hidden)return;try{await checkJob();}catch(e){message(e.message);return;}if(++polls<20&&['queued','running','pushed'].includes(job.status))timer=setTimeout(poll,10000);}
  async function init(){if(!session.read()){root.hidden=true;return;}try{const access=await api('/articles/access/');root.hidden=!access.can_publish;$('[data-am-retry]').hidden=true;}catch(e){message(e.message);}}
  $('[data-am-new]').addEventListener('click',()=>{if(!dirty||confirm('放弃未保存修改并新建？'))show();});$('[data-am-list]').addEventListener('click',action(listing));$('[data-am-retry]').addEventListener('click',action(init));
  $('[data-am-close]').addEventListener('click',()=>{if(!dirty||confirm('关闭编辑器并放弃未保存修改？')){form.hidden=true;dirty=false;}});
  form.addEventListener('input',()=>{dirty=true;});form.addEventListener('submit',e=>{e.preventDefault();action(()=>save(false))();});$('[data-am-publish]').addEventListener('click',action(()=>save(true)));
  $('[data-am-job-check]').addEventListener('click',action(checkJob));$('[data-am-job-retry]').addEventListener('click',action(async()=>{if(!confirm('重试这项发布？'))return;watch(await api('/publications/'+job.id+'/','POST',{}));message('已重新排队。');}));
  window.addEventListener('blog:account',init);window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  window.addEventListener('pagehide',()=>{dead=true;clearTimeout(timer);client.destroy();},{once:true});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);});init();
})();
