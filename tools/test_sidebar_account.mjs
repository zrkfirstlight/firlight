import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../site/static/js/sidebar-account.js',import.meta.url),'utf8');
const settle=()=>new Promise(r=>setImmediate(r));
async function fixture({token='',error=null,base='https://api.example/api'}={}){
 const elements=new Map();class Element extends EventTarget{constructor(){super();this.hidden=false;this.textContent='';}}
 const root={dataset:{api:base},querySelector:s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);}};
 const requests=[];let stored=token,reloads=0;
 class Session{read(){return stored;}clear(){stored='';}get expires(){return Date.now()+1000;}}
 class Client{async request(path,method,data,auth){requests.push({path,method,auth});if(error)throw error;return {nickname:'测试昵称'};}destroy(){}}
 const window=new EventTarget();window.BlogSession=Session;window.BlogApiClient=Client;window.sessionStorage={};
 vm.runInNewContext(code,{document:{querySelector:()=>root},window,location:{reload:()=>reloads++},Date,setTimeout:()=>1,clearTimeout:()=>{}});
 await settle();return {elements,window,requests,get token(){return stored;},get reloads(){return reloads;}};
}
{
 const f=await fixture();assert.equal(f.requests.length,0);assert.equal(f.elements.get('[data-account-login]').hidden,false);assert.equal(f.elements.get('[data-account-logout]').hidden,true);
 const event=new Event('blog:account');event.detail={nickname:'已登录昵称'};f.window.dispatchEvent(event);assert.equal(f.elements.get('[data-account-name]').textContent,'已登录昵称');assert.equal(f.elements.get('[data-account-logout]').hidden,false);
}
{
 const f=await fixture({token:'test-only'});assert.equal(f.requests[0].path,'/me/');assert.equal(f.elements.get('[data-account-name]').textContent,'测试昵称');
 f.elements.get('[data-account-logout]').dispatchEvent(new Event('click'));await settle();assert.equal(f.requests[1].path,'/logout/');assert.equal(f.token,'');assert.equal(f.reloads,1);
}
{
 const f=await fixture({token:'test-only',error:{status:401,message:'expired'}});assert.equal(f.token,'');assert.equal(f.elements.get('[data-account-login]').hidden,false);
 const offline=await fixture({token:'test-only',error:{status:503,message:'offline'}});assert.equal(offline.token,'test-only');assert.equal(offline.elements.get('[data-account-logout]').hidden,false);
 const disabled=await fixture({base:''});assert.equal(disabled.requests.length,0);
}
console.log('PASS: no anonymous API calls, login event, restore, logout/revoke, 401 clears, 503 preserves, unconfigured.');
