import * as T from 'three';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,dark:T.Material,ground:(x:number,z:number)=>number};
// June 2024 Hough Lane/Eagley Way view. Approximate position on mapped access 655432309.
export function addBridgeSideGate({box,batch,stone,dark,ground}:Helpers):P[]{
 const world=(u:number,v:number):P=>[115.41+u*.595+v*.804,21.28-u*.804+v*.595],rot=Math.atan2(.804,.595),floor=ground(115.41,21.28);
 const B=(u:number,y:number,v:number,w:number,h:number,d:number,m:T.Material)=>{const [x,z]=world(u,v);box(x,y,z,w,h,d,m,rot)};
 // Wall returns flank the narrow approach. Terrain is sampled per section.
 for(const side of [-1,1])for(let j=0;j<6;j++){const v=.3+j*.5,[x,z]=world(side*.93,v),y=ground(x,z);B(side*.93,y+.43,v,.45,.86,.53,stone);B(side*.93,y+.9,v,.53,.12,.54,stone)}
 for(const u of [-.66,.66]){B(u,floor+.7,0,.065,1.4,.065,dark);const cap=new T.SphereGeometry(.055,8,5),[x,z]=world(u,0);cap.translate(x,floor+1.43,z);batch(cap,dark)}
 for(const u of [-.6,.6])B(u,floor+.65,0,.045,1.22,.045,dark);
 for(const y of [.12,.47,1.18])B(0,floor+y,0,1.2,.035,.045,dark);
 for(let k=0;k<9;k++){const u=-.53+k*.1325;B(u,floor+.72,0,.02,1.31,.024,dark);const finial=new T.ConeGeometry(.035,.12,4),[x,z]=world(u,0);finial.rotateY(rot);finial.translate(x,floor+1.41,z);batch(finial,dark);B(u,floor+.5,0,.045,.055,.035,dark)}
 for(const y of [.27,1.05])B(-.63,floor+y,0,.12,.065,.09,dark);
 B(.49,floor+.85,.045,.18,.045,.045,dark);
 return [world(-.66,0),world(.66,0)];
}
