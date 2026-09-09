import * as T from 'three';
type P=[number,number];
type Helpers={box:(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void,batch:(g:T.BufferGeometry,m:T.Material)=>void,stone:T.Material,trim:T.Material,dark:T.Material,glass:T.Material,base:number,points:P[]};

// OSM footprint 727404344, with roof and facade composition interpreted from
// Historic England 1388260 and Sarah Bowles' March 2024 photograph.
export function addSchoolHouse({box,batch,stone,trim,dark,glass,base,points}:Helpers){
 const rot=-Math.atan2(.427,.904),world=(u:number,v:number):P=>[50.53+u*.904+v*.427,-98.6+u*.427-v*.904];
 const B=(u:number,y:number,v:number,w:number,h:number,d:number,m:T.Material)=>{const [x,z]=world(u,v);box(x,base+y,z,w,h,d,m,rot)};
 // Local v points north-west. Transform each vertex explicitly to avoid reflected normals.
 function mesh(vertices:number[],indices:number[],material:T.Material){const g=new T.BufferGeometry(),coords:number[]=[],uv:number[]=[];for(let i=0;i<vertices.length;i+=3){const [x,z]=world(vertices[i],vertices[i+2]);coords.push(x,base+vertices[i+1],z);uv.push(vertices[i]/2,vertices[i+1]/2)}g.setAttribute('position',new T.Float32BufferAttribute(coords,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();batch(g,material)}
 const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1])));const body=new T.ExtrudeGeometry(shape,{depth:5.4,bevelEnabled:false});body.rotateX(-Math.PI/2);body.translate(0,base,0);const uv=body.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/2,uv.getY(i)/2);batch(body,stone);
 const slate=new T.MeshStandardMaterial({color:'#4c5354',roughness:.88,side:T.DoubleSide});
 const gableStone=(stone as T.MeshStandardMaterial).clone();gableStone.side=T.DoubleSide;
 const dress=new T.MeshStandardMaterial({color:'#b9b098',roughness:.9,side:T.DoubleSide});
 function beam(u1:number,y1:number,v1:number,u2:number,y2:number,v2:number,w:number,m:T.Material){const a=world(u1,v1),b=world(u2,v2),start=new T.Vector3(a[0],base+y1,a[1]),end=new T.Vector3(b[0],base+y2,b[1]),delta=end.clone().sub(start),g=new T.BoxGeometry(w,delta.length(),w);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());batch(g,m)}
 function roof(u:number,v:number,w:number,d:number,eave:number,rise:number){
  mesh([u-w/2,eave,v,u+w/2,eave,v,u,eave+rise,v,u-w/2,eave,v+d,u+w/2,eave,v+d,u,eave+rise,v+d],[0,1,2,3,5,4],gableStone);
  mesh([u-w/2-.18,eave,v-.18,u+w/2+.18,eave,v-.18,u,eave+rise,v-.18,u-w/2-.18,eave,v+d+.18,u+w/2+.18,eave,v+d+.18,u,eave+rise,v+d+.18],[0,2,5,0,5,3,1,4,5,1,5,2],slate);
  for(const end of [v-.22,v+d+.22]){beam(u-w/2,eave,end,u,eave+rise,end,.2,dress);beam(u,eave+rise,end,u+w/2,eave,end,.2,dress)}
  for(const side of [-1,1])B(u+side*w/2,eave-.05,v+d/2,.13,.13,d,dark);
 }
 // Two advanced front wings and a lower recessed connecting range.
 roof(4.5,0,9,17.1,5.4,5.6);roof(20.57,-.12,9.1,17.22,5.4,5.6);
 mesh([9,5.4,1.5,16.05,5.4,1.5,9,8.4,9.3,16.05,8.4,9.3,9,5.4,17.1,16.05,5.4,17.1],[0,1,3,0,3,2,2,3,5,2,5,4],slate);
 // Rear linear hall has its own steep roof and pointed five-light end windows.
 mesh([-3.2,5.4,16.9,28.8,5.4,16.9,-3.2,8.5,19.5,28.8,8.5,19.5,-3.2,5.4,22.05,28.8,5.4,22.05],[0,1,3,0,3,2,2,3,5,2,5,4],slate);
  mesh([-3.03,5.4,17.1,-3.03,5.4,21.86,-3.03,8.5,19.5,28.61,5.4,17.1,28.61,5.4,21.86,28.61,8.5,19.5],[0,1,2,3,5,4],gableStone);
 function light(u:number,v:number,y:number,w:number,h:number){B(u,y,v-.08,w+.28,h+.28,.16,dress);B(u,y,v-.18,w,h,.12,glass);for(const side of [-1,1])B(u+side*w/2,y,v-.27,.065,h,.07,trim);B(u,y,v-.27,.055,h,.07,trim);B(u,y,v-.27,w,.055,.07,trim);B(u,y-h/2-.15,v-.18,w+.45,.17,.35,dress)}
 for(const u of [4.5,20.57]){
  for(let k=-1;k<=1;k++){const h=k===0?3.75:2.95;light(u+k*1.0,-.15,1.25+h/2,.78,h);B(u+k,1.25+h+.32,-.34,1.08,.12,.18,dress)}
  // Small pointed gable vent.
  mesh([u-.28,7.45,-.2,u+.28,7.45,-.2,u,8.02,-.2],[0,1,2],dark);
 }
 for(const u of [10.6,14.2])light(u,1.68,2.8,1.35,2.6);
 for(const u of [8.4,16.6]){B(u,1.65,.8,2.1,3.3,2.1,stone);roof(u,-.25,2.1,2.1,3.3,1.65);B(u,1.35,-.38,1.25,2.65,.16,trim);B(u,1.3,-.5,1.02,2.5,.13,new T.MeshStandardMaterial({color:'#d9d7cb'}))}
 for(const v of [3,6.2,9.3]){B(25.18,2.7,v,.18,2.8,1.65,dress);B(25.3,2.7,v,.08,2.52,1.37,glass);B(25.36,2.7,v,.06,2.52,.065,trim);B(25.36,2.7,v,.06,.065,1.37,trim)}
 // Pointed five-light glazing to the old hall's exposed end.
 mesh([28.72,1.3,17.6,28.72,1.3,21.4,28.72,4.55,21.4,28.72,6.8,19.5,28.72,4.55,17.6],[0,1,2,0,2,3,0,3,4],glass);
 for(let k=-2;k<=2;k++){const h=5.25-Math.abs(k)*.65;B(28.8,1.3+h/2,19.5+k*.69,.09,h,.08,trim)}
 for(const y of [2.6,3.85])B(28.8,y,19.5,.09,.08,3.8,trim);
 for(const u of [0,9,16.05,25.1])B(u,2.7,.03,.09,5.4,.09,dark);
 // Low stone forecourt boundary with slender iron railings and entrance gaps.
 for(let u=0;u<25;u+=.45){if(Math.abs(u-8.4)<1||Math.abs(u-16.6)<1)continue;B(u,.25,-2.1,.46,.5,.4,stone);B(u,.9,-2.1,.035,1.1,.035,dark);for(const y of [.56,1.24])B(u,y,-2.1,.46,.035,.035,dark)}
 for(const u of [0,7.25,9.55,15.45,17.75,25]){B(u,.95,-2.1,.4,1.9,.4,stone);const cap=new T.ConeGeometry(.34,.5,4);const [x,z]=world(u,-2.1);cap.rotateY(rot+Math.PI/4);cap.translate(x,base+2.13,z);batch(cap,dress)}
}
