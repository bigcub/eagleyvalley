import {passageWallZ} from './bridge-passage';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,trim:T.Material,dark:T.Material,glass:T.Material,base:number};
export function addBridgeFront({box,batch,stone,trim,dark,glass,base}:Helpers){
 const white=new T.MeshStandardMaterial({color:'#eeeae0',roughness:.72}),brass=new T.MeshStandardMaterial({color:'#a68b51',metalness:.7,roughness:.3});
 const planter=new T.MeshStandardMaterial({color:'#a68a4e',roughness:.9}),foliage=new T.MeshStandardMaterial({color:'#3c5934',roughness:.9}),slate=new T.MeshStandardMaterial({color:'#454947',roughness:.9});
 const south=(x:number)=>19.55+(x-80)*.041;
 const B=(x:number,y:number,w:number,h:number,d:number,m:T.Material,offset=.12)=>box(x,base+y,south(x)+Math.max(.015,offset-.17),w,h,Math.min(d,.11),m,-.041);
 function sash(x:number,y:number){B(x,y,1.53,2.24,.16,dark,.04);B(x,y,1.43,2.14,.15,white,.13);B(x,y,1.29,1.98,.16,glass,.22);for(let c=-1;c<=1;c++)B(x+c*.32,y,.035,1.98,.035,white,.32);for(let r=-2;r<=2;r++)B(x,y+r*.33,1.29,.032,.035,white,.32);B(x,y,1.38,.065,.05,white,.35);B(x,y-1.18,1.75,.13,.43,stone,.16);B(x,y+1.23,1.8,.25,.18,stone,.08)}
 const doorColours=['#274c70','#503447','#164d38','#273b52','#344d43'];
 for(let bay=0;bay<9;bay++){const x=79.7+bay*3.12;sash(x,5.05);if(bay%2){sash(x,1.54);continue}
 const door=new T.MeshStandardMaterial({color:doorColours[bay/2],roughness:.55});B(x,1.15,1.72,2.38,.2,white,.12);B(x,1.15,1.22,2.22,.18,door,.24);
 for(const side of [-1,1]){B(x+side*.74,1.16,.22,2.3,.08,white,.26);for(const y of [.32,1.04,1.84])B(x+side*.74,y,.15,.48,.035,trim,.32);for(const y of [.43,1.19,1.87])B(x+side*.3,y,.48,.54,.05,door,.36)}
 B(x,2.73,1.66,.86,.17,white,.16);B(x,2.73,1.5,.72,.17,glass,.26);for(let c=-2;c<=2;c++)B(x+c*.3,2.73,.026,.72,.035,white,.36);B(x,2.73,1.5,.025,.035,white,.36);B(x,3.28,1.96,.3,.2,stone,.13);B(x,.72,.37,.09,.045,brass,.39);B(x+.48,1.04,.06,.19,.04,brass,.4);B(x,-.02,1.98,.17,.65,stone,.34);
 // Small front gates and potted topiary flank each entrance.
 for(const side of [-1,1]){const px=x+side*1.04,pz=south(px)+.87;const pot=new T.CylinderGeometry(.25,.19,.47,14);pot.translate(px,base+.235,pz);batch(pot,planter);const stem=new T.CylinderGeometry(.025,.038,1.5,6);stem.translate(px,base+1.05,pz);batch(stem,dark);for(let j=0;j<4;j++){const crown=new T.SphereGeometry(.21-j*.014,8,6);crown.scale(1.05,.8,1);crown.translate(px+Math.sin(j*3+bay)*.08,base+.65+j*.31,pz);batch(crown,foliage)}
 for(let n=0;n<5;n++)box(px,base+.53,south(px)+.23+n*.22,.025,1.02,.025,dark);for(const y of [.22,.85])box(px,base+y,south(px)+.67,.035,.035,1.05,dark);
 }
 B(x,3.7,.17,.32,.18,dark,.18);B(x,3.7,.12,.22,.17,new T.MeshStandardMaterial({color:'#e4c47f',emissive:'#cf9a43',emissiveIntensity:.3}),.27);
 }
 for(const x of [77.8,90.8,104.4]){B(x,3.6,.075,7.3,.075,dark,.22);B(x,7.1,.12,.12,.28,dark,.22)}
 // Individual flags at the doorstep; irregular setts fill the shared passage.
 const stones=Array.from({length:7},(_,i)=>new T.MeshStandardMaterial({color:new T.Color().setHSL(.12,.12,.20+i*.025),roughness:.72}));
 const sett=new RoundedBoxGeometry(.4,.13,.25,1,.035);for(let col=0;col<81;col++){const x=74+col*.43;for(let row=0;row<24;row++){const z=south(x)+1.35+row*.27;if(z>passageWallZ(x)-.8)continue;const n=col*41+row*37,j=n%7,g=sett.clone();g.rotateY(Math.sin(n)*.065);g.translate(x+(row%2)*.13,base-.07+Math.sin(n)*.012,z);batch(g,stones[j])}}sett.dispose();
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
 const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute([75.35,eave,11.1,78.95,eave,11.25,75.08,eave,17.08,78.72,eave,17.25,75.22,eave+1.25,14.1,78.84,eave+1.25,14.25],3));roof.setIndex([0,1,5,0,5,4,2,4,5,2,5,3]);roof.computeVertexNormals();batch(roof,new T.MeshStandardMaterial({color:'#41494d',side:T.DoubleSide,roughness:.85}));
 const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([75.61,eave,11.34,75.38,eave,16.86,75.5,eave+1.25,14.1],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,2.76,0,1.38,.625],2));gable.computeVertexNormals();batch(gable,stone);
 const white=new T.MeshStandardMaterial({color:'#e2e2d8',roughness:.8});
 for(const x of [76.3,77.65]){const z=11.34+(x-75.61)*.045;box(x,floor+1.64,z,1.02,2.15,.13,white,-.045);box(x,floor+1.64,z-.09,.86,1.98,.06,glass,-.045);for(const dx of [-.21,0,.21])box(x+dx,floor+1.64,z-.14,.025,1.98,.035,white);for(let j=-2;j<=2;j++)box(x,floor+1.64+j*.33,z-.14,.87,.025,.035,white);box(x,floor+.51,z,1.14,.13,.34,stone)}
 box(77,eave,11.3,3.55,.12,.14,dark,-.045);box(75.65,floor+1.6,11.33,.08,3.2,.08,dark);
 return p;
}
