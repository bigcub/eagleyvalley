import {slateMaterial,roofUV} from './building-surfaces';
import * as T from 'three';
export const courtHouseLocal=(x:number,z:number)=>[(x-40.42)*.997-(z-7.45)*.079,(x-40.42)*.079+(z-7.45)*.997];
export const courtDoorPositions=[1.7,14.1,22.0];
export function courtHouseGround(x:number,z:number,entry:number):number|undefined{
 const [u,v]=courtHouseLocal(x,z);if(u<0||u>23.6||v<0||v>3.05)return;
 return courtDoorPositions.some(d=>Math.abs(u-d)<.62)?entry:entry-2.35;
}
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,trim:T.Material,dark:T.Material,glass:T.Material,entry:number};
// Three attached homes opposite the garages. User confirms three storeys and door bridges.
// June 2024 Eagley Way panorama informs visible upper windows and entrance arrangement.
export function addCourtHouses({box,batch,stone,trim,dark,glass,entry}:Helpers){
 const base=entry-2.7,rot=Math.atan2(.079,.997),world=(u:number,v:number)=>[40.42+u*.997+v*.079,7.45-u*.079+v*.997];
 const B=(u:number,y:number,v:number,w:number,h:number,d:number,m:T.Material)=>{const [x,z]=world(u,v);if(m===stone){const g=new T.BoxGeometry(w,h,d),p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/2,(Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))/2);g.rotateY(rot);g.translate(x,y,z);batch(g,m)}else box(x,y,z,w,h,d,m,rot)};
 B(11.8,base+4.1,-3.88,23.6,8.2,7.76,stone);
 const roof=new T.BufferGeometry(),verts=[-.25,0,.25,23.85,0,.25,3.6,1.65,-3.88,20,1.65,-3.88,-.25,0,-8.01,23.85,0,-8.01],p:number[]=[];
 for(let i=0;i<verts.length;i+=3){const [x,z]=world(verts[i],verts[i+2]);p.push(x,base+8.2+verts[i+1],z)}roof.setAttribute('position',new T.Float32BufferAttribute(p,3));roof.setIndex([0,2,3,0,3,1,4,5,3,4,3,2,0,4,2,1,3,5]);roof.computeVertexNormals();roofUV(roof);batch(roof,slateMaterial());
 function window(u:number,y:number,v:number,w=1.05){const outward=v<0?-1:1;B(u,y,v,w+.18,1.45,.16,trim);B(u,y,v+outward*.09,w,1.29,.12,glass);B(u,y,v+outward*.17,.055,1.3,.05,trim);B(u,y+.12,v+outward*.17,w,.045,.05,trim);B(u,y-.8,v,w+.3,.14,.3,stone)}
 const bays=[1.7,3.65,6.05,8.95,11.35,14.1,17.0,19.5,22.0];
 for(const u of bays){window(u,entry+4.05,.08,courtDoorPositions.includes(u)?.7:1.05);if(!courtDoorPositions.includes(u))window(u,entry+1.35,.08);window(u,base+1.35,.08)}
 // Rear openings are provisional pending a closer view.
 for(const u of [2,5.7,9.9,13.6,17.8,21.5])for(const y of [base+1.35,entry+1.35,entry+4.05])window(u,y,-7.9);
 const door=new T.MeshStandardMaterial({color:'#313343',roughness:.75});
 for(const u of courtDoorPositions){B(u,entry+1.04,.15,.9,2.08,.16,door);B(u,entry+2.18,.12,1.1,.18,.2,stone);B(u+.28,entry+1.03,.26,.045,.12,.05,trim);B(u,entry-.11,1.5,1.2,.22,3.0,stone);
 for(const side of [-1,1]){for(let k=0;k<10;k++)B(u+side*.59,entry+.55,.15+k*.3,.025,1.1,.025,dark);for(const y of [.24,.98])B(u+side*.59,entry+y,1.5,.045,.045,3,dark)}}
 // Retain the sunken strip, leaving one crossing to each entrance.
 for(let u=.2;u<23.5;u+=.4){if(courtDoorPositions.some(d=>Math.abs(u-d)<.8))continue;B(u,entry-1.15,3.1,.42,2.3,.28,stone);B(u,entry+.03,3.1,.43,.13,.36,stone);B(u,entry+.52,3.1,.025,1,.025,dark);B(u,entry+.98,3.1,.43,.035,.04,dark)}
 for(const u of [0,7.86,15.72,23.6])B(u,entry+2.7,.18,.075,5.4,.075,dark);
}
