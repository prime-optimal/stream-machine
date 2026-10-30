const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {build}=require('../tools/build.cts');
const {overlayEngine}=require('../runtime/overlay.cts');
const engine=overlayEngine();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'overlay-test-'));
process.on('exit',()=>fs.rmSync(temp,{recursive:true,force:true}));
const fixture=n=>JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',n+'.json'),'utf8'));
function browser(html){const nodes={canvas:{style:{},innerHTML:''},'overlay-style':{textContent:''}};const context={window:{addEventListener(){}},document:{getElementById:id=>nodes[id]},innerWidth:960,innerHeight:540};vm.createContext(context);vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1],context);return {api:{geometry:()=>context.window.StreamOverlay.geometry(),update:patch=>vm.runInContext('window.StreamOverlay.update(JSON.parse('+JSON.stringify(JSON.stringify(patch))+'))',context)},nodes};}
test('both variants build deterministic standalone HTML and editable rebuilds',()=>{
  for(const variant of ['camera','schedule']){
    const a=build(fixture(variant),path.join(temp,variant)),b=build(fixture(variant),path.join(temp,variant+'-again'));
    assert.equal(a.html,b.html);assert.equal(a.report.sha256,b.report.sha256);
    assert.ok(!/(?:src|href)=["'](?:https?:|\/\/)|@import|fetch\(/i.test(a.html));
    assert.ok(fs.existsSync(path.join(temp,variant,'editable','runtime','overlay.cts')));
    assert.throws(()=>build(fixture(variant),path.join(temp,variant)),/EEXIST/);
    const api=browser(a.html).api;assert.equal(api.geometry().canvas.opaque,variant==='schedule');if(variant==='camera')assert.equal(api.geometry().apertureCovered,false);else assert.ok(!Object.hasOwn(api.geometry(),'apertureCovered'));
    if(variant==='camera')assert.match(a.html,/background:transparent/);
    else assert.match(a.html,/SAMPLE LINEUP/);
  }
});
test('aperture remains empty; border and plate remain outside at multiple dimensions',()=>{
  for(const [width,height] of [[640,360],[1920,1080],[3840,2160],[1800,1080]]){
    const c=engine.normalize({width,height}),g=engine.geometry(c),a=g.aperture;
    assert.deepEqual(g.borderInner,a);assert.ok(g.borderOuter.x<a.x);
    assert.ok(g.nameplate.y>=a.y+a.height);assert.ok(a.x+a.width<=width);
    const html=engine.view(c).html;assert.match(html,/<div class="frame"[^>]*><\/div>/);
  }
  assert.throws(()=>engine.normalize({aperture:{x:0,y:0,width:1900,height:1000}}),/safe bounds/);
});
test('parameter changes affect geometry, style, copy and actual runtime updates',()=>{
  const base=engine.normalize({}),changed=engine.normalize({width:1280,height:720,title:'Another event',style:'editorial',accent:'#ffffff'});
  assert.notDeepEqual(engine.geometry(base),engine.geometry(changed));
  assert.match(engine.view(changed).css,/Georgia/);
  const {api,nodes}=browser(build({variant:'fullscreen-schedule'},path.join(temp,'live')).html);
  api.update({title:'Changed',schedule:[{time:'TBA',name:'New slot'}]});
  assert.match(nodes.canvas.innerHTML,/Changed/);assert.match(nodes.canvas.innerHTML,/New slot/);
  const before=nodes.canvas.innerHTML;assert.throws(()=>api.update({foreground:'#111b20'}));assert.equal(nodes.canvas.innerHTML,before);
});
test('unknown fields including inherited names, unsafe values and injection',()=>{
  for(const key of ['constructor','__proto__','toString','extra']){
    assert.throws(()=>engine.normalize(JSON.parse('{"'+key+'":1}')),/Unknown/);
    assert.throws(()=>engine.normalize({aperture:JSON.parse('{"'+key+'":1}')}),/Unknown/);
    assert.throws(()=>engine.normalize({schedule:[JSON.parse('{"time":"TBA","name":"slot","'+key+'":1}')]}),/Unknown/);
  }
  assert.throws(()=>engine.normalize(Object.create({title:'inherited'})),/plain object/);
  for(const config of [{width:NaN},{height:1},{title:'x'.repeat(43)},{accent:'red;display:none'},{motion:'loop'},{schedule:[]},{foreground:'#111b20'}])assert.throws(()=>engine.normalize(config));
  const {html}=build({title:'</script><img src=x onerror=alert(1)>'},path.join(temp,'escape'));
  assert.equal((html.match(/<script>/g)||[]).length,1);assert.ok(!html.includes('<img src=x'));
  const {api,nodes}=browser(html);api.update({title:'<b>safe</b>'});assert.match(nodes.canvas.innerHTML,/&lt;b&gt;safe/);
  assert.throws(()=>api.update(JSON.parse('{"__proto__":{}}')),/Unsupported/);
});
test('creator typography overrides every variant and style; font metadata required',()=>{
  // Structural fixture only: no packaged creator font and no claimed glyph/render test.
  const font={data:'data:font/woff2;base64,d09GMgAAAAAA',source:'Structural test fixture',license:'Test only; not a distributable font'};
  for(const variant of ['camera-frame','fullscreen-schedule'])for(const style of ['technical','editorial']){
    const css=engine.view(engine.normalize({variant,style,font})).css;
    assert.match(css,/@font-face/);assert.match(css,/font-family:CreatorFont/);
    assert.ok(!css.includes('font-family:Georgia'));assert.match(css,/\.time\{[^}]*font-family:CreatorFont/);
  }
  assert.throws(()=>engine.normalize({font:{...font,source:''}}));
  assert.throws(()=>engine.normalize({font:{...font,data:'https://external/font.woff2'}}));
});
test('relocated package builds and tests with all fixtures available',()=>{
  const relocated=path.join(temp,'relocated-plugin');fs.cpSync(path.resolve(__dirname,'..'),relocated,{recursive:true});
  const result=require('node:child_process').spawnSync(process.execPath,[path.join(relocated,'tools','build.cts'),path.join(relocated,'tests','fixtures','camera.json'),path.join(temp,'relocated-output')],{encoding:'utf8',cwd:os.tmpdir()});
  assert.equal(result.status,0,result.stderr);
  const output=path.join(temp,'relocated-output');const rebuild=require('node:child_process').spawnSync(process.execPath,[path.join(output,'editable','tools','build.cts'),path.join(output,'source.json'),path.join(temp,'rebuilt')],{encoding:'utf8',cwd:os.tmpdir()});
  assert.equal(rebuild.status,0,rebuild.stderr);
  assert.equal(fs.readFileSync(path.join(output,'index.html'),'utf8'),fs.readFileSync(path.join(temp,'rebuilt','index.html'),'utf8'));
});
test('schedule geometry reports opaque coverage without camera-only claims',()=>{
  const {html,report}=build({variant:'fullscreen-schedule'},path.join(temp,'schedule-geometry'));
  for(const geometry of [report.geometry,browser(html).api.geometry()]){
    assert.equal(geometry.canvas.opaque,true);
    assert.equal(geometry.canvas.coverage,'full');
    for(const key of ['aperture','borderOuter','borderInner','nameplate','apertureCovered'])assert.ok(!Object.hasOwn(geometry,key)||geometry[key]===null,key+' must be absent or null');
    assert.equal(geometry.scheduleBounds.x,96);assert.equal(geometry.scheduleBounds.y,324);
    assert.equal(geometry.scheduleBounds.width,1728);assert.equal(geometry.scheduleBounds.height,550.8);
    assert.equal(geometry.rows.length,3);
    assert.equal(geometry.evidence,'calculated-layout');
  }
});
function manifestDefaults(){
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'..','open-design.json'),'utf8'));
  return Object.fromEntries(manifest.od.inputs.filter(field=>Object.hasOwn(field,'default')).map(field=>[field.name,field.default]));
}
test('all actual manifest defaults bind at smaller dimensions for both variants',()=>{
  for(const variant of ['camera-frame','fullscreen-schedule']){
    const input={...manifestDefaults(),width:1280,height:720,variant};
    // The complete default object is passed unchanged: form JSON strings included.
    const c=engine.normalize(input),out=build(input,path.join(temp,'bound-'+variant));
    assert.equal(c.width,1280);assert.equal(out.report.geometry.canvas.height,720);
    if(variant==='camera-frame')assert.deepEqual(c.aperture,{x:80,y:120,width:1120,height:480});
    else assert.equal(c.aperture,null);
    browser(out.html).api.update({title:'Bound defaults'});
  }
});
test('auto aperture is dimension-derived; schedule ignores unused camera input',()=>{
  for(const aperture of ['', '  ', 'auto',null])assert.deepEqual(engine.normalize({width:1280,height:720,aperture}).aperture,{x:80,y:120,width:1120,height:480});
  for(const aperture of [{x:0,y:0,width:99999,height:1},'not JSON',42]){
    const c=engine.normalize({...manifestDefaults(),variant:'fullscreen-schedule',width:1280,height:720,aperture});
    assert.equal(c.aperture,null);assert.doesNotThrow(()=>engine.view(c));
  }
  assert.deepEqual(engine.normalize({aperture:'{"x":120,"y":180,"width":1680,"height":720}'}).aperture,{x:120,y:180,width:1680,height:720});
  assert.throws(()=>engine.normalize({aperture:'not JSON'}));
  assert.throws(()=>engine.normalize({aperture:'{"constructor":1}'}),/Unknown/);
});
