import * as T from 'three';
type Box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void;
// East elevation from the local Geograph reference and Historic England 1388079.
// Three bays each side of the stair tower. Dimensions remain interpreted.
export function addBrookEntrance(base:number,box:Box,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,brick:T.Material,trim:T.Material,glass:T.Material,dark:T.Material){
 const rot=-.0854,cx=113.42,cz=-35.27;
 const point=(u:number,d:number):[number,number]=>[cx+Math.sin(rot)*u+Math.cos(rot)*d,cz+Math.cos(rot)*u-Math.sin(rot)*d];
 const b=(u:number,y:number,d:number,w:number,h:number,depth:number,m:T.Material)=>{const [x,z]=point(u,d);box(x,base+y,z,depth,h,w,m,rot)};
 const shape=(points:[number,number][],u:number,y:number,d:number,m:T.Material)=>{const s=new T.Shape(points.map(p=>new T.Vector2(...p))),g=new T.ShapeGeometry(s);g.rotateY(Math.PI/2);g.rotateY(rot);const [x,z]=point(u,d);g.translate(x,base+y,z);batch(g,m)};
 const framed=(u:number,y:number,w:number,h:number,d:number,arched=false)=>{
  if(arched){const arch=(ww:number,hh:number):[number,number][]=>{const p:[number,number][]=[[-ww/2,-hh/2],[ww/2,-hh/2],[ww/2,hh/2-.22]];for(let k=1;k<=16;k++){const x=ww/2-ww*k/16;p.push([x,hh/2-.22+.22*(1-Math.pow(x/(ww/2),2))])}return p};shape(arch(w+.2,h+.2),u,y,d+.06,trim);shape(arch(w,h),u,y,d+.13,glass)}
  else{b(u,y,d,w+.2,h+.2,.12,trim);b(u,y,d+.08,w,h,.08,glass)}
  for(const du of [-w/2,0,w/2])b(u+du,y-(arched?.11:0),d+.16,.05,h-(arched?.22:0),.04,dark);
  for(const dy of [-h/2,-h/4,0,h/4])b(u,y+dy,d+.16,w,.045,.04,dark);
 };

 // Solid tower front masks the former evenly spaced central pair of openings.
 b(0,9,.26,5.5,18,.75,brick);b(0,1.8,.28,5.5,3.6,.8,stone);
 for(const u of [-11,-7.7,-4.4,4.4,7.7,11])for(let floor=0;floor<5;floor++)framed(u,floor*3.6+1.75,1.65,2.55,.16,floor===3);
 for(let floor=1;floor<5;floor++)framed(0,floor*3.6+1.75,1.95,2.7,.7);
 for(const u of [-2.55,2.55]){b(u,9,.75,.4,18,.3,brick);for(let y=.5;y<18;y+=1.15)b(u,y,.93,.46,.17,.12,trim)}
 for(let floor=1;floor<=5;floor++){b(0,floor*3.6-.1,.79,5.9,.24,.35,trim);for(const side of [-1,1])b(side*8,floor*3.6-.1,.16,10,.18,.4,trim)}
 // Clock stage with brick pediment and small corner finials.
 b(0,19.55,.2,4.65,3.1,1.8,brick);b(0,18.2,.3,6.05,.5,2,trim);b(0,21.14,.3,4.95,.18,2,trim);
 const pedimentMat=new T.MeshStandardMaterial({color:'#9a5946',side:T.DoubleSide,roughness:1});
 shape([[-2.5,0],[2.5,0],[0,1.75]],0,21.2,1.27,pedimentMat);
 for(const u of [-2.5,2.5]){b(u,21.4,1.23,.16,.65,.16,trim);const finial=new T.SphereGeometry(.18,8,6);const [x,z]=point(u,1.23);finial.translate(x,base+21.8,z);batch(finial,trim)}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e5dfc9';ctx.beginPath();ctx.arc(128,128,123,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#343735';ctx.lineWidth=7;ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(128+Math.sin(a)*99,128-Math.cos(a)*99);ctx.lineTo(128+Math.sin(a)*112,128-Math.cos(a)*112);ctx.stroke()}ctx.beginPath();ctx.moveTo(75,90);ctx.lineTo(128,128);ctx.lineTo(173,59);ctx.stroke();const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const face=new T.CircleGeometry(1.02,48);face.rotateY(Math.PI/2+rot);const [fx,fz]=point(0,1.15);face.translate(fx,base+19.75,fz);batch(face,new T.MeshStandardMaterial({map:tex,roughness:.8}));
 // Offset pointed porch, visible at the left of the east-facing reference.
 const porch=4.1;b(porch,1.65,1.0,2.65,3.3,1.8,stone);
 const stoneFace=new T.MeshStandardMaterial({color:'#b1a38a',roughness:1,side:T.DoubleSide});shape([[-1.52,0],[1.52,0],[0,1.3]],porch,3.3,1.93,stoneFace);
 shape([[-.73,0],[.73,0],[.73,2.2],[0,2.85],[-.73,2.2]],porch,.1,1.96,dark);
 b(porch,.1,2.0,2.8,.2,1.05,trim);b(porch,1.1,2.02,.04,1.9,.04,trim);
 framed(-1.25,1.8,1.0,2.15,.81);framed(1.25,1.8,1.0,2.15,.81);
 return [point(porch-1.4,.1),point(porch+1.4,.1),point(porch+1.4,2.5),point(porch-1.4,2.5)];
}
