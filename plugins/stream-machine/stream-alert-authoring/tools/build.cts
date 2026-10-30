'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const defaults=JSON.parse(fs.readFileSync(path.join(root,'examples/generic.json')));
function validate(input){
 const c={...defaults,...input};
 for(const k of Object.keys(input))if(!Object.hasOwn(defaults,k))throw Error('Unknown input: '+k);
 for(const k of ['accent','background'])if(!/^#[0-9a-f]{6}$/i.test(c[k]))throw Error(k+' must be #RRGGBB');
 for(const [k,min,max]of [['width',480,1920],['height',240,1080],['duration',2,30]])if(!Number.isFinite(c[k])||c[k]<min||c[k]>max||(k!=='duration'&&!Number.isInteger(c[k])))throw Error(k+' out of bounds');
 for(const [k,max]of [['brandName',32],['eventLabel',40],['headline',40],['footer',64],['sampleFollower',64]])if(typeof c[k]!=='string'||!c[k].trim()||[...c[k]].length>max)throw Error(k+' invalid text length');
 if(!['geometric','editorial','minimal'].includes(c.styleDirection))throw Error('Unknown styleDirection');
 for(const k of ['fontFile','brandGuide'])if(typeof c[k]!=='string')throw Error(k+' must be a local path');
 const lum=h=>{const v=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
 const a=lum(c.accent),b=lum(c.background);if((Math.max(a,b)+.05)/(Math.min(a,b)+.05)<4.5)throw Error('Accent/background contrast must be >=4.5:1');
 return c;
}
const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
function build(input={},base=process.cwd()){
 const c=validate(input);let fonts='';
 if(c.brandGuide){fs.accessSync(path.resolve(base,c.brandGuide));throw Error('Review brandGuide and resolve its rules into source/config before building; then clear brandGuide and record provenance.');}
 if(c.fontFile){const file=path.resolve(base,c.fontFile),ext=path.extname(file).slice(1);if(!['woff','woff2','ttf','otf'].includes(ext))throw Error('Unsupported font');fonts=`@font-face{font-family:Creator;src:url(data:font/${ext};base64,${fs.readFileSync(file).toString('base64')})}body{font-family:Creator,system-ui,sans-serif}body[class] h1,body[class] #name{font-family:Creator,system-ui,sans-serif}`;}
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const blocks={STYLE:read('src/style.css')+`\n:root{--ink:${c.accent};--panel:${c.background}}#stage{width:${c.width}px;height:${c.height}px}`+fonts,CONFIG:safe({...c,fontFile:'',brandGuide:''}),COPY:`const c=JSON.parse(document.getElementById('config').textContent);document.body.classList.add(c.styleDirection);for(const [id,key]of Object.entries({brand:'brandName',event:'eventLabel',headline:'headline',footer:'footer'}))document.getElementById(id).textContent=c[key];`,ADAPTER:read('src/adapter.cts'),COMPOSITION:read('src/composition.cts'),LIVE:read('src/live.cts')};
 let html=read('src/template.html');for(const [k,v]of Object.entries(blocks))html=html.replace('/* '+k+' */',()=>v);return html;
}
if(require.main===module){const input=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2])):{};const out=path.resolve(process.argv[3]||'index.html');fs.writeFileSync(out,build(input,process.argv[2]?path.dirname(path.resolve(process.argv[2])):process.cwd()));console.log('Built '+out);}
module.exports={build,validate};
