const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const {build,validate}=require('../tools/build.cts');
test('two distinct input sets change actual output, safely encode all copy',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(root,'examples/generic.json'))),b=JSON.parse(fs.readFileSync(path.join(root,'examples/editorial.json')));
 const x=build(a),y=build(b);assert.notEqual(x,y);for(const c of [a,b]){const html=build(c);assert.ok(html.includes(`width:${c.width}px;height:${c.height}px`));const cfg=JSON.parse(html.match(/type="application\/json">([\s\S]*?)<\/script>/)[1]);for(const k of Object.keys(c))assert.deepEqual(cfg[k],c[k]);}
 const html=build({brandName:'</script><img src=x>'});assert.ok(html.includes('\\u003c/script\\u003e'));assert.doesNotMatch(html,/<img src=x>/);
});
test('bounds, text, style and contrast are rejected deterministically',()=>{
 for(const input of [{width:479},{height:1081},{width:500.5},{duration:31},{duration:NaN},{accent:'red'},{background:'#ffffff',accent:'#ffffff'},{styleDirection:'x'},{headline:'x'.repeat(41)},{sampleFollower:'👻'.repeat(65)},{extra:true}])assert.throws(()=>validate(input));
 assert.equal(validate({sampleFollower:'👻'.repeat(64)}).duration,6);assert.throws(()=>build({brandGuide:'missing.md'}));
});
test('offline output, no private fonts or brand, inline scripts compile',()=>{
 const html=build();assert.doesNotMatch(html,/<script[^>]+src=|<link|fetch\s*\(|WebSocket|XMLHttpRequest|@import|\.innerHTML\s*=|KLab|K-LAB|SAIBA|\/\* (STYLE|CONFIG|COPY|ADAPTER|COMPOSITION|LIVE) \*\//i);
 for(const m of html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)){if(m[0].includes('application/json'))continue;new vm.Script(m[1]);}
 assert.ok(html.includes("get('preview')==='1'"));assert.ok(html.includes('SYNTHETIC PREVIEW'));
});
test('composition has deterministic transparent endpoints and finite reduced motion',()=>{
 const {createComposition}=require('../src/composition.cts');
 for(const reduced of [false,true]){const card={style:{}};let now=0,callback,done=0;const clock={performance:{now:()=>now},requestAnimationFrame(fn){callback=fn;return 1},cancelAnimationFrame(){callback=null}};
 const c=createComposition(card,{duration:6},reduced,clock);assert.equal(c.getTime(),0);assert.equal(card.style.opacity,'0');c.seek(3);assert.equal(card.style.opacity,'1');const mid={...card.style};c.seek(6);assert.equal(card.style.opacity,'0');c.seek(3);assert.deepEqual(card.style,mid);if(reduced)assert.equal(card.style.transform,'none');c.start(()=>done++);now=6000;callback(now);assert.equal(done,1);assert.equal(card.style.visibility,'hidden');c.idle();assert.equal(c.getTime(),0);}
});
test('package relocates and builds outside authoring cwd',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stream-alert-'));try{fs.cpSync(root,path.join(tmp,'plugin'),{recursive:true});const {execFileSync}=require('node:child_process');execFileSync(process.execPath,[path.join(tmp,'plugin/tools/build.cts'),path.join(tmp,'plugin/examples/editorial.json'),path.join(tmp,'index.html')],{cwd:tmp});assert.equal(fs.readFileSync(path.join(tmp,'index.html'),'utf8'),build(JSON.parse(fs.readFileSync(path.join(root,'examples/editorial.json')))));}finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('rejects inherited input names as unknown own keys',()=>{
 for(const key of ['toString','constructor','__proto__']){
  const input=JSON.parse(`{"${key}":"unexpected"}`);
  assert.throws(()=>validate(input),/Unknown input:/,key);
 }
});
test('creator font overrides headline and name in every preset without leaking into defaults',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'creator-font-'));
 // Synthetic test bytes check embedding only; this is not a usable or private font.
 const bytes=Buffer.from('synthetic-font-regression-only');
 try{fs.writeFileSync(path.join(tmp,'creator.woff2'),bytes);
  for(const styleDirection of ['geometric','editorial','minimal']){
   const html=build({styleDirection,fontFile:'creator.woff2'},tmp);
   assert.ok(html.includes(bytes.toString('base64')));
   assert.match(html,/body\[class\] h1,body\[class\] #name\{font-family:Creator,system-ui,sans-serif\}/);
  }
  for(const html of [build(),...['index.html','editorial.html'].map(p=>fs.readFileSync(path.join(root,'examples',p),'utf8'))]){
   assert.doesNotMatch(html,/@font-face|data:font\/|font-family:Creator/);
   assert.ok(!html.includes(bytes.toString('base64')));
  }
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('copied resources include tests and context stages them',()=>{
 const skill=fs.readFileSync(path.join(root,'SKILL.md'),'utf8');
 assert.match(skill,/Copy[^.]*tests\//s);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'open-design.json')));
 for(const resource of ['tests','examples','src','tools','contracts','docs','open-design.json','SKILL.md']){
  assert.ok(manifest.od.context.assets.includes(resource),resource);
  assert.ok(fs.existsSync(path.join(root,resource)),resource);
 }
 const expected=['src/adapter.cts','src/composition.cts','src/live.cts','tools/build.cts','tests/adapter.test.cts','tests/live.test.cts','tests/package.test.cts'];
 for(const file of expected){
  assert.ok(fs.existsSync(path.join(root,file)),file);
  assert.ok(!fs.existsSync(path.join(root,file.replace(/\.cts$/,file.startsWith('src/')?'.js':'.cjs'))));
 }
 for(const file of expected.slice(0,3))new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
});
