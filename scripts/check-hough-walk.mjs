import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('outputs', { recursive: true });
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:[]});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.render_game_to_text==='function',null,{timeout:60000});
await page.waitForFunction(()=>!document.querySelector('#start-btn').disabled);await page.screenshot({path:'outputs/hough-title.png'});const expectedVersion=fs.readFileSync('lib/world-version.ts','utf8').match(/WORLD_VERSION = "([^"]+)"/)[1];assert.ok((await page.locator('body').innerText()).includes(expectedVersion),'Wrong preview world');await page.locator('#start-btn').click();
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
await page.keyboard.press('e');if((await state()).mode!=='walk')throw Error('Exit car failed');
await page.keyboard.press('e');if((await state()).mode!=='drive')throw Error('Re-enter failed');
await page.keyboard.press('c');if((await state()).camera!==1)throw Error('Camera failed');await page.keyboard.press('c');await page.keyboard.press('c');
await page.keyboard.press('Escape');if(!(await state()).paused)throw Error('Pause failed');await page.getByRole('button',{name:'Continue exploring'}).click();
await page.keyboard.press('m');if(!(await state()).map)throw Error('Map failed');await page.keyboard.press('m');
const data=JSON.parse(fs.readFileSync('public/eagley-map.json','utf8'));const get=id=>data.roads.find(r=>r.id===id).points;
const route=[...get('155008522').slice(1),...get('120133751').slice(1),...get('681379569').slice(1)];
const result=await page.evaluate(({route})=>{
 const press=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));
 const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];const set=(arr)=>keys.forEach(k=>press(k,arr.includes(k)));
 let index=0,steps=0,stuck=0,old=null,trace=[];
 while(index<route.length&&steps<4000){const s=JSON.parse(window.render_game_to_text()),p=s.player,t=route[index],d=Math.hypot(t[0]-p.x,t[1]-p.z);if(d<3){index++;continue}const wanted=Math.atan2(t[0]-p.x,t[1]-p.z),err=Math.atan2(Math.sin(wanted-p.yaw),Math.cos(wanted-p.yaw));let arr=[];if(err>.035)arr.push('ArrowLeft');if(err<-.035)arr.push('ArrowRight');const target=Math.abs(err)>.5?3:Math.abs(err)>.2?4.5:7;if(p.speed<target)arr.push('ArrowUp');else if(p.speed>target+1)arr.push('Space');set(arr);window.advanceTime(100,false);steps++;
 if(old&&Math.hypot(p.x-old.x,p.z-old.z)<.008)stuck++;else stuck=0;old=p;if(steps%200===0)trace.push({index,steps,p,d,err});if(stuck>60)break;
 }
 set(['Space']);window.advanceTime(1600,false);set([]);window.advanceTime(1);return {index,total:route.length,steps,trace,state:JSON.parse(window.render_game_to_text())};
},{route});
console.log(JSON.stringify(result));fs.writeFileSync('outputs/hough-drive-result.json',JSON.stringify(result,null,2));await page.screenshot({path:'outputs/hough-drive-final.png'});
assert.equal(result.index,route.length,'Driving route incomplete');
await page.keyboard.press('e');
assert.equal((await state()).mode,'walk');
const north=[[132.46,15.3],[134.1,10.8],[135.83,6.33],[138.35,1.34],[140.865,-3.655],[143.38,-8.65],[145.9,-13.64],[146.4,-16.2],[146.8,-19],[146.6,-21.2],[146.6,-24.3],[146.5,-26.2],[146.8,-28.5]];
for(const [label,points] of [['north',north],['south',north.slice().reverse()]]){
 const result=await page.evaluate(points=>{
  const press=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));
  const trace=[];let maxHeightStep=0,previousY;
  for(const [x,z] of points){
   let reached=false;
   for(let n=0;n<700;n++){
    const p=JSON.parse(window.render_game_to_text()).player;
    if(previousY!==undefined)maxHeightStep=Math.max(maxHeightStep,Math.abs(p.y-previousY));previousY=p.y;
    if(Math.hypot(x-p.x,z-p.z)<.24){reached=true;break;}
    const err=Math.atan2(Math.sin(Math.atan2(x-p.x,z-p.z)-p.yaw),Math.cos(Math.atan2(x-p.x,z-p.z)-p.yaw));
    press('ArrowLeft',err>.025);press('ArrowRight',err<-.025);press('ArrowUp',Math.abs(err)<.12);window.advanceTime(50,false);
   }
   trace.push({target:[x,z],reached,player:JSON.parse(window.render_game_to_text()).player});if(!reached)break;
  }
  ['ArrowUp','ArrowLeft','ArrowRight'].forEach(k=>press(k,false));window.advanceTime(1);
  return {trace,maxHeightStep};
 },points);
 console.log(label,JSON.stringify(result));fs.writeFileSync(`outputs/hough-walk-${label}.json`,JSON.stringify(result,null,2));
 await page.screenshot({path:`outputs/hough-walk-${label}.png`});
 assert.equal(result.trace.length,points.length,'Footbridge route incomplete');assert.ok(result.trace.every(t=>t.reached),'Footbridge blocked');assert.ok(result.maxHeightStep<.12,'Abrupt walking height change');
}
console.log('ERRORS',errors);await browser.close();assert.equal(errors.length,0,errors.join('\n'));
