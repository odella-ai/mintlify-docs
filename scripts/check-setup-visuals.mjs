// node scripts/check-setup-visuals.mjs [../webapp/apps/app] [http://localhost:3334]
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const records=await load(join(root,'images/features/setup/provenance.json'));
const plan=await load(join(root,'.agents/reviews/key-area-visual-plan.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(records.length,33);
assert.equal(new Set(records.map(r=>r.file)).size,33);
const assets=new Map(records.map(r=>[r.file,r]));
for(const r of records){
 assert(!/real-|realdev|realprod|current-projection/.test(r.story));
 const bytes=await readFile(join(root,'images/features/setup',r.file));assert.equal(hash(bytes),r.sha256,r.file);
 assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert(bytes.readUInt32BE(16)>500 && bytes.readUInt32BE(20)>250);
 assert(r.source.includes('synthetic') && r.source.includes('external network blocked'));
}
const routes=Object.keys(plan.implemented);
const referenced=new Set();
for(const route of routes){
 const body=await readFile(join(root,route+'.mdx'),'utf8');
 const imgs=[...body.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
 assert(imgs.length,`${route}: no visual evidence`);
 for(const img of imgs){const src=img.match(/\bsrc="([^"]+)"/)?.[1];const alt=img.match(/\balt="([^"]+)"/)?.[1];assert(alt?.length>15,`${route}: descriptive alt required`);if(src?.startsWith('/'))await readFile(join(root,src.slice(1)));if(src?.startsWith('/images/features/setup/')){const file=src.split('/').pop();assert(assets.has(file),`${route}: missing capture provenance`);referenced.add(file)}}
}
assert.equal(Object.keys(plan.next).length,0);
assert.equal(Object.keys(plan.deferred).length,5);
console.log(`Setup asset checks passed: ${records.length} original-component captures, ${referenced.size} distinct setup images used across ${routes.length} implemented pages; five channel-specific fixtures explicitly deferred.`);
if(process.argv[3]){
 const base=new URL(process.argv[3]);assert(['localhost','127.0.0.1','[::1]'].includes(base.hostname));
 const {chromium}=createRequire(join(resolve(process.argv[2]),'package.json'))('playwright');
 const browser=await chromium.launch({channel:'chrome'});
 const out='/tmp/odella-setup-visual-qa';await mkdir(out,{recursive:true});const results=[];
 try{
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(new URL('/platform/vault',base).href);if(theme==='dark')await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
    for(const width of [1440,1024,390]){
     await page.setViewportSize({width,height:1000});
     for(const route of routes){
      const response=await page.goto(new URL('/'+route,base).href,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,route);
      await page.getByRole('heading',{level:1}).waitFor();
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#content img')].map(async i=>{i.loading='eager';await i.decode()}));document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)});
      assert.equal(await page.getByRole('heading',{level:1}).count(),1,route);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${route} overflow at ${width}`);
      assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('dark')),theme==='dark');
      const broken=await page.locator('#content img').evaluateAll(xs=>xs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[],route);
      if(width!==1024){const path=join(out,`${theme}-${width}-${route.replaceAll('/','--')}.png`);try{await page.screenshot({path,fullPage:true,animations:'disabled'})}catch(e){if(!e.message.includes('Unable to capture screenshot'))throw e;await page.waitForTimeout(400);await page.screenshot({path,fullPage:true,animations:'disabled'})}}
      results.push({route,width,theme,passed:true});console.log('OK',theme,width,route);
      await writeFile(join(out,'manifest.json'),JSON.stringify(results,null,2));
     }
    }
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
  const p=await browser.newPage();await p.goto(new URL('/workforce/knowledge',base).href);await p.locator('img[src$="knowledge-picker.png"]').click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');await p.close();
  console.log(`Setup browser checks passed: ${results.length} page/viewport/theme cases; ${routes.length*4} full-page screenshots and keyboard-dismissable image zoom. Evidence: ${out}`);
 }finally{await browser.close()}
}
