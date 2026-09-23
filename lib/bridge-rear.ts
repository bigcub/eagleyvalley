import * as T from 'three';
type P=[number,number];
// Existing five garden divisions, not surveyed property boundaries. IMG_8274 confirms
// one pair of French doors per house and solid timber dividers at the patios.
export const rearDivisions=[78.79,83,88.7,94,100.3,106.95];
export const rearWallZ=(x:number)=>9.43+(x-78.79)*(1.17/28.16);
export function rearFormation(x:number,z:number,base:number,natural:number){
 if(x<rearDivisions[0]||x>rearDivisions[5])return undefined;
 const depth=rearWallZ(x)-z;if(depth<0||depth>4.5)return undefined;
 return T.MathUtils.lerp(base,natural,T.MathUtils.smoothstep(depth,2.9,4.5));
}
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,dark:T.Material,glass:T.Material,base:number};
export function addBridgeRear({box,batch,stone,dark,glass,base}:Helpers){
 const white=new T.MeshStandardMaterial({color:'#eeeae2',roughness:.72});
 const metal=new T.MeshStandardMaterial({color:'#8f8974',metalness:.65,roughness:.4});
 const timber=new T.MeshStandardMaterial({color:'#626966',roughness:1});
 const timberLight=new T.MeshStandardMaterial({color:'#737972',roughness:1});
 const lanternGlass=new T.MeshStandardMaterial({color:'#9b9a83',roughness:.6});
 const joints=new T.MeshStandardMaterial({color:'#666657',roughness:1});
 const slabs=['#aba28a','#a59e89','#b2aa93','#989580'].map(color=>new T.MeshStandardMaterial({color,roughness:1}));
 const rot=-Math.atan(1.17/28.16),floor=base+.13;
 // North-facing layers move north toward the viewer, so glazing/bars are not buried.
 const B=(x:number,y:number,w:number,h:number,m:T.Material,offset=.12,d=.055)=>box(x,floor+y,rearWallZ(x)-offset,w,h,d,m,rot);
 function opening(x:number,width:number,height:number,bottom:number){
  B(x,bottom+height/2,width+.18,height+.15,dark,.06,.09);
  B(x,bottom+height/2,width,height,white,.13,.12);
  B(x,bottom+height/2,width-.15,height-.14,glass,.205,.045);
  B(x,bottom+height+.18,width+.42,.29,stone,.1,.23);
  B(x,bottom-.055,width+.28,.13,stone,.2,.36);
 }
 for(let i=0;i<5;i++){
  const a=rearDivisions[i],b=rearDivisions[i+1],span=b-a;
  // The photo shows a sash beside each paired door. Spacing within each plot is inferred.
  const door=a+span*.31,window=a+span*.74;
  opening(door,1.5,2.65,.08);
  // Two glazed leaves, central meeting stiles, low rails and separate transom.
  B(door,1.13,.09,2.1,white,.255);
  for(const side of [-1,1]){
   const x=door+side*.365;
   B(x,1.1,.034,1.87,white,.257);
   for(let row=1;row<=5;row++)B(x,.2+row*.34,.65,.03,white,.257);
   B(x,.18,.66,.18,white,.26);
   B(door+side*.105,1.02,.025,.19,metal,.295,.045);
  }
  B(door,2.22,1.42,.1,white,.26);
  for(const dx of [-.45,-.15,.15,.45])B(door+dx,2.49,.025,.4,white,.255);
  // Tall neighbouring multi-pane sash, above the patio rather than down to the ground.
  opening(window,1.4,2.15,.43);
  for(const dx of [-.32,0,.32])B(window+dx,1.505,.028,2.01,white,.255);
  for(let row=1;row<6;row++)B(window,.43+row*2.15/6,1.26,.027,white,.255);
  B(window,1.5,1.34,.07,white,.27);
  // Black lantern above the door, as in the photograph.
  B(door,3.1,.12,.32,dark,.18,.12);
  B(door,3.12,.11,.19,lanternGlass,.27,.08);
  const cap=new T.ConeGeometry(.115,.14,4);cap.rotateY(Math.PI/4);cap.translate(door,floor+3.3,rearWallZ(door)-.23);batch(cap,dark);
  // Weathered rectangular flags with dark joints. No user photo is used as a texture.
  const depth=2.85;box((a+b)/2,floor-.08,rearWallZ((a+b)/2)-depth/2,span-.08,.12,depth,joints,rot);
  const columns=Math.ceil(span/.72),rows=4;
  for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
   const x=a+(c+.5)*span/columns,z=rearWallZ(x)-(r+.5)*depth/rows;
   box(x,floor-.035,z,span/columns-.018,.065,depth/rows-.018,slabs[(c*3+r+i)%slabs.length],rot);
  }
 }
 const barriers:{a:P,b:P}[]=[];
 // Four solid grey timber screens, one at each shared patio edge, extending to lawn.
 for(const x of rearDivisions.slice(1,-1)){
  const wall=rearWallZ(x),end=wall-3.05;
  for(let k=0;k<23;k++){
   const z=wall-.07-(k+.5)*2.98/23;
   box(x,floor+.83,z,.07,1.66,2.98/23-.003,k%4===0?timberLight:timber);
  }
  for(const z of [wall-.08,end])box(x,floor+.89,z,.12,1.78,.12,timber);
  box(x,floor+1.69,(wall+end)/2,.12,.065,3.05,timberLight);
  for(const y of [.25,1.25])box(x+.055,floor+y,(wall+end)/2,.06,.09,3,timber);
  // Downpipe on the house beside each divider.
  B(x+.1,1.8,.065,3.6,dark,.18,.07);
  barriers.push({a:[x,wall-.06],b:[x,end]});
 }
 return barriers;
}
