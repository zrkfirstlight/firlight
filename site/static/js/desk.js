/* Original small utilities: no framework, no backend dependence, no tracking. */
(() => {
  const indexURL=document.currentScript?.dataset.index;
  const abort=new AbortController(),on=(el,event,fn,extra={})=>el?.addEventListener(event,fn,{...extra,signal:abort.signal});
  let dead=false,index=null,loading=null,searchController=null;
  const dialog=document.querySelector('.quick-search'),input=document.querySelector('[data-quick-input]'),results=document.querySelector('[data-quick-results]'),status=document.querySelector('[data-quick-status]');
  const txt=(parent,tag,text)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
  function render(){
    if(!index)return;const query=input.value.trim().toLocaleLowerCase();results.replaceChildren();
    const matches=index.map(row=>({row,score:!query?1:(row.title.toLocaleLowerCase().includes(query)?6:0)+((row.topics||[]).join(' ').toLocaleLowerCase().includes(query)?3:0)+(row.content.toLocaleLowerCase().includes(query)?1:0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
    status.textContent=query?`${matches.length} 条匹配（最多显示10条）`:'近期内容 · 可输入标题、主题或正文关键词';
    const origin=new URL(indexURL,document.baseURI).origin;
    for(const {row} of matches){
      let url;try{url=new URL(row.permalink,document.baseURI);}catch{continue;}if(url.origin!==origin)continue;
      const li=document.createElement('li');results.append(li);txt(li,'small',`${row.type||'文章'} · ${(row.topics||[]).join(' / ')}`);const a=txt(li,'a',row.title);a.href=url.href;txt(li,'p',row.summary||row.content.slice(0,100));
    }
  }
  async function load(){
    if(index){render();return;}if(loading)return loading;
    status.textContent='正在加载本站搜索索引…';searchController=new AbortController();const timer=setTimeout(()=>searchController.abort(),6000);
    loading=(async()=>{try{const response=await fetch(indexURL,{signal:searchController.signal,credentials:'omit'});if(!response.ok)throw new Error('index unavailable');const data=await response.json();if(!Array.isArray(data))throw new Error('invalid index');index=data;if(!dead)render();}catch{if(!dead){status.textContent='索引暂不可用，请关闭后重新打开重试；普通文章仍可浏览。';}}finally{clearTimeout(timer);loading=null;}})();return loading;
  }
  function openSearch(){if(!dialog||typeof dialog.showModal!=='function'){location.href=new URL(indexURL,document.baseURI).href.replace(/index\.json$/,'');return;}if(!dialog.open)dialog.showModal();input.focus();load();}
  document.querySelectorAll('[data-quick-search]').forEach(b=>on(b,'click',openSearch));
  on(window,'keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.target.matches('input[type=password]')){e.preventDefault();openSearch();}});
  on(input,'input',render);
  const nodes=[...document.querySelectorAll('[data-orbit-url]')];
  nodes.forEach(b=>on(b,'click',()=>{nodes.forEach(n=>n.setAttribute('aria-pressed',String(n===b)));document.querySelector('[data-orbit-caption]').textContent=b.dataset.orbitDescription;const link=document.querySelector('[data-orbit-link]');link.href=b.dataset.orbitUrl;link.textContent=`进入${b.textContent} ↗`;}));
  on(document.querySelector('[data-desk-note]'),'click',e=>{const note=document.querySelector('.desk-paper-note');note.hidden=!note.hidden;e.currentTarget.setAttribute('aria-expanded',String(!note.hidden));});
  on(document.querySelector('[data-find-orbit]'),'click',e=>{document.querySelector('.desk-lost').classList.add('found');document.querySelector('.orbit-answer').textContent='已找到方向。下面的首页和搜索入口一直都在。';e.currentTarget.textContent='节点已归位';});
  const filter=document.querySelector('.discovery-filter select');
  on(filter,'change',()=>{let count=0;document.querySelectorAll('[data-discovery-kind]').forEach(e=>{e.hidden=filter.value!=='all'&&e.dataset.discoveryKind!==filter.value;if(!e.hidden)count++;});document.querySelector('.filter-status').textContent=`本页显示${count}条。`;});
  const marker=document.querySelector('[data-reading-id]'),article=document.querySelector('.main-article .article-content');let frame=0,lastSaved=0;
  let savePosition=()=>{};
  if(marker&&article){
    const key='blog.reading.v1.'+marker.dataset.readingId;let saved=0;try{saved=Number(localStorage.getItem(key));}catch{}
    if(saved>.08&&saved<.95){const b=document.createElement('button');b.type='button';b.className='reading-resume';b.textContent=`继续上次阅读（约${Math.round(saved*100)}%）`;article.prepend(b);on(b,'click',()=>{window.scrollTo({top:article.getBoundingClientRect().top+scrollY+saved*Math.max(1,article.offsetHeight-innerHeight),behavior:'auto'});b.remove();});}
    savePosition=()=>{const progress=Math.max(0,Math.min(1,(scrollY-(article.getBoundingClientRect().top+scrollY))/Math.max(1,article.offsetHeight-innerHeight)));try{localStorage.setItem(key,String(progress));}catch{}lastSaved=Date.now();};
    on(window,'scroll',()=>{if(!frame&&Date.now()-lastSaved>2000)frame=requestAnimationFrame(()=>{frame=0;savePosition();});},{passive:true});
  }
  on(window,'pagehide',()=>{savePosition();dead=true;searchController?.abort();cancelAnimationFrame(frame);abort.abort();},{once:true});
})();
