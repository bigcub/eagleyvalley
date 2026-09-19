import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('outputs', { recursive: true });
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:[]});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(process.env.GAME_URL || 'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.render_game_to_text==='function',null,{timeout:60000});
await page.waitForFunction(()=>!document.querySelector('#start-btn').disabled);await page.screenshot({path:'outputs/title-final.png'});await page.locator('#start-btn').click();
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
await page.keyboard.press('e');if((await state()).mode!=='walk')throw Error('Exit car failed');
await page.keyboard.press('e');if((await state()).mode!=='drive')throw Error('Re-enter failed');
await page.keyboard.press('c');if((await state()).camera!==1)throw Error('Camera failed');await page.keyboard.press('c');await page.keyboard.press('c');
await page.keyboard.press('Escape');if(!(await state()).paused)throw Error('Pause failed');await page.getByRole('button',{name:'Continue exploring'}).click();
await page.keyboard.press('m');if(!(await state()).map)throw Error('Map failed');await page.keyboard.press('m');
const data=JSON.parse(fs.readFileSync('public/eagley-map.json','utf8'));const get=id=>data.roads.find(r=>r.id===id).points;
const route=[...get('155008522').slice(1),...get('120133751').slice(1),...get('681379569').slice(1),...get('681379568').slice(1),...get('73858744').slice(1),...get('727434505').slice(1),...get('655432303').slice(1),...get('727427321').slice(1),...get('73858737').slice().reverse().slice(1),...get('61959587').slice().reverse().slice(1,2),...get('655432310').slice(1),...get('655432311').slice(1,6)];
const result=await page.evaluate(({route})=>{
 const press=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));
 const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];const set=(arr)=>keys.forEach(k=>press(k,arr.includes(k)));
 let index=0,steps=0,stuck=0,old=null,trace=[];
 while(index<route.length&&steps<4000){const s=JSON.parse(window.render_game_to_text()),p=s.player,t=route[index],d=Math.hypot(t[0]-p.x,t[1]-p.z);if(d<3){index++;continue}const wanted=Math.atan2(t[0]-p.x,t[1]-p.z),err=Math.atan2(Math.sin(wanted-p.yaw),Math.cos(wanted-p.yaw));let arr=[];if(err>.035)arr.push('ArrowLeft');if(err<-.035)arr.push('ArrowRight');const target=Math.abs(err)>.5?3:Math.abs(err)>.2?4.5:7;if(p.speed<target)arr.push('ArrowUp');else if(p.speed>target+1)arr.push('Space');set(arr);window.advanceTime(100,false);steps++;
 if(old&&Math.hypot(p.x-old.x,p.z-old.z)<.008)stuck++;else stuck=0;old=p;if(steps%200===0)trace.push({index,steps,p,d,err});if(stuck>60)break;
 }
 set(['Space']);window.advanceTime(1600,false);set([]);window.advanceTime(1);return {index,total:route.length,steps,trace,state:JSON.parse(window.render_game_to_text())};
},{route});
console.log(JSON.stringify(result));fs.writeFileSync('outputs/journey-result.json',JSON.stringify(result,null,2));await page.screenshot({path:'outputs/journey-final.png'});
assert.equal(result.index,route.length,'Driving route incomplete');
if(result.index===route.length){await page.keyboard.press('e');if((await state()).mode!=='walk')throw Error('Exit at mill failed');await page.evaluate(()=>{const press=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));for(let n=0;n<400;n++){const p=JSON.parse(window.render_game_to_text()).player,dx=27-p.x,dz=22-p.z;if(Math.hypot(dx,dz)<.4)break;const e=Math.atan2(Math.sin(Math.atan2(dx,dz)-p.yaw),Math.cos(Math.atan2(dx,dz)-p.yaw));press('ArrowLeft',e>.04);press('ArrowRight',e<-.04);press('ArrowUp',Math.abs(e)<.2);window.advanceTime(100,false)}['ArrowUp','ArrowLeft','ArrowRight'].forEach(k=>press(k,false));window.advanceTime(1)});await page.keyboard.press('e');if((await state()).activeCar!==2)throw Error('Switching to parked car failed');await page.keyboard.press('e');console.log('VEHICLE SWITCH PASSED');const walkResult=await page.evaluate(()=>{const press=(code,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));const route=[[49,12],[69,12],[73,17],[74,21.7],[83,22.4],[94,24]];for(const t of route){for(let n=0;n<800;n++){const p=JSON.parse(window.render_game_to_text()).player;const d=Math.hypot(t[0]-p.x,t[1]-p.z);if(d<1.2)break;const err=Math.atan2(Math.sin(Math.atan2(t[0]-p.x,t[1]-p.z)-p.yaw),Math.cos(Math.atan2(t[0]-p.x,t[1]-p.z)-p.yaw));press('ArrowLeft',err>.04);press('ArrowRight',err<-.04);press('ArrowUp',Math.abs(err)<.2);window.advanceTime(100,false)}}['ArrowUp','ArrowLeft','ArrowRight'].forEach(k=>press(k,false));window.advanceTime(1);return JSON.parse(window.render_game_to_text())});console.log('WALK',JSON.stringify(walkResult));assert.equal(walkResult.mode,'walk');assert.equal(walkResult.arrived,true,'Frontage not reached');fs.writeFileSync('outputs/walk-result.json',JSON.stringify(walkResult,null,2));await page.screenshot({path:'outputs/bridge-front-walk.png'});}
await page.keyboard.press('r');const reset=await state();if(Math.abs(reset.player.x+283.473)>1)throw Error('Reset failed');
fs.writeFileSync('outputs/game-errors.json',JSON.stringify(errors,null,2));console.log('ERRORS',JSON.stringify(errors));await browser.close();assert.equal(errors.length,0,errors.join('\n'));
