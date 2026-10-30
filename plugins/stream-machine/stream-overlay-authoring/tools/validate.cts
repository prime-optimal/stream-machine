const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const schema=JSON.parse(fs.readFileSync(path.join(root,'references','plugin.schema.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'open-design.json'),'utf8'));
function check(value,rule,where){
  if(rule.$ref) return check(value,rule.$ref.split('/').slice(1).reduce((a,k)=>a[k],schema),where);
  if(rule.oneOf){const matches=rule.oneOf.filter(r=>{try{check(value,r,where);return true;}catch{return false;}});if(matches.length!==1)throw Error(where+' oneOf');}
  if(rule.enum&&!rule.enum.includes(value))throw Error(where+' enum');
  if(rule.type){const valid=rule.type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):rule.type==='array'?Array.isArray(value):typeof value===rule.type;if(!valid)throw Error(where+' type');}
  if(typeof value==='string'){
    if(rule.minLength&&value.length<rule.minLength)throw Error(where+' minLength');
    if(rule.pattern&&!new RegExp(rule.pattern).test(value))throw Error(where+' pattern');
    if(rule.format==='uri'){try{new URL(value);}catch{throw Error(where+' URI');}}
  }
  if(typeof value==='number'&&rule.minimum!==undefined&&value<rule.minimum)throw Error(where+' minimum');
  if(Array.isArray(value)&&rule.items)value.forEach((v,i)=>check(v,rule.items,where+'['+i+']'));
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    if(rule.minProperties&&Object.keys(value).length<rule.minProperties)throw Error(where+' minProperties');
    for(const k of rule.required||[])if(!Object.hasOwn(value,k))throw Error(where+' missing '+k);
    for(const k of Object.keys(value)){
      if(rule.properties&&Object.hasOwn(rule.properties,k))check(value[k],rule.properties[k],where+'.'+k);
      else if(rule.additionalProperties===false)throw Error(where+' unknown '+k);
      else if(typeof rule.additionalProperties==='object')check(value[k],rule.additionalProperties,where+'.'+k);
    }
  }
}
check(manifest,schema,'manifest');
const refs=[...manifest.od.context.skills.map(r=>r.path),...manifest.od.context.assets,...manifest.od.useCase.exampleOutputs.map(r=>r.path),manifest.od.preview.entry];
for(const ref of refs){const resolved=path.resolve(root,ref);if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))throw Error('Missing or nonlocal reference '+ref);}
function walk(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,item.name);if(item.isDirectory())walk(p);else if(/\.(?:js|cjs)$/.test(p))throw Error('Non-CTS source: '+p);else if(/\.(?:cts|html|md)$/.test(p)&&fs.readFileSync(p,'utf8').split('\n').length>=500)throw Error('500-line limit: '+p);}}
walk(root);console.log('PASS: supplied schema, '+refs.length+' local references, CTS source and line limits');
