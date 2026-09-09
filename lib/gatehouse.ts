import * as T from 'three';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,glass:T.Material,dark:T.Material,stone:T.Material,base:number,foundationBottom:number,points:P[]};
// Public June 2024 Eagley Way panorama: rendered gable, cross windows and lower porch.
// Footprint is mapped; heights, roof pitch and concealed elevations remain estimates.
export function addGatehouse({box,batch,glass,dark,stone,base,foundationBottom,points}:Helpers){
 const ux=.662,uz=-.749,rot=Math.atan2(-uz,ux),world=(u:number,v:number):P=>[-288.91+u*ux+v*uz,148.86+u*uz-v*ux];
 const cream=new T.MeshStandardMaterial({color:'#d7d5c7',roughness:.97,side:T.DoubleSide});
 const frame=new T.MeshStandardMaterial({color:'#deded4',roughness:.8});
 const slate=new T.MeshStandardMaterial({color:'#626767',roughness:.92,side:T.DoubleSide});
 const wood=new T.MeshStandardMaterial({color:'#302426',roughness:.85});
 const B=(u:number,y:number,v:number,w:number,h:number,d:number,m:T.Material)=>{const [x,z]=world(u,v);box(x,base+y,z,w,h,d,m,rot)};
 function mesh(coords:number[],indices:number[],m:T.Material){const g=new T.BufferGeometry(),p:number[]=[];for(let i=0;i<coords.length;i+=3){const [x,z]=world(coords[i],coords[i+2]);p.push(x,base+coords[i+1],z)}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(coords.flatMap((_,i)=>i%3===0?[coords[i]/2,coords[i+1]/2]:[]),2));g.setIndex(indices);g.computeVertexNormals();batch(g,m)}
 const footprint=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z))),body=new T.ExtrudeGeometry(footprint,{depth:base-foundationBottom+3.2,bevelEnabled:false});body.rotateX(-Math.PI/2);body.translate(0,foundationBottom,0);batch(body,cream);
 // Taller entrance gable and a lower slate crosswing.
 B(2.75,4.6,3.7,5.5,2.8,7.4,cream);
 mesh([0,6,0,5.5,6,0,2.75,8.3,0,0,6,7.4,5.5,6,7.4,2.75,8.3,7.4],[0,1,2,3,5,4],cream);
 mesh([-.18,6,-.18,5.68,6,-.18,2.75,8.3,-.18,-.18,6,7.6,5.68,6,7.6,2.75,8.3,7.6],[0,2,5,0,5,3,1,4,5,1,5,2],slate);
 mesh([5.4,3.2,-.18,11.7,3.2,-.18,5.4,5.4,2.8,11.7,5.4,2.8,5.4,3.2,5.6,11.7,3.2,5.6],[0,1,3,0,3,2,2,3,5,2,5,4],slate);
 mesh([11.5,3.2,0,11.5,5.4,2.8,11.5,3.2,5.6],[0,1,2],cream);
 function window(u:number,y:number,w:number,h:number,columns:number){B(u,y,-.09,w+.17,h+.13,.16,dark);B(u,y,-.19,w,h,.08,glass);for(let i=0;i<=columns;i++)B(u-w/2+w*i/columns,y,-.26,.08,h,.07,frame);for(const yy of [y-h/2,y,y+h/2])B(u,yy,-.26,w,.08,.07,frame);B(u,y+h/2+.15,-.12,w+.45,.22,.22,dark);B(u,y-h/2-.13,-.17,w+.4,.16,.32,dark)}
 window(2.75,1.7,2.7,2.25,3);window(2.75,5.2,2.7,2.3,3);
 window(6.75,1.65,.75,1.95,1);
 B(8.65,1.2,-.12,1.25,2.4,.17,dark);B(8.65,1.17,-.23,1.05,2.3,.1,wood);
 for(const y of [.6,1.55,2.05])for(const u of [8.38,8.92])B(u,y,-.3,.43,y===2.05?.3:.65,.07,wood);
 B(8.65,1.08,-.36,.4,.055,.04,new T.MeshStandardMaterial({color:'#96846a',metalness:.55,roughness:.4}));
 B(8.2,2.8,-.1,5.4,.28,.2,dark);B(2.75,.15,-.1,5.5,.23,.17,dark);
 for(const u of [0,5.55,11.4])B(u,1.6,-.13,.075,3.2,.075,dark);
 B(5.5,4.5,-.13,.075,2.6,.075,dark);B(8.4,3.18,-.23,6,.1,.12,dark);
 B(10.35,5.3,3.3,.55,1.15,.55,stone);
 // Low frontage wall and narrow pedestrian gate, clear of the pavement and doorway.
 for(let u=.1;u<11.4;u+=.5){if(Math.abs(u-8.65)<.75)continue;B(u,.3,-.8,.5,.6,.27,stone);B(u,.76,-.8,.52,.055,.055,dark)}
 for(const u of [.1,5.6,7.8,9.5,11.3])B(u,.55,-.8,.33,1.1,.33,stone);
 for(let u=8;u<=9.3;u+=.16)B(u,.57,-.81,.025,1.03,.035,dark);
 for(const y of [.22,.83])B(8.65,y,-.81,1.3,.035,.045,dark);
}
