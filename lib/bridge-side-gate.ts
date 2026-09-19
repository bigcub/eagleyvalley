import * as T from 'three';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,dark:T.Material,paving:T.Material,ground:(x:number,z:number)=>number};
export const gateWorld=(u:number,v:number):P=>[115.41+u*.595+v*.804,21.28-u*.804+v*.595];
export function gateLocal(x:number,z:number):P{const dx=x-115.41,dz=z-21.28;return [(dx*.595-dz*.804)/1.000441,(dx*.804+dz*.595)/1.000441]}
// June 2024 Hough Lane/Eagley Way view. Approximate position on mapped access 655432309.
export function addBridgeSideGate({box,batch,stone,dark,paving,ground}:Helpers):{a:P,b:P}[]{
 const world=gateWorld,barriers:{a:P,b:P}[]=[],rot=Math.atan2(.804,.595),floor=ground(115.41,21.28);
 const B=(u:number,y:number,v:number,w:number,h:number,d:number,m:T.Material)=>{const [x,z]=world(u,v);box(x,y,z,w,h,d,m,rot)};
 // June 2024 view: entrance widens toward the road, with curved low returns.
 // Positions and dimensions remain interpreted from the view and mapped path.
 for(const side of [-1,1])for(let j=0;j<14;j++){
  const v0=j*3.2/14,v1=(j+1)*3.2/14;
  const edge=(v:number)=>side*(.9+.7*Math.pow(v/3.2,2));
  const a=world(edge(v0),v0),b=world(edge(v1),v1),ya=ground(...a),yb=ground(...b),len=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[0]-a[0],b[1]-a[1]);
  barriers.push({a,b});
  for(const cap of [false,true]){const g=new T.BoxGeometry(cap?.58:.48,cap?.12:.86,len+.025),pos=g.getAttribute('position');for(let k=0;k<pos.count;k++){const t=(pos.getZ(k)+len/2)/len;pos.setY(k,pos.getY(k)+T.MathUtils.lerp(ya,yb,t)+(cap?.9:.43))}g.rotateY(angle);g.translate((a[0]+b[0])/2,0,(a[1]+b[1])/2);g.computeVertexNormals();batch(g,stone)}
 }
 for(const u of [-.66,.66]){B(u,floor+.7,0,.065,1.4,.065,dark);const cap=new T.SphereGeometry(.055,8,5),[x,z]=world(u,0);cap.translate(x,floor+1.43,z);batch(cap,dark)}
 for(const u of [-.6,.6])B(u,floor+.65,0,.045,1.22,.045,dark);
 for(const y of [.12,.47,1.18])B(0,floor+y,0,1.2,.035,.045,dark);
 for(let k=0;k<9;k++){const u=-.53+k*.1325;B(u,floor+.72,0,.02,1.31,.024,dark);const finial=new T.ConeGeometry(.035,.12,4),[x,z]=world(u,0);finial.rotateY(rot);finial.translate(x,floor+1.41,z);batch(finial,dark);B(u,floor+.5,0,.045,.055,.035,dark)}
 for(const y of [.27,1.05])B(-.63,floor+y,0,.12,.065,.09,dark);
 B(.49,floor+.85,.045,.18,.045,.045,dark);
 // Paving shares the same level function as walking and underlying terrain.
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let j=0;j<=16;j++){const v=j*3.2/16,w=.9+.7*Math.pow(v/3.2,2)-.22;for(const u of [-w,w]){const [x,z]=world(u,v);positions.push(x,ground(x,z),z);uv.push(u,v)}if(j){const k=j*2;indices.push(k-2,k-1,k,k-1,k+1,k)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();batch(g,paving);
 barriers.push({a:world(-.66,0),b:world(.66,0)});return barriers;
}

// User-confirmed separate entrance to the cobbled passage. Dimensions are interpreted.
export function addPassageGate({box,dark}:Pick<Helpers,'box'|'dark'>,floor:number):{a:P,b:P}[]{
 const x=110,z0=23.05,z1=24.4,mid=(z0+z1)/2;
 for(const z of [z0,z1])box(x,floor+.65,z,.07,1.3,.07,dark);
 for(const y of [.15,.55,1.17])box(x,floor+y,mid,.045,.035,z1-z0-.08,dark);
 for(let i=0;i<10;i++)box(x,floor+.65,z0+.1+i*(z1-z0-.2)/9,.022,1.17,.022,dark);
 for(const y of [.25,1.06])box(x,floor+y,z0,.1,.06,.14,dark);
 box(x+.04,floor+.85,z1-.13,.045,.045,.19,dark);
 return [{a:[x,z0],b:[x,z1]}];
}
