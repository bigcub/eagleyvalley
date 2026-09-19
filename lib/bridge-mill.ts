import {slateMaterial,roofUV} from './building-surfaces';
import {createPottedTopiary} from './potted-topiary';
import {settMaterials} from './sett-material';
import {passageWallZ} from './bridge-passage';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,trim:T.Material,dark:T.Material,glass:T.Material,base:number};
export function addBridgeFront({box,batch,stone,trim,dark,glass,base}:Helpers){
 const white=new T.MeshStandardMaterial({color:'#eeeae0',roughness:.72}),brass=new T.MeshStandardMaterial({color:'#a68b51',metalness:.7,roughness:.3});
 const topiary=createPottedTopiary(batch);
 const south=(x:number)=>19.55+(x-80)*.041;
 const B=(x:number,y:number,w:number,h:number,d:number,m:T.Material,offset=.12)=>box(x,base+y,south(x)+Math.max(.015,offset-.17),w,h,Math.min(d,.11),m,-.041);
 function sash(x:number,y:number){B(x,y,1.53,2.24,.16,dark,.04);B(x,y,1.43,2.14,.15,white,.13);B(x,y,1.29,1.98,.16,glass,.22);for(let c=-1;c<=1;c++)B(x+c*.32,y,.035,1.98,.035,white,.32);for(let r=-2;r<=2;r++)B(x,y+r*.33,1.29,.032,.035,white,.32);B(x,y,1.38,.065,.05,white,.35);B(x,y-1.18,1.75,.13,.43,stone,.16);B(x,y+1.23,1.8,.25,.18,stone,.08)}
 const doorColours=['#274c70','#503447','#164d38','#273b52','#344d43'];
 for(let bay=0;bay<9;bay++){const x=79.7+bay*3.12;sash(x,5.05);if(bay%2){sash(x,1.54);continue}
 const door=new T.MeshStandardMaterial({color:doorColours[bay/2],roughness:.55});B(x,1.15,1.72,2.38,.2,white,.12);B(x,1.15,1.22,2.22,.18,door,.24);
 for(const side of [-1,1]){B(x+side*.74,1.16,.22,2.3,.08,white,.26);for(const [y,h] of [[.24,.3],[1.1,1.22],[2.02,.27]]){B(x+side*.74,y,.17,h,.035,trim,.32);B(x+side*.74,y,.125,h-.055,.025,white,.35)}for(const [y,h] of [[.43,.58],[1.24,.67],[1.96,.3]])B(x+side*.3,y,.48,h,.05,door,.36)}
 B(x,2.73,1.66,.86,.17,white,.16);B(x,2.73,1.5,.72,.17,glass,.26);for(const c of [-1.5,-.5,.5,1.5])B(x+c*.3,2.73,.026,.72,.035,white,.36);B(x,2.73,1.5,.025,.035,white,.36);B(x,3.28,1.96,.3,.2,stone,.13);B(x,.72,.37,.09,.045,brass,.39);B(x+.48,1.04,.06,.19,.04,brass,.4);B(x,-.02,1.98,.17,.65,stone,.34);
 // Small front gates and potted topiary flank each entrance.
 for(const side of [-1,1]){const px=x+side*1.04,pz=south(px)+.87;topiary(px,base,pz,bay*2+side,bay===4);
 for(let n=0;n<5;n++)box(px,base+.53,south(px)+.23+n*.22,.025,1.02,.025,dark);for(const y of [.22,.85])box(px,base+y,south(px)+.67,.035,.035,1.05,dark);
 }
 B(x,3.7,.17,.32,.18,dark,.18);B(x,3.7,.12,.22,.17,new T.MeshStandardMaterial({color:'#e4c47f',emissive:'#cf9a43',emissiveIntensity:.3}),.27);
 }
 for(const x of [77.8,90.8,104.4]){B(x,3.6,.075,7.3,.075,dark,.22);B(x,7.1,.12,.12,.28,dark,.22)}
 // Individual flags at the doorstep; irregular setts fill the shared passage.
 const stones=settMaterials();
 const joints=new T.MeshStandardMaterial({color:'#454638',roughness:1});
 for(let x=74;x<109;x+=.43){const z0=south(x)+1.15,z1=passageWallZ(x)-.7;box(x,base-.1,(z0+z1)/2,.45,.025,z1-z0,joints)}
 // Cross-passage courses, with variable stone lengths and staggered joints.
 // Tops stay within a few millimetres of the existing walking surface.
 let seed=4107;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const sett=new RoundedBoxGeometry(1,.08,1,2,.013);
 const moss=new T.MeshStandardMaterial({color:'#4b5231',roughness:1});
 let course=0;
 for(let x=74;x<108.9;){
   const width=.23+random()*.07,cx=x+width/2,start=south(cx)+1.2,end=passageWallZ(cx)-.76;
   let z=start;
   while(z<end-.055){
     const length=Math.min((z===start&&course%2?.19:.33)+random()*.2,end-z);
     const gap=.01+random()*.009,g=sett.clone();
     g.scale(width-.012,1,length-gap);g.rotateY((random()-.5)*.025);
     g.translate(cx,base-.04+(random()-.5)*.005,z+length/2);batch(g,stones[Math.floor(random()*stones.length)]);
     if(random()<.38){const patch=new T.PlaneGeometry(width*(.35+random()*.5),gap*.85);patch.rotateX(-Math.PI/2);patch.translate(cx,base-.025,z+length-gap*.4);batch(patch,moss)}
     z+=length;
   }
   x+=width;course++;
 }
 sett.dispose();
 for(let x=75;x<108;x+=.65)box(x,base-.06,south(x)+.65,.62,.12,1.1,stones[Math.floor(x)%7],-.041);
 // The passage turns around the western end to the garage court.
 for(let x=72;x<76;x+=.45)for(let z=12;z<27;z+=.3)box(x,base-.1,z,.42,.12,.27,stones[Math.floor(x+z)%7]);
}

// Original OSM western projection, retained separately from the main mill volume.
// Historic England identifies this as a former boiler house; roof height is estimated.
export function addBridgeEngineHouse({box,batch,stone,dark,glass,base}:Helpers){
 const p:P[]=[[75.61,11.34],[78.7,11.48],[78.46,17.01],[75.38,16.86]];
 const floor=base-.55,eave=floor+3.2;
 const shape=new T.Shape(p.map(q=>new T.Vector2(q[0],-q[1])));
 const body=new T.ExtrudeGeometry(shape,{depth:6.25,bevelEnabled:false});body.rotateX(-Math.PI/2);body.translate(0,base-3.6,0);const uv=body.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2,uv.getY(i)/2);batch(body,stone);
 const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute([75.35,eave,11.1,78.95,eave,11.25,75.08,eave,17.08,78.72,eave,17.25,75.22,eave+1.25,14.1,78.84,eave+1.25,14.25],3));roof.setIndex([0,1,5,0,5,4,2,4,5,2,5,3]);roof.computeVertexNormals();roofUV(roof);batch(roof,slateMaterial());
 const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([75.61,eave,11.34,75.38,eave,16.86,75.5,eave+1.25,14.1],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,2.76,0,1.38,.625],2));gable.computeVertexNormals();batch(gable,stone);
 const white=new T.MeshStandardMaterial({color:'#e2e2d8',roughness:.8});
 for(const x of [76.3,77.65]){const z=11.34+(x-75.61)*.045;box(x,floor+1.64,z,1.02,2.15,.13,white,-.045);box(x,floor+1.64,z-.09,.86,1.98,.06,glass,-.045);for(const dx of [-.21,0,.21])box(x+dx,floor+1.64,z-.14,.025,1.98,.035,white);for(let j=-2;j<=2;j++)box(x,floor+1.64+j*.33,z-.14,.87,.025,.035,white);box(x,floor+.51,z,1.14,.13,.34,stone)}
 box(77,eave,11.3,3.55,.12,.14,dark,-.045);box(75.65,floor+1.6,11.33,.08,3.2,.08,dark);
 return p;
}
