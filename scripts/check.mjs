import fs from "node:fs";
import path from "node:path";
const srcDir = path.resolve(import.meta.dirname, "..", "src");
const files = [];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())walk(p); else if(e.name.endsWith(".js")&&!["app.js","data.js"].includes(e.name))files.push(p);}})(srcDir);
const exportsOf = (f)=>{const t=fs.readFileSync(f,"utf8");const s=new Set();
  for(const m of t.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g))s.add(m[1]);
  for(const m of t.matchAll(/export\s+const\s+\{([^}]+)\}/g))m[1].split(",").forEach(n=>s.add(n.trim()));
  return s;};
const exCache=new Map();
let problems=0;
for(const f of files){
  const text=fs.readFileSync(f,"utf8");
  for(const m of text.matchAll(/import\s+\{([^}]+)\}\s+from\s+"([^"]+)"/g)){
    const names=m[1].split(",").map(s=>s.trim()).filter(Boolean);
    const target=path.resolve(path.dirname(f),m[2]);
    if(!fs.existsSync(target)){console.log("MISSING FILE:",path.relative(srcDir,f),"->",m[2]);problems++;continue;}
    if(!exCache.has(target))exCache.set(target,exportsOf(target));
    const ex=exCache.get(target);
    for(const n of names)if(!ex.has(n)){console.log("NOT EXPORTED:",n,"from",m[2],"(in",path.relative(srcDir,f)+")");problems++;}
  }
}
console.log(problems?`\n${problems} problem(s)`:"\nMODULE GRAPH OK — all imports resolve to real exports");
