import * as T from 'three';
type P=[number,number];
// Approximate overhead trace, tied to OSM access ways 762841712–715.
// These are landscape edges, not surveyed ownership boundaries.
export const brookParking:P[]=[[15,-43],[29,-57],[41,-57],[42,-62],[47,-62],[47,-56],[63,-54],[63,-24],[22,-27],[17,-32]];
export function addBrookParking(batch:(g:T.BufferGeometry,m:T.Material)=>void,box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,height:(x:number,z:number)=>number,asphalt:T.Material,paint:T.Material,kerb:T.Material){
 const shape=new T.Shape(brookParking.map(([x,z])=>new T.Vector2(x,-z))),source=new T.ShapeGeometry(shape).toNonIndexed(),pos=source.getAttribute('position'),verts:number[]=[],uv:number[]=[];
 const tri=(a:P,b:P,c:P,level=0)=>{if(level<6&&Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(c[0]-b[0],c[1]-b[1]))>1.5){const ab:P=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:P=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:P=[(c[0]+a[0])/2,(c[1]+a[1])/2];tri(a,ab,ca,level+1);tri(ab,b,bc,level+1);tri(ca,bc,c,level+1);tri(ab,bc,ca,level+1)}else for(const [x,z] of [a,b,c]){verts.push(x,height(x,z)+.02,z);uv.push(x/8,z/8)}};
 for(let i=0;i<pos.count;i+=3)tri([pos.getX(i),-pos.getY(i)],[pos.getX(i+1),-pos.getY(i+1)],[pos.getX(i+2),-pos.getY(i+2)]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();batch(g,asphalt);source.dispose();
 // Rows follow the overhead arrangement; exact bay totals await close photographs.
 for(const row of [{x:30,z:-52,n:4,yaw:-.085},{x:48,z:-51,n:5,yaw:-.085},{x:46,z:-44,n:6,yaw:-Math.PI/2-.085},{x:37,z:-44,n:5,yaw:-Math.PI/2-.085},{x:60,z:-42,n:5,yaw:-Math.PI/2-.085}]){
  for(let k=0;k<=row.n;k++){const x=row.x+Math.cos(row.yaw)*k*2.45,z=row.z-Math.sin(row.yaw)*k*2.45;for(let d=-2.25;d<2.3;d+=.15){const xx=x+Math.sin(row.yaw)*d,zz=z+Math.cos(row.yaw)*d;box(xx,height(xx,zz)+.045,zz,.075,.025,.16,paint,row.yaw)}}
 }
 for(let i=0;i<brookParking.length;i++){if(i===3)continue;const a=brookParking[i],b=brookParking[(i+1)%brookParking.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len);for(let j=0;j<n;j++){const t=(j+.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;box(x,height(x,z)+.05,z,.16,.15,len/n+.02,kerb,Math.atan2(b[0]-a[0],b[1]-a[1]))}}
}
export function addBrookHedges(scene:T.Scene,leaf:T.Material,height:(x:number,z:number)=>number){
 const runs=[{a:[23,-26],b:[61,-23],w:1,h:.8},{a:[62,-28],b:[63,-33],w:1.25,h:1},{a:[63,-37],b:[64,-42],w:1.25,h:1},{a:[34,-36],b:[34,-32],w:2,h:.9},{a:[30,-46],b:[31,-44],w:2,h:.8}];
 const clusters:{x:number,z:number,h:number,w:number}[]=[];for(const r of runs){const n=Math.ceil(Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])*3);for(let j=0;j<n;j++){const t=j/n;clusters.push({x:r.a[0]+(r.b[0]-r.a[0])*t,z:r.a[1]+(r.b[1]-r.a[1])*t,h:r.h,w:r.w})}}
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),leaf,clusters.length*18),o=new T.Object3D();let seed=930;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 clusters.forEach((c,i)=>{for(let j=0;j<18;j++){o.position.set(c.x+(rand()-.5)*c.w,height(c.x,c.z)+.15+rand()*c.h,c.z+(rand()-.5)*c.w);o.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);o.scale.setScalar(.45+rand()*.2);o.updateMatrix();mesh.setMatrixAt(i*18+j,o.matrix)}});mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
}
