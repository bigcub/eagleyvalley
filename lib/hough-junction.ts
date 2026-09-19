import * as T from 'three';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,ground:(x:number,z:number)=>number,dark:T.Material,stone:T.Material,trim:T.Material};
// June2024 DQl_iPlCOrF2ekkB6nUQbQ headings65/154. Positions interpreted against OSM.
export function addHoughJunction({box,batch,ground,dark,stone,trim}:Helpers){
 const barriers:{a:P,b:P}[]=[];
 // Three removable black bollards across the old lane, not the driving bend.
 for(const t of [-1.55,0,1.55]){
  const x=147.9+t*.12,z=-23.1+t*.993,y=ground(x,z);
  box(x,y+.045,z,.38,.09,.38,stone);box(x,y+.52,z,.13,.95,.13,dark);
  box(x,y+1.02,z,.18,.045,.18,trim);
  barriers.push({a:[x-.09,z],b:[x+.09,z]});
 }
 // Short stone posts beside the protected pavement.
 for(const [x,z] of [[147.55,-26],[148.2,-20.2]]){const y=ground(x,z);box(x,y+.4,z,.26,.8,.28,stone);barriers.push({a:[x-.14,z],b:[x+.14,z]})}
 // Pedestrian railing follows the bend, with a gap at the old-lane entrance.
 const rail:P[]=[[147.55,-26],[147.4,-30.5],[146.4,-33.9],[144.1,-37.13]];
 for(let j=1;j<rail.length;j++){const a=rail[j-1],b=rail[j],len=Math.hypot(b[0]-a[0],b[1]-a[1]),rot=Math.atan2(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.16);
  for(let k=0;k<=n;k++){const t=k/n,x=T.MathUtils.lerp(a[0],b[0],t),z=T.MathUtils.lerp(a[1],b[1],t);box(x,ground(x,z)+.55,z,.018,1.05,.018,dark)}
  for(const h of [.2,1.05]){const g=new T.BoxGeometry(.035,.035,len);const p=g.getAttribute('position');for(let k=0;k<p.count;k++){const t=(p.getZ(k)+len/2)/len;p.setY(k,p.getY(k)+T.MathUtils.lerp(ground(...a),ground(...b),t)+h)}g.rotateY(rot);g.translate((a[0]+b[0])/2,0,(a[1]+b[1])/2);batch(g,dark)}barriers.push({a,b});
 }
 // Paired 30mph signs observed at the bridge mouth.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#a73d36';ctx.beginPath();ctx.arc(64,64,62,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e4e2d7';ctx.beginPath();ctx.arc(64,64,48,0,Math.PI*2);ctx.fill();ctx.fillStyle='#252b2a';ctx.font='bold 53px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('30',64,67);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const face=new T.MeshStandardMaterial({map,roughness:.8,side:T.FrontSide});
 for(const [x,z] of [[140.4,-18.9],[147.9,-16.1]]){const y=ground(x,z);box(x,y+1.45,z,.065,2.9,.065,trim);const g=new T.CircleGeometry(.3,32);g.rotateY(Math.PI+.45);g.translate(x-Math.sin(.45)*.065,y+2.55,z-Math.cos(.45)*.065);batch(g,face);const back=g.clone();const backMaterial=new T.MeshStandardMaterial({color:'#737a76',side:T.BackSide,roughness:.8});batch(back,backMaterial)}
 return barriers;
}
