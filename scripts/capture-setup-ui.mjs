// Real product components + explicitly synthetic stories only. Never capture real/dev/prod account fixture stories.
// node scripts/capture-setup-ui.mjs ../webapp/apps/app http://127.0.0.1:6119 [comma-separated shot names]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(process.argv[2] ?? '../webapp/apps/app');
const base = new URL(process.argv[3] ?? 'http://127.0.0.1:6119');
assert(['localhost','127.0.0.1','[::1]'].includes(base.hostname));
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'images/features/setup'); await mkdir(out, { recursive:true });
const sha = b => createHash('sha256').update(b).digest('hex');
const sourceHead = execFileSync('git',['rev-parse','HEAD'],{cwd:app,encoding:'utf8'}).trim();
const shots = [
 ['identity','workforce-settings-identity--identity','Role'],
 ['instructions','workforce-settings-identity--general-instructions','Instructions'],
 ['employee-resources','workforce-employee-page--skills','Alex'],
 ['workspace','workforce-employee-page--skills','Workspace','tab:workspace'],
 ['skills-catalog','workforce-skill-workshop--skills-catalog','Skills'],
 ['skill-review','workforce-skill-workshop--pending-review','Review'],
 ['skill-approved','workforce-skill-workshop--approved-for-application','Invoice'],
 ['task-create','workforce-tasks-create-task--with-attachments','Create'],
 ['approval','approvals-task-panel--email-send','Send'],
 ['approval-tool','approvals-task-panel--notion-write','Notion'],
 ['activity','workforce-activity-trace-panel-prototype--mixed-activity','Activity'],
 ['store-setup','document-store-creation--step-1-setup','Store'],
 ['store-sync','document-store-creation--step-2-sync','Sync'],
 ['store-columns','document-store-creation--step-3-columns','Column'],
 ['store-records','document-store-status-badges--mixed-default','Ready'],
 ['store-ready','document-store-status-badges--quick-filter-ready','Ready'],
 ['pdf-editor','template-builder-redesign-editor--pdf-document-editor','PDF'],
 ['docx-editor','template-builder-redesign-editor--docx-document-editor','DOCX'],
 ['template-field','template-builder-redesign-sidebars--docx-selected-field-settings','Company Name'],
 ['template-upload','template-builder-redesign-modals--new-template-review','Template'],
 ['security-policies','workforce-settings-security-privacy--saved-recipients','Outbound'],
 ['phone-numbers','account-phone-numbers--list-with-numbers','Phone'],
 ['phone-reserve','account-phone-numbers--purchase-dialog-default','number'],
 ['models','account-models-page--models','Models'],
 ['billing','account-billing-page--healthy','Billing'],
 ['vault-grants','docs-key-areas--vault-employee-access','Read only'],
 ['knowledge-picker','workforce-employee-page--skills','Alex'],
 ['skills-picker','workforce-employee-page--skills','Alex'],
 ['tools-picker','workforce-employee-page--skills','Alex'],
 ['templates-picker','workforce-employee-page--skills','Alex'],
 ['skill-create','workforce-skill-workshop--skills-catalog','Skills'],
 ['skill-diff','workforce-skill-workshop--pending-review','Invoice'],
 ['finance-policies','workforce-settings-security-privacy--empty-tool-rules','Inbound'],
];
const selected = process.argv[4]?.split(',');
const index = await (await fetch(new URL('/index.json',base))).json();
const {chromium} = createRequire(join(app,'package.json'))('playwright');
const browser = await chromium.launch({channel:'chrome'});
let previous = [];try { previous = JSON.parse(await readFile(join(out,'provenance.json'),'utf8')); } catch {}
const records = previous.filter(r => selected && !selected.includes(r.name));
const failures = [];
const assets = [];
for (const dir of ['channel_logos','vendor_logos']) for (const file of await readdir(join(app,'public/images',dir))) assets.push({file,path:join(app,'public/images',dir,file)});
const aliases = {google_drive:'googledrive',microsoft_teams:'microsoftteams',one_drive:'onedrive'};
try {
 for (const [name,story,expected,args] of shots) {
  if (selected && !selected.includes(name)) continue;
  assert(!/real-|realdev|realprod|current-projection/.test(story));
  const entry = index.entries[story];
  if (!entry) { failures.push({name,reason:'Story missing: '+story}); console.log('FAIL',name,'missing story'); continue; }
  const context = await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:2,timezoneId:'Europe/London',reducedMotion:'reduce'});
  const page = await context.newPage();const errors=[];const fixtures=[];
  const detailsBytes = await readFile(join(root,'.agents/fixtures/employee-skills-details.json'));
  await page.addInitScript(({details}) => {
    const wrap = fn => async (...args) => {
      const raw = args[0]; const u = new URL(typeof raw==='string'?raw:raw instanceof URL?raw.href:raw.url, location.href);
      if (u.pathname==='/api/employees/alex-morgan/skills' && u.searchParams.get('view')==='details') return new Response(JSON.stringify({json:{data:details}}),{headers:{'Content-Type':'application/json'}});
      if (u.pathname==='/api/employees/alex-morgan/assignments') return new Response(JSON.stringify({json:{data:details.assignments}}),{headers:{'Content-Type':'application/json'}});
      return fn(...args);
    };
    let current=wrap(window.fetch.bind(window));Object.defineProperty(window,'fetch',{configurable:true,get:()=>current,set:fn=>{current=wrap(fn)}});
  }, {details:JSON.parse(detailsBytes)});
  fixtures.push({kind:'Synthetic employee resource projection, replacing outdated Storybook ID-only payload',file:'.agents/fixtures/employee-skills-details.json',sha256:sha(detailsBytes)});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   try {
   const u=new URL(route.request().url());
   if (u.origin===base.origin && u.pathname==='/images/vendor_logos/figma.svg') {
    const bytes=await readFile(join(out,'fixtures/figma.svg'));
    fixtures.push({kind:'Official vendor artwork for missing synthetic catalog asset',url:'https://static.figma.com/app/icon/1/favicon.svg',sha256:sha(bytes)});
    return route.fulfill({contentType:'image/svg+xml',body:bytes});
   }
   if (u.origin===base.origin && u.pathname==='/.storybook/stories/account-phone-numbers.stories.tsx') {
    const response=await route.fetch();const original=await response.text();
    const body=original.replaceAll('+442071838750','+442079460123');
    fixtures.push({kind:'Synthetic phone data safety',replacement:'Ofcom-reserved UK drama number +44 20 7946 0123; no live number used'});
    return route.fulfill({response,body});
   }
   if (u.origin===base.origin && u.pathname==='/.storybook/mocks/workforce-skill-data.ts') {
    const response=await route.fetch();const original=await response.text();
    const body=original+'\nfor (const tk of storyToolkits) for (const plugin of tk.plugins ?? []) if (plugin.id === "composio:slack") plugin.logo = "/images/channel_logos/slack.svg";\n';
    fixtures.push({kind:'Synthetic catalog metadata completion',source:'Actual app Slack SVG; no product UI modified'});
    return route.fulfill({response,body});
   }
   if (u.origin===base.origin && u.pathname==='/.storybook/mocks/backendUrl.ts') {
    const response=await route.fetch();let body=await response.text();
    for (const [key,value] of Object.entries({getBackendUrlForAccount:'() => window.location.origin',getClaimsFromToken:'() => null',getServerBackendAudience:'() => window.location.origin',SERVER_REGIONS:'["us-east4"]'})) if (!new RegExp(`\\b${key}\\b`).test(body)) {body+=`\nexport const ${key} = ${value};`;fixtures.push({kind:'missing routing-only Storybook mock',export:key});}
    return route.fulfill({response,body});
   }
   if(u.origin===base.origin || ['data:','blob:'].includes(u.protocol))return route.continue();
   if(route.request().resourceType()==='image' && /logos\.composio\.dev$/.test(u.hostname)) {
    let slug=u.pathname.split('/').pop().toLowerCase();slug=aliases[slug]??slug;
    const found=assets.find(a=>a.file.replace(/\.(svg|png)$/,'').replaceAll(/[-_]/g,'').toLowerCase()===slug.replaceAll(/[-_]/g,''));
    if(found){const bytes=await readFile(found.path);fixtures.push({kind:'local actual vendor logo',url:u.href,file:found.path.slice(app.length+1),sha256:sha(bytes)});return route.fulfill({contentType:found.file.endsWith('.svg')?'image/svg+xml':'image/png',body:bytes});}
   }
   return route.abort();
   } catch { await route.abort().catch(()=>{}); }
  });
  try {
   await page.goto(new URL(`/iframe.html?id=${story}&viewMode=story&globals=theme:light${args?'&args='+args:''}`,base).href,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(({word})=>document.body.innerText.toLowerCase().includes(word.toLowerCase()) || /component failed to render|requested module.*does not|Couldn't find story/i.test(document.body.innerText),{word:expected},{timeout:75000});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
   const text=await page.locator('body').innerText();
   assert(!/component failed to render|Couldn't find story|No Preview|does not provide an export/i.test(text),text.slice(0,600));
   assert.deepEqual(errors,[]);
   let panel;
   if (name==='skill-review' || name==='skill-approved') {
    await page.getByRole('button',{name:'Review changes',exact:true}).click();
    await page.waitForTimeout(300);
    fixtures.push({kind:'UI interaction',action:'Open review decisions; no approval or merge submitted'});
   }
   if (name==='finance-policies') {
    await page.getByRole('radio',{name:/^Disabled/}).click();
    await page.getByRole('radio',{name:/^Restricted/}).click();
    fixtures.push({kind:'UI interaction',action:'Select Disabled outbound and Restricted tools in the local form; not saved'});
   }
   if (name==='security-policies' || name==='finance-policies') panel=page.locator('#storybook-root > div > div').first();
   if (name==='template-field') panel=page.getByText('Company Name',{exact:true}).first().locator('xpath=ancestor::section[1]');
   const category = { 'knowledge-picker':'Knowledge', 'skills-picker':'Skills', 'tools-picker':'Tools', 'templates-picker':'Templates' }[name];
   if (category) {
    await page.getByRole('button',{name:new RegExp('^'+category+'(?:\\s|$)')}).first().click();
    if (name==='skills-picker') {
      await page.getByRole('dialog').waitFor(); panel=page.getByRole('dialog');
    } else {
      await page.getByRole('heading',{name:'Add '+category,exact:true}).waitFor();
      panel = page.getByRole('button',{name:'Close add skills panel',exact:true}).locator('xpath=../..');
    }
    if (name==='knowledge-picker' || name==='tools-picker') {
      await page.getByRole('tab',{name:/^Added/}).click();
      await page.waitForTimeout(250);
      fixtures.push({kind:'UI interaction',action:'Show existing synthetic assignment on Added tab'});
    }
    fixtures.push({kind:'UI interaction',action:'Open '+category+' capability picker; no assignment saved'});
   }
   if (name==='skill-create') {
    await page.getByRole('button',{name:/^(New skill|Create skill)$/}).first().click();
    await page.getByRole('dialog').waitFor();
    fixtures.push({kind:'UI interaction',action:'Open Create skill; no proposal submitted'});
   }
   await page.evaluate(()=>document.activeElement?.blur());
   const bad=await page.evaluate(async()=>{const bad=[];for(const i of document.images){if(!i.getClientRects().length)continue;try{await i.decode()}catch{bad.push(i.getAttribute('src'));continue}if(i.naturalWidth<=1)bad.push(i.getAttribute('src'))}return bad});
   assert.deepEqual(bad,[],`Broken images: ${JSON.stringify(bad)}`);
   const target=panel ?? (await page.getByRole('dialog').count()===1?page.getByRole('dialog'):page.locator('#storybook-root'));
   if (['template-field','knowledge-picker','tools-picker','skills-picker','security-policies','finance-policies'].includes(name)) {
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)});
    await page.waitForTimeout(50);
    const box=await target.boundingBox();assert(box && box.width>250 && box.y>=0);
    let height=Math.min(box.height,name==='skills-picker'?350:430);
    if (name==='security-policies' || name==='finance-policies') {
      const label=await page.getByText('Restricted',{exact:true}).boundingBox();assert(label);
      height=Math.min(box.height,Math.ceil(label.y+label.height+29-box.y));
    }
    const clip={x:box.x,y:box.y,width:box.width,height};
    await page.screenshot({path:join(out,name+'.png'),clip,fullPage:true,animations:'disabled'});
    fixtures.push({kind:'Unmodified UI crop',clip});
   } else await target.screenshot({path:join(out,name+'.png'),animations:'disabled',timeout:30000});
   const fixturePath=resolve(app,entry.importPath);
   records.push({name,file:name+'.png',story,sourceHead,fixturePath:fixturePath.startsWith(app)?fixturePath.slice(app.length+1):'.agents/fixtures/key-area-ui.stories.tsx',fixtureSha256:sha(await readFile(fixturePath)),viewport:{width:1440,height:960},deviceScaleFactor:2,timezone:'Europe/London',args:args??null,fixtureAssets:fixtures,source:'Actual product components; synthetic records only; external network blocked; no live action submitted.',sha256:sha(await readFile(join(out,name+'.png')))});
   console.log('OK',name,text.replaceAll('\n',' ').slice(0,130));
  }catch(e){failures.push({name,reason:e.message});await page.screenshot({path:'/tmp/odella-setup-failed-'+name+'.png'}).catch(()=>{});console.error('FAIL',name,e.message.slice(0,650));}
  finally{await writeFile(join(out,'provenance.json'),JSON.stringify(records,null,2)+'\n');await writeFile('/tmp/odella-setup-capture-failures.json',JSON.stringify(failures,null,2));await context.close()}
 }
}finally{await browser.close()}
await writeFile(join(out,'provenance.json'),JSON.stringify(records,null,2)+'\n');
await writeFile('/tmp/odella-setup-capture-failures.json',JSON.stringify(failures,null,2));
console.log(`${records.length} captures; ${failures.length} failures`);if(failures.length)process.exitCode=1;
