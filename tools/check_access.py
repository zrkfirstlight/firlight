"""Read-only local/public acceptance. Never takes credentials or changes DNS/tunnels.
Windows uses system curl (certificate validation on); no Python TLS bypass.
"""
import argparse,json,socket,subprocess,sys,tempfile,urllib.request,urllib.error,ssl
from pathlib import Path
from datetime import datetime,timezone

def classify(status,body=''):
    if '1033' in body and status>=500:return '隧道：边缘没有可用连接器（1033）'
    if status==502:return '隧道/源站：检查连接器 ready、127.0.0.1:8000 和 Published application 目标'
    if status==401:return '认证：未登录或 Token 过期，不能据此判断服务离线'
    if status==403:return '权限/来源/边缘安全规则：核对 JSON detail 或 Cloudflare 错误码'
    if status==429:return '限流：等待 Retry-After，不持续重试'
    if status>=500:return '服务端/边缘故障：互动暂不可用，静态阅读应继续'
    return 'HTTP '+str(status)

def request(url,method='GET',headers=None,timeout=8,body=None):
    headers=headers or {}
    if sys.platform=='win32':
        # HTTP status/body are public responses only; no tokens/passwords accepted.
        with tempfile.TemporaryDirectory(prefix='blog-access-') as tmp:
            h=Path(tmp)/'headers';b=Path(tmp)/'body'
            args=['curl.exe','--silent','--show-error','--max-time',str(timeout),'--request',method,'--dump-header',str(h),'--output',str(b),'--write-out','%{http_code}',url]
            # Credentials, when used by private rehearsal, travel over stdin only;
            # never in command-line arguments, files or printed diagnostics.
            config=''
            for k,v in headers.items():config+='header = '+json.dumps(k+': '+v)+'\n'
            if body is not None:config+='data = '+json.dumps(json.dumps(body,ensure_ascii=True))+'\n'
            p=subprocess.run(args+['--config','-'],input=config,capture_output=True,text=True)
            if p.returncode:
                kind={6:'DNS 解析失败',28:'超时',35:'TLS 握手失败',60:'TLS 证书校验失败',7:'网络/端口不可达'}.get(p.returncode,'传输失败')
                return 0,{},kind+' (curl '+str(p.returncode)+')'
            pairs={}
            for line in h.read_text(errors='replace').splitlines():
                if line.startswith('HTTP/'):pairs={}
                elif ':' in line:
                    k,v=line.split(':',1);pairs[k.lower()]=v.strip()
            return int(p.stdout.strip()[-3:]),pairs,b.read_text(encoding='utf-8',errors='replace')
    try:
        with urllib.request.urlopen(urllib.request.Request(url,method=method,headers=headers,data=json.dumps(body).encode() if body is not None else None),timeout=timeout) as r:return r.status,{k.lower():v for k,v in r.headers.items()},r.read().decode()
    except urllib.error.HTTPError as e:return e.code,{k.lower():v for k,v in e.headers.items()},e.read().decode(errors='replace')
    except urllib.error.URLError as e:return 0,{},'DNS/TLS/网络：'+str(e.reason)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('mode',choices=['local','public']);p.add_argument('--output',type=Path);a=p.parse_args()
    base='http://127.0.0.1:8000/api' if a.mode=='local' else 'https://api.zrk123.cn/api'
    headers={'Host':'api.zrk123.cn'} if a.mode=='local' else {}
    results=[]
    def check(name,ok,detail):results.append({'name':name,'pass':bool(ok),'detail':detail})
    if a.mode=='public':
        try:addresses=sorted({r[4][0] for r in socket.getaddrinfo('api.zrk123.cn',443)});check('系统 DNS',True,addresses)
        except OSError as e:check('系统 DNS',False,str(e))
    s,h,b=request(base+'/health/',headers=headers)
    try:data=json.loads(b)
    except ValueError:data={}
    check('HTTPS API health' if a.mode=='public' else '本机正确 Host health',s==200 and data.get('status')=='ok' and data.get('authentication')=='token',{'status':s,'diagnosis':classify(s,b) if s else b,'contract':data})
    for origin in ['https://zrk123.cn','https://www.zrk123.cn','https://untrusted.invalid','http://localhost:1313']:
        s,h,b=request(base+'/comments/','OPTIONS',headers|{'Origin':origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'})
        allowed=origin in ['https://zrk123.cn','https://www.zrk123.cn']
        ok=(200<=s<300 and h.get('access-control-allow-origin')==origin and all(x in h.get('access-control-allow-headers','').lower() for x in ['authorization','content-type']) and 'access-control-allow-credentials' not in h) if allowed else ((200<=s<300 or s==403) and 'access-control-allow-origin' not in h)
        check('CORS '+origin,ok,{'status':s,'allow_origin':h.get('access-control-allow-origin'),'credentials':h.get('access-control-allow-credentials'),'diagnosis':classify(s,b) if s else b})
    s,h,b=request(base+'/me/',headers=headers|{'Origin':'https://zrk123.cn'})
    check('未登录为401（非离线）',s==401,{'status':s,'diagnosis':classify(s,b) if s else b})
    for route in ['/admin/','/api-auth/login/']:
        s,h,b=request(base[:-4]+route,headers=headers)
        check('未开放 Cookie 会话入口 '+route,s==404,{'status':s})
    if a.mode=='local':
        s,h,b=request('http://127.0.0.1:8000/api/health/',headers={'Host':'untrusted.invalid'})
        check('错误 Host 拒绝',s==400,{'status':s})
        s,h,b=request('http://127.0.0.1:20241/ready')
        try:ready=json.loads(b).get('readyConnections',0)
        except ValueError:ready=0
        check('现有连接器 ready（诊断，不修改服务）',s==200 and ready>0,{'status':s,'readyConnections':ready})
    else:
        s,h,b=request('https://zrk123.cn/')
        check('静态站独立 HTTP 可达',s==200 and '<html' in b,{'status':s})
    report={'time':datetime.now(timezone.utc).isoformat(),'mode':a.mode,'results':results,'pass':all(x['pass'] for x in results),'limits':'只读检查，不创建用户/评论、不停止连接器。local 是模拟 Host/Origin，不代表公网。403/429/断线恢复等写入与故障场景另由隔离测试验证。CORS 不是直接 HTTP 客户端的访问控制。'}
    if a.output:a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2));return 0 if report['pass'] else 1
if __name__=='__main__':sys.exit(main())
