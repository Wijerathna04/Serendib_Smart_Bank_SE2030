// Run after npm run build; requires a local Playwright installation and Chrome.
// API fixtures exercise UI behavior without touching the bank database.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist');
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathname);
  if(!file.startsWith(root+sep)){file=resolve(root,'index.html');}
  try {const data=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(data);}
  catch {res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')));}
});
await new Promise(done=>server.listen(4179,'127.0.0.1',done));
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
const rates={base:'USD',rates:{USD:1,LKR:300,EUR:0.9,GBP:0.75,AUD:1.5,INR:84},updatedAt:'2026-10-02T00:00:00Z',stale:false};
async function fixture(role='CUSTOMER',viewport={width:1440,height:1000}){
  const context=await browser.newContext({viewport});const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/auth/**',route=>route.fulfill({json:route.request().url().endsWith('/login')?{token:'fixture'}:{userId:1,username:'fixture',role,email:'fixture@example.test',status:'ACTIVE'}}));
  await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('exchange-rates')?rates:route.request().url().includes('unread-count')?{count:0}:{content:[],page:0,size:20,totalElements:0,totalPages:0}}));
  return {context,page};
}
try {
  const {page,context}=await fixture();await page.goto('http://127.0.0.1:4179');
  await page.locator('.theme-toggle').click();
  const selectedTheme=await page.locator('html').getAttribute('data-theme');
  await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),selectedTheme);
  if(selectedTheme!=='light')await page.locator('.theme-toggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.screenshot({path:'dist/guest-light.png',fullPage:true});
  await page.locator('.theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.locator('.rate-tile').first().waitFor();assert.equal(await page.locator('.rate-tile').count(),5);
  assert.match(await page.locator('.rate-tile').nth(1).innerText(),/333.33/);
  for(let i=0;i<8;i++){await page.locator('.product-banner,.service-banner').nth(i).click();assert.equal(await page.locator('dialog').evaluate(el=>el.open),true);await page.keyboard.press('Escape');}
  await page.getByRole('button',{name:'සිංහල',exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),'si');
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'si');
  await page.getByRole('button',{name:'தமிழ்',exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),'ta');
  await page.getByRole('button',{name:'English',exact:true}).click();await page.screenshot({path:'dist/guest-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'dist/guest-mobile.png',fullPage:true});
  await page.route('**/api/exchange-rates',route=>route.fulfill({status:503,json:{message:'Unavailable'}}));await page.reload();await page.getByRole('button',{name:'Retry',exact:true}).waitFor();
  await context.close();
  for(const [role,title] of [['CUSTOMER','Customer dashboard'],['EMPLOYEE','Bank staff dashboard'],['MANAGER','Branch manager dashboard'],['ADMIN','System administrator dashboard']]){
    const {page,context}=await fixture(role);await page.goto('http://127.0.0.1:4179/login');
    await page.getByLabel('Username',{exact:true}).fill('fixture');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.locator('button.full').click();
    await page.getByRole('heading',{name:title,exact:true}).waitFor();
    const links=await page.locator('.sidebar nav a').allTextContents();
    if(role==='MANAGER'||role==='ADMIN')for(const label of ['Loan review','Loan decisions','Card requests','Feedback moderation'])assert.ok(links.some(s=>s.includes(label)));
    if(role==='ADMIN'){await page.getByRole('link',{name:'Bank operations'}).first().click();await page.getByRole('heading',{name:'Bank operations',exact:true}).waitFor();}
    if(role==='MANAGER'){await page.screenshot({path:'dist/manager-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: product dialogs, three languages, preference persistence, rate conversion and failure state, four role logins, inherited navigation, admin oversight and mobile widths.');
} finally {await browser.close();server.close();}
