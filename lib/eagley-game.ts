import {addCourtHouses,courtHouseGround} from './court-houses';
import {addBridgeSideGate} from './bridge-side-gate';
import {passageWallZ} from './bridge-passage';
import {addRoadsideShrubs} from './roadside-shrubs';
import {addGatehouse} from './gatehouse';
import {addSchoolHouse} from './school-house';
import {addBridgeGardens} from './bridge-gardens';
import * as T from 'three';
import {masonryTexture} from './masonry-texture';
import {addTrees} from './realistic-trees';
import {addBridgeFront,addBridgeEngineHouse} from './bridge-mill';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
type P=[number,number];type Feature={id:string,name:string,tags:Record<string,string>,points:P[]};
export async function createGame(host:HTMLElement,onHud:(s:any)=>void){
 const data:any=await fetch('/eagley-map.json').then(r=>{if(!r.ok)throw Error('Map unavailable');return r.json()});
 const scene=new T.Scene();scene.background=new T.Color('#c9d5da');scene.fog=new T.FogExp2('#c9d5da',.0012);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;host.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(52,host.clientWidth/host.clientHeight,.2,1700);
 scene.add(new T.HemisphereLight('#e1f2f3','#777a68',1.65));const sun=new T.DirectionalLight('#fff3df',2.3);sun.position.set(-170,240,110);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:600});sun.shadow.bias=-.0006;sun.shadow.normalBias=.2;scene.add(sun,sun.target);
 const water:Feature[]=data.water.filter((w:Feature)=>w.name==='Eagley Brook');const roads:Feature[]=data.roads;const buildings:Feature[]=data.buildings;
 const segments=(fs:Feature[])=>fs.flatMap(f=>f.points.slice(1).map((b,i)=>({a:f.points[i],b,f})));
 const riverSeg=segments(water),roadSeg=segments(roads);
 const court:P[]=[[6,-7],[24,-7],[35,-3],[37,7],[40,9],[69,6],[73,9],[73,23],[41,26],[36,23],[31,30],[12,30],[7,23],[6,-7]];
 const courtAccess=segments([roads.find(f=>f.id==='655432311')!]),eagleySegments=segments(roads.filter(f=>f.name==='Eagley Way'));
 function nearest(x:number,z:number,segs:any[]){let best={d:Infinity,x:0,z:0,t:0,s:segs[0]};for(const s of segs){const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],t=T.MathUtils.clamp(((x-s.a[0])*dx+(z-s.a[1])*dz)/(dx*dx+dz*dz||1),0,1),px=s.a[0]+dx*t,pz=s.a[1]+dz*t,d=Math.hypot(px-x,pz-z);if(d<best.d)best={d,x:px,z:pz,t,s}}return best}
 const [survey,terrainBuffer]=await Promise.all([fetch('/eagley-survey.json').then(r=>{if(!r.ok)throw Error('Survey unavailable');return r.json() as Promise<{x0:number,z0:number,step:number,cols:number,rows:number,trees:number[][]}>}),fetch('/eagley-terrain.bin').then(r=>{if(!r.ok)throw Error('Terrain unavailable');return r.arrayBuffer()})]);
 const elevations=new Uint16Array(terrainBuffer);
 function sampledTerrain(x:number,z:number){const u=T.MathUtils.clamp((x-survey.x0)/survey.step,0,survey.cols-1.001),v=T.MathUtils.clamp((z-survey.z0)/survey.step,0,survey.rows-1.001),i=Math.floor(u),j=Math.floor(v),a=j*survey.cols+i;return T.MathUtils.lerp(T.MathUtils.lerp(elevations[a],elevations[a+1],u-i),T.MathUtils.lerp(elevations[a+survey.cols],elevations[a+survey.cols+1],u-i),v-j)/100}
 const bridgeBase=Math.min(...buildings.find(f=>f.name==='Bridge Mill')!.points.map(p=>sampledTerrain(...p)));
 const passageY=bridgeBase+3.6;
 // Retaining height follows the road above; the former hand-set slope was reversed.
 const passageWallHeight=(x:number)=>{const n=nearest(x,passageWallZ(x)+4,eagleySegments);return Math.max(.7,sampledTerrain(n.x,n.z)+.38+.74-(passageY-.25))};
 function inPassage(x:number,z:number){return x>71&&x<110&&z>12&&z<passageWallZ(x)+.35&&(x<76||z>19.55+(x-80)*.041)}
 const houseEntry=sampledTerrain(52,11)+.38;
 function passageApproach(x:number,z:number){
  if(x<68||x>72.5||z<11||z>23)return undefined;
  const weight=T.MathUtils.smoothstep(x,68,72)*T.MathUtils.smoothstep(z,11,13)*(1-T.MathUtils.smoothstep(z,21,23));
  const n=nearest(x,z,courtAccess),courtHeight=sampledTerrain(n.x,n.z)+.38;
  return T.MathUtils.lerp(courtHeight,passageY,weight);
 }
 function terrain(x:number,z:number){const well=courtHouseGround(x,z,houseEntry);if(well!==undefined)return houseEntry-2.51;const approach=passageApproach(x,z);if(approach!==undefined)return approach-.18;if(inPassage(x,z))return passageY-.18;if(x>74&&x<110&&z>passageWallZ(x)+.35){const n=nearest(x,z,eagleySegments);if(z<n.z&&n.d>3.2)return sampledTerrain(n.x,n.z)+.93}if(inPoly(x,z,court)){const n=nearest(x,z,courtAccess);return sampledTerrain(n.x,n.z)}if(x> -310&&x<120&&z>15&&z<180){const n=nearest(x,z,eagleySegments);if(n.d<5.4)return sampledTerrain(n.x,n.z);if(n.d<7)return T.MathUtils.lerp(sampledTerrain(n.x,n.z),sampledTerrain(x,z),(n.d-5.4)/1.6)}return sampledTerrain(x,z)}
 function riverY(x:number,z:number){const n=nearest(x,z,riverSeg);return terrain(n.x,n.z)+.12}
 function roadY(x:number,z:number,r=nearest(x,z,roadSeg)){if(r.s?.f.tags.bridge){const p=r.s.f.points,a=p[0],b=p[p.length-1],n=nearest(x,z,[{a,b}]);return T.MathUtils.lerp(terrain(a[0],a[1]),terrain(b[0],b[1]),n.t)+.38}return terrain(r.x,r.z)+.38}
 function courtY(x:number,z:number){const well=courtHouseGround(x,z,houseEntry);if(well!==undefined)return houseEntry-2.35;const approach=passageApproach(x,z);if(approach!==undefined)return approach;const n=nearest(x,z,courtAccess);return sampledTerrain(n.x,n.z)+.38}
 function ground(x:number,z:number){const well=courtHouseGround(x,z,houseEntry);if(well!==undefined)return well;const approach=passageApproach(x,z);if(approach!==undefined)return approach;if(inPassage(x,z))return passageY;if(inPoly(x,z,court))return courtY(x,z);const r=nearest(x,z,roadSeg);return r.d<width(r.s.f)/2+1.3?roadY(x,z,r):terrain(x,z)+.13}
 const mats:Record<string,T.Material>={},batches:Record<string,T.BufferGeometry[]>={};
 function mat(key:string,color:string,rough=1){if(!mats[key])mats[key]=new T.MeshStandardMaterial({color,roughness:rough});return mats[key] as T.MeshStandardMaterial}
 function batch(g:T.BufferGeometry,m:T.Material){const key=m.uuid;mats[key]=m;(batches[key]??=[]).push(g.index?g.toNonIndexed():g)}
 function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot=0){const g=new T.BoxGeometry(w,h,d);g.rotateY(rot);g.translate(x,y,z);batch(g,m)}
 function tex(kind:string){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};ctx.fillStyle=kind==='stone'?'#766f60':kind==='road'?'#535957':'#96715d';ctx.fillRect(0,0,256,256);if(kind!=='road'){const bh=kind==='stone'?27:16,bw=kind==='stone'?65:41;for(let y=0;y<256;y+=bh)for(let x=-bw;x<256;x+=bw){let v=Math.floor(rand()*23);ctx.fillStyle=kind==='stone'?`rgb(${141+v},${134+v},${112+v})`:`rgb(${130+v},${76+v},${54+v})`;ctx.fillRect(x+(y/bh%2)*bw/2+1,y+1,bw-2,bh-2)}}for(let i=0;i<13000;i++){ctx.fillStyle=rand()>.5?'#ffffff0a':'#0000000a';ctx.fillRect(rand()*256,rand()*256,1,1)}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
 const stone=mat('stone','#eee7d8');stone.map=masonryTexture();stone.bumpMap=stone.map;stone.bumpScale=.055;const brick=mat('brick','#e4b99b');brick.map=tex('brick');const asphalt=mat('asphalt','#c4c8bf');asphalt.map=tex('road');const slate=mat('slate','#48575a'),glass=mat('glass','#46666b',.28),trim=mat('trim','#d5cbb3'),dark=mat('dark','#263a36'),kerb=mat('kerb','#b9b8a8'),paint=mat('paint','#e0dfc8'),soil=mat('soil','#586b49'),paving=mat('paving','#999789');
 const blockCanvas=document.createElement('canvas');blockCanvas.width=blockCanvas.height=256;const bc=blockCanvas.getContext('2d')!;bc.fillStyle='#595b58';bc.fillRect(0,0,256,256);for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const shade=104+((row*13+col*7)%17);bc.fillStyle=`rgb(${shade},${shade+2},${shade-1})`;bc.fillRect(col*32+(row%2)*16+1,row*16+1,30,14)}const blockMap=new T.CanvasTexture(blockCanvas);blockMap.wrapS=blockMap.wrapT=T.RepeatWrapping;blockMap.repeat.set(4,4);blockMap.colorSpace=T.SRGBColorSpace;const blockPaving=mat('threadfoldBlocks','#bebdb4');blockPaving.map=blockMap;blockPaving.bumpMap=blockMap;blockPaving.bumpScale=.016;
 // Coarse survey mesh outside the courts; half-metre geometry resolves narrow level changes.
 function makeLand(x0:number,z0:number,w:number,d:number,step:number,omitCourts=false){
  const g=new T.PlaneGeometry(w,d,Math.round(w/step),Math.round(d/step));g.rotateX(-Math.PI/2);g.translate(x0+w/2,0,z0+d/2);
  const pos=g.getAttribute('position'),colors:number[]=[];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);let y=terrain(x,z);
   // Match the coarse edge exactly to avoid cracks at the patch perimeter.
   if(step<2&&(x===x0||x===x0+w||z===z0||z===z0+d)){const ax=Math.floor(x/2)*2,az=Math.floor(z/2)*2,u=(x-ax)/2,v=(z-az)/2;y=T.MathUtils.lerp(T.MathUtils.lerp(terrain(ax,az),terrain(ax+2,az),u),T.MathUtils.lerp(terrain(ax,az+2),terrain(ax+2,az+2),u),v)}
   pos.setY(i,y);const c=new T.Color('#6f8150');c.multiplyScalar(.88+.12*Math.sin(x*.036)*Math.cos(z*.042));if(nearest(x,z,riverSeg).d<8)c.set('#617158');colors.push(c.r,c.g,c.b);
  }
  if(omitCourts){const old=g.index!,indices:number[]=[];for(let i=0;i<old.count;i+=3){const ids=[old.getX(i),old.getX(i+1),old.getX(i+2)],x=ids.reduce((s,j)=>s+pos.getX(j),0)/3,z=ids.reduce((s,j)=>s+pos.getZ(j),0)/3;if(x>0&&x<140&&z>-40&&z<60)continue;indices.push(...ids)}g.setIndex(indices)}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.receiveShadow=true;scene.add(mesh);
 }
 makeLand(-750,-650,1500,1300,2,true);makeLand(0,-40,140,100,.5);

 function ribbon(points:P[],width:number,m:T.Material,yFn:(x:number,z:number)=>number,offset=0){const p:number[]=[],uv:number[]=[],idx:number[]=[];let dist=0;points.forEach((a,i)=>{const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=after[0]-before[0],dz=after[1]-before[1],l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;if(i)dist+=Math.hypot(a[0]-before[0],a[1]-before[1]);for(const side of [-1,1]){const x=a[0]+nx*(width/2*side+offset),z=a[1]+nz*(width/2*side+offset);p.push(x,yFn(x,z),z);uv.push((side+1)/2,dist/8)}if(i){const k=i*2;idx.push(k-2,k-1,k,k-1,k+1,k)}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();batch(g,m)}
 function densify(p:P[],step=3){const out:P[]=[];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let j=0;j<n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}out.push(p[p.length-1]);return out}
 const waterMat=new T.MeshStandardMaterial({color:'#548b89',metalness:.45,roughness:.19,transparent:true,opacity:.88});
 for(const w of water){ribbon(densify(w.points),10,soil,(x,z)=>riverY(x,z)-.4);ribbon(densify(w.points),7,waterMat,(x,z)=>riverY(x,z));}
 const waterLines: T.Line[]=[];for(let i=0;i<70;i++){const s=riverSeg[i%riverSeg.length],t=(i*.618)%1,x=T.MathUtils.lerp(s.a[0],s.b[0],t),z=T.MathUtils.lerp(s.a[1],s.b[1],t);const g=new T.BufferGeometry().setFromPoints([new T.Vector3(x,riverY(x,z)+.06,z),new T.Vector3(x+1.6,riverY(x,z)+.06,z+.18)]);const l=new T.Line(g,new T.LineBasicMaterial({color:'#cee4d6',transparent:true,opacity:.25}));scene.add(l);waterLines.push(l)}
 function width(f:Feature){return f.tags.highway==='trunk'?10:['footway','steps','cycleway','path'].includes(f.tags.highway)?1.8:f.tags.highway==='service'?4.6:6.4}
 for(const f of roads){const p=densify(f.points),w=width(f),foot=w<2;const own=segments([f]);const yfn=(x:number,z:number)=>roadY(x,z,nearest(x,z,own));
 if(!foot){for(const side of [-1,1]){if(f.tags.highway==='service'||(f.name==='Eagley Way'&&side===1))continue;const walkPoints=f.name==='Eagley Way'?p.filter(q=>q[0]<18):p;if(walkPoints.length<2)continue;ribbon(walkPoints,1.1,paving,(x,z)=>yfn(x,z)+.07,side*(w/2+.7));ribbon(walkPoints,.16,kerb,(x,z)=>yfn(x,z)+.08,side*(w/2+.08))}}ribbon(p,w,foot?paving:f.name==='Threadfold Way'?blockPaving:asphalt,yfn);
 if(f.tags.highway==='trunk'||f.name==='Eagley Way'){let walked=0;for(let i=1;i<p.length;i++){walked+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(walked%10<3)ribbon([p[i-1],p[i]],.1,paint,(x,z)=>yfn(x,z)+.035)}}
 if(f.name==='Threadfold Way'){const yellow=mat('yellowLines','#c7af65');for(const side of [-1,1])for(const d of [.12,.31])ribbon(p,.075,yellow,(x,z)=>yfn(x,z)+.025,side*(w/2-d));}
 if(f.tags.bridge){for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz);for(const side of [-1,1]){const x=(a[0]+b[0])/2+Math.cos(rot)*(w/2+.45)*side,z=(a[1]+b[1])/2-Math.sin(rot)*(w/2+.45)*side;box(x,yfn(x,z)+.7,z,.55,1.4,len+.1,stone,rot)}}}
 }
 // Mapped access aisle and a modest paved court beside Bridge Mill.

 function polygon(points:P[],m:T.Material,y:number){const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1])));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,y,0);batch(g,m)}
 // Triangulated, graded parking surface, bounded by grass rather than a full-width strip.
 const parkingShape=new T.Shape(court.map(p=>new T.Vector2(p[0],-p[1]))),rawParking=new T.ShapeGeometry(parkingShape).toNonIndexed(),rawPos=rawParking.getAttribute('position'),pv:number[]=[],pu:number[]=[];
 function parkingTriangle(a:P,b:P,c:P,depth=0){if(depth<4&&Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(c[0]-b[0],c[1]-b[1]))>2){const ab:P=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:P=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:P=[(c[0]+a[0])/2,(c[1]+a[1])/2];parkingTriangle(a,ab,ca,depth+1);parkingTriangle(ab,b,bc,depth+1);parkingTriangle(ca,bc,c,depth+1);parkingTriangle(ab,bc,ca,depth+1)}else for(const p of [a,b,c]){pv.push(p[0],courtY(...p)+.05,p[1]);pu.push(p[0]/8,p[1]/8)}}
 for(let i=0;i<rawPos.count;i+=3)parkingTriangle([rawPos.getX(i),-rawPos.getY(i)],[rawPos.getX(i+1),-rawPos.getY(i+1)],[rawPos.getX(i+2),-rawPos.getY(i+2)]);const parkingGeo=new T.BufferGeometry();parkingGeo.setAttribute('position',new T.Float32BufferAttribute(pv,3));parkingGeo.setAttribute('uv',new T.Float32BufferAttribute(pu,2));parkingGeo.computeVertexNormals();batch(parkingGeo,asphalt);rawParking.dispose();

 // Three short parking groups leave the eastern garage lane clear.
 for(const row of [{x:13,z:-2,n:6,yaw:0},{x:13,z:25,n:6,yaw:Math.PI},{x:8,z:6,n:4,yaw:Math.PI/2}])for(let k=0;k<=row.n;k++){const x=row.x+Math.cos(row.yaw)*k*2.6,z=row.z-Math.sin(row.yaw)*k*2.6;box(x,courtY(x,z)+.08,z,.07,.02,4.7,paint,row.yaw)}
 // Buildings retain mapped footprints; window bays are modelled geometry.
 const roofMaterial=new T.MeshStandardMaterial({color:'#465354',roughness:.9,side:T.DoubleSide});
 const colliders:{p:P[],minX:number,maxX:number,minZ:number,maxZ:number}[]=[];
 function bounds(p:P[]){return {p,minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minZ:Math.min(...p.map(v=>v[1])),maxZ:Math.max(...p.map(v=>v[1]))}}
 for(const f of buildings){let p=f.name==='Bridge Mill'?[[78.79,9.43],[106.95,10.6],[106.55,20.66],[77.87,19.51]] as P[]:f.points.slice(0,-1);if(p.length<3)continue;const cx=p.reduce((s,v)=>s+v[0],0)/p.length,cz=p.reduce((s,v)=>s+v[1],0)/p.length;if(cx< -460||cx>380||cz< -290||cz>290)continue;colliders.push(bounds(p));if(['727427311','727427312','727427313'].includes(f.id)){if(f.id==='727427311')addCourtHouses({box,batch,stone,trim,dark,glass,entry:houseEntry});continue}if(f.id==='571633838'){addGatehouse({box,batch,glass,dark,stone,base:Math.max(ground(-288.5,149.3),ground(-280.8,140.7))+.08,foundationBottom:Math.min(...p.map(q=>terrain(...q)))-.3,points:p});continue}if(f.id==='727404344'){addSchoolHouse({box,batch,stone,trim,dark,glass,base:Math.min(...p.map(q=>terrain(...q))),points:p});continue}const bridge=f.name==='Bridge Mill',mill=f.name.includes('Mill'),garage=f.tags.building==='garages'||f.tags.building==='garage';const levels=bridge?3:f.name==='Brook Mill'?5:f.name==='Valley Mill'?4:Number(f.tags['building:levels'])|| (garage?1:2);const h=levels*(mill?3.6:2.8),base=bridge?bridgeBase:garage&&['727427314','727427315'].includes(f.id)?courtY(cx,cz):Math.min(...p.map(q=>terrain(...q)));const millCourt=['727427311','727427312','727427313','727427314','727427315'].includes(f.id);const material=bridge||millCourt||(!mill&&cz< -140)?stone:brick;
 const shape=new T.Shape(p.map(v=>new T.Vector2(v[0],-v[1])));const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,base,0);const u=g.getAttribute('uv');for(let i=0;i<u.count;i++){u.setXY(i,u.getX(i)/2,u.getY(i)/2)}batch(g,material);
 polygon([...p,p[0]],slate,base+h+.04);
 if(mill&&!bridge)for(let j=0;j<p.length;j++){const a=p[j],b=p[(j+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);box((a[0]+b[0])/2,base+.65,(a[1]+b[1])/2,.3,1.3,len,stone,Math.atan2(b[0]-a[0],b[1]-a[1]))}
 let longest=0,edge=0;for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len>longest){longest=len;edge=i}}
 const pa=p[edge],pb=p[(edge+1)%p.length],theta=Math.atan2(pb[0]-pa[0],pb[1]-pa[1]);
 const local=p.map(q=>{const dx=q[0]-cx,dz=q[1]-cz;return [dx*Math.cos(theta)-dz*Math.sin(theta),dx*Math.sin(theta)+dz*Math.cos(theta)]});const rw=Math.max(...local.map(v=>v[0]))-Math.min(...local.map(v=>v[0])),rl=Math.max(...local.map(v=>v[1]))-Math.min(...local.map(v=>v[1]));
 const localX=(Math.min(...local.map(v=>v[0]))+Math.max(...local.map(v=>v[0])))/2,localZ=(Math.min(...local.map(v=>v[1]))+Math.max(...local.map(v=>v[1])))/2;
 if(!mill||bridge){const rh=garage?1.05:bridge?1.8:1.7;const roof=new T.BufferGeometry();const verts=[-rw/2,0,-rl/2,rw/2,0,-rl/2,0,rh,-rl/2+Math.min(rw/2,rl/3),-rw/2,0,rl/2,rw/2,0,rl/2,0,rh,rl/2-Math.min(rw/2,rl/3)];roof.setAttribute('position',new T.Float32BufferAttribute(verts,3));roof.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4]);roof.computeVertexNormals();roof.translate(localX,0,localZ);roof.rotateY(theta);roof.translate(cx,base+h,cz);batch(roof,roofMaterial);}

 if(garage){
 // North-facing five-door range and the separate two-door garage by Bridge Mill.
 const northEdge=p.map((a,j)=>({a,b:p[(j+1)%p.length]})).filter(e=>Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1])>3).sort((a,b)=>(a.a[1]+a.b[1])-(b.a[1]+b.b[1]))[0];
 const a=northEdge.a,b=northEdge.b,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz),n=f.id==='727427314'?5:f.id==='727427315'?2:Math.max(1,Math.round(len/3.4));
 const door=mat('garageDoor','#363b37'),rib=mat('garageRib','#4e534d');
 for(let k=0;k<n;k++){const t=(k+.5)/n,x=a[0]+dx*t,z=a[1]+dz*t,ww=Math.min(2.6,len/n-.38);box(x,base+1.14,z,.21,2.28,ww+.16,dark,rot);box(x,base+1.14,z,.24,2.15,ww,door,rot);for(let j=1;j<12;j++){const d=(j/12-.5)*ww;box(x+Math.sin(rot)*d,base+1.14,z+Math.cos(rot)*d,.27,2.1,.018,rib,rot)}box(x,base+1.0,z,.29,.04,.22,trim,rot);box(x,base+2.37,z,.28,.16,ww+.3,stone,rot)}
 }
 const near=Math.hypot(cx,cz)<470;
 if(near&&!garage)for(let j=0;j<p.length;j++){const a=p[j],b=p[(j+1)%p.length];if(bridge&&(a[1]+b[1])/2>17)continue;const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<2.3)continue;const rot=Math.atan2(dx,dz),n=bridge&&len>20?9:f.name==='Brook Mill'?(len>30?14:6):Math.max(1,Math.floor(len/(mill?3.3:3.1)));for(let k=0;k<n;k++){const t=(k+.5)/n,x=a[0]+dx*t,z=a[1]+dz*t;for(let level=0;level<levels;level++){const yy=base+level*h/levels+1.65,ww=mill?1.55:1.15,hh=mill?2.25:1.3;box(x,yy,z,.19,hh+.23,ww+.22,trim,rot);box(x,yy+.04,z,.22,hh,ww,glass,rot);box(x,yy+.04,z,.25,.045,ww,trim,rot);box(x,yy+.04,z,.25,hh,.045,trim,rot);if(mill){for(const frac of [-.25,.25]){box(x+Math.sin(rot)*ww*frac,yy+.04,z+Math.cos(rot)*ww*frac,.26,hh,.035,trim,rot);box(x,yy+.04+hh*frac,z,.26,.035,ww,trim,rot)}}}if(!mill&&k===0&&!garage)box(x,base+.95,z,.25,1.9,.85,dark,rot)}
 if(mill&&!bridge){for(let floor=1;floor<=levels;floor++)box((a[0]+b[0])/2,base+floor*h/levels-.12,(a[1]+b[1])/2,.48,.32,len+.12,trim,rot)}
 if(mill){box((a[0]+b[0])/2,base+h-.15,(a[1]+b[1])/2,.4,.3,len+.15,trim,rot);if(!bridge)for(let k=0;k<=n;k++){const t=k/n;box(a[0]+dx*t,base+h/2,a[1]+dz*t,.35,h,.35,material,rot)}}}
 for(let j=0;j<p.length;j++){const a=p[j],b=p[(j+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz);if(len<2)continue;box((a[0]+b[0])/2,base+h-.08,(a[1]+b[1])/2,.13,.14,len+.16,dark,rot);if(j%2===0){box(a[0],base+h/2,a[1],.08,h,.08,dark);box(a[0],base+.18,a[1],.2,.25,.2,dark)}}
 if(!mill&&!garage&&Number(f.id)%3===0)box(cx+1,base+h+1.7,cz,1,1.9,.75,brick,theta);
 }

 addBridgeFront({box,batch,stone,trim,dark,glass,base:passageY});
 colliders.push(bounds(addBridgeEngineHouse({box,batch,stone,trim,dark,glass,base:passageY})));
 // Distinctive mill details, interpreted from Historic England listings and photographs.
 const brook=buildings.find(f=>f.name==='Brook Mill')!;
 const brookBase=Math.min(...brook.points.map(p=>terrain(...p)));
 const towerX=113.2,towerZ=-35.3,towerY=brookBase+18;
 box(towerX,towerY+1.6,towerZ,2.1,5.4,5.2,brick,.086);
 box(towerX,towerY+3.7,towerZ,2.4,.28,5.7,trim,.086);
 const pediment=new T.BufferGeometry();pediment.setAttribute('position',new T.Float32BufferAttribute([114.45,towerY+3.85,-38,114.45,towerY+5.5,-35.3,114.45,towerY+3.85,-32.6],3));pediment.computeVertexNormals();batch(pediment,new T.MeshStandardMaterial({color:'#bdac88',side:T.DoubleSide}));
 const clockCanvas=document.createElement('canvas');clockCanvas.width=clockCanvas.height=256;const clockCtx=clockCanvas.getContext('2d')!;
 clockCtx.fillStyle='#e1dcc5';clockCtx.beginPath();clockCtx.arc(128,128,119,0,Math.PI*2);clockCtx.fill();clockCtx.strokeStyle='#263733';clockCtx.lineWidth=9;clockCtx.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6;clockCtx.lineWidth=i%3===0?7:4;clockCtx.beginPath();clockCtx.moveTo(128+Math.sin(a)*95,128-Math.cos(a)*95);clockCtx.lineTo(128+Math.sin(a)*109,128-Math.cos(a)*109);clockCtx.stroke()}
 clockCtx.lineWidth=7;clockCtx.beginPath();clockCtx.moveTo(82,102);clockCtx.lineTo(128,128);clockCtx.lineTo(160,61);clockCtx.stroke();
 const clockTex=new T.CanvasTexture(clockCanvas);clockTex.colorSpace=T.SRGBColorSpace;const face=new T.Mesh(new T.CircleGeometry(1.15,32),new T.MeshStandardMaterial({map:clockTex,roughness:.8}));face.rotation.y=Math.PI/2;face.position.set(114.5,towerY+2.05,towerZ);scene.add(face);
 // Valley Mill has a flat roof and a raised northeast bell cupola.
 const valley=buildings.find(f=>f.name==='Valley Mill')!,valleyBase=Math.min(...valley.points.map(p=>terrain(...p))),vy=valleyBase+14.4;
 box(11,vy+1,-79,4.2,2,4.2,brick,-.34);box(11,vy+2.1,-79,4.6,.28,4.6,trim,-.34);
 for(const dx of [-1.25,1.25])for(const dz of [-1.25,1.25])box(11+dx,vy+3.1,-79+dz,.24,1.8,.24,trim);
 const cap=new T.ConeGeometry(2.3,1.5,8);cap.translate(11,vy+4.4,-79);batch(cap,slate);
 const bell=new T.SphereGeometry(.52,8,6);bell.scale(1,1.25,1);bell.translate(11,vy+3.2,-79);batch(bell,dark);
 // Retaining masonry and iron rails on the mapped riverside path.
 // Alignment follows the path's brook-facing edge; wall heights are interpreted.
 const wallSegments:{a:P,b:P}[]=[];

 // Eagley Way boundaries observed in June 2024 Street View.
 // Right is the uphill side when travelling from Blackburn Road.
 const boundaryStone=mat('boundaryStone','#b2ad98');boundaryStone.map=masonryTexture(true);boundaryStone.bumpMap=boundaryStone.map;boundaryStone.bumpScale=.095;
 const roadsideShrubs:{x:number,z:number,y:number,h:number}[]=[];
 const passageStone=mat('passageRubble','#777b6c');passageStone.map=masonryTexture(true);passageStone.bumpMap=passageStone.map;passageStone.bumpScale=.16;
 const weatheredTimber=mat('weatheredTimber','#777566'),steel=mat('guardSteel','#a8afaa',.5),hedgeMat=mat('boundaryHedge','#405638');
 function beam(a:T.Vector3,b:T.Vector3,w:number,d:number,m:T.Material){const delta=b.clone().sub(a),g=new T.BoxGeometry(w,delta.length(),d);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));const mid=a.clone().add(b).multiplyScalar(.5);g.translate(mid.x,mid.y,mid.z);batch(g,m)}
 function masonry(a:P,b:P,ya:number,yb:number,ha:number,hb:number,material:T.Material=boundaryStone,uprightCoping=false){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz),g=new T.BoxGeometry(.55,1,len+.04),v=g.getAttribute('position'),uv=g.getAttribute('uv');
 for(let j=0;j<v.count;j++){const t=(v.getZ(j)+len/2)/len,base=T.MathUtils.lerp(ya,yb,t),height=T.MathUtils.lerp(ha,hb,t);v.setY(j,base+(v.getY(j)+.5)*height);uv.setXY(j,uv.getX(j)*len/2,uv.getY(j)*height/2)}g.rotateY(rot);g.translate((a[0]+b[0])/2,0,(a[1]+b[1])/2);g.computeVertexNormals();batch(g,material);
 if(uprightCoping){const count=Math.ceil(len/.22);for(let k=0;k<count;k++){const t=(k+.5)/count;box(T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(ya+ha,yb+hb,t)+.12,T.MathUtils.lerp(a[1],b[1],t),.59,.24+Math.sin(k*2.7+a[0])*.035,len/count-.015,material,rot)}}else beam(new T.Vector3(a[0],ya+ha+.055,a[1]),new T.Vector3(b[0],yb+hb+.055,b[1]),.68,.11,material);wallSegments.push({a,b});
 }
 const eagley=roads.find(f=>f.name==='Eagley Way')!,edgePath=densify(eagley.points,2.3);
 function offsetRoadPoint(i:number,d:number):P{const before=edgePath[Math.max(0,i-1)],after=edgePath[Math.min(edgePath.length-1,i+1)],dx=after[0]-before[0],dz=after[1]-before[1],l=Math.hypot(dx,dz);return [edgePath[i][0]-dz/l*d,edgePath[i][1]+dx/l*d]}
 for(let j=1;j<edgePath.length;j++){const a=edgePath[j-1],b=edgePath[j],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,x=(a[0]+b[0])/2;
 for(const side of [-1,1]){const offset=side*(side===-1&&x<18?5.0:3.7),aa=offsetRoadPoint(j-1,offset),bb=offsetRoadPoint(j,offset),ya=roadY(...a),yb=roadY(...b);
 if(x< -279)continue; // Preserve the cottage entrance at Blackburn Road.
 if(side===-1&&x<18){for(const h of [.55,1.12])beam(new T.Vector3(...[aa[0],ya+h,aa[1]] as [number,number,number]),new T.Vector3(bb[0],yb+h,bb[1]),.11,.12,weatheredTimber);beam(new T.Vector3(aa[0],ya+.62,aa[1]),new T.Vector3(bb[0],yb+.62,bb[1]),.09,.3,steel);box(aa[0],ya+.6,aa[1],.13,1.2,.13,weatheredTimber);wallSegments.push({a:aa,b:bb});}
 else if(side===1&&x< -267){masonry(aa,bb,ya-.18,yb-.18,1.25,1.25)}
 else if(side===1&&x< -157){box(aa[0],ya+.55,aa[1],.1,1.1,.1,weatheredTimber);for(const h of [.35,.7,1])beam(new T.Vector3(aa[0],ya+h,aa[1]),new T.Vector3(bb[0],yb+h,bb[1]),.016,.016,dark);wallSegments.push({a:aa,b:bb});}
 else {const h=side===1?(x< -115?.85:x<18?1.45:1.7):1.3;if(side===-1&&x>59&&x<110){
 // June 2024 reverse view: upright coping on the taller west section, a sharp drop beside the mill.
 // The transition at x94 is an interpreted position, pending closer survey.
 const split=94;
 if(aa[0]<split&&bb[0]>split){const t=(split-aa[0])/(bb[0]-aa[0]),mid:P=[split,T.MathUtils.lerp(aa[1],bb[1],t)],ym=T.MathUtils.lerp(ya,yb,t);masonry(aa,mid,ya-.18,ym-.18,1.42,1.42,passageStone,true);masonry(mid,bb,ym-.18,yb-.18,.92,.92,passageStone)}
 else masonry(aa,bb,ya-.18,yb-.18,x<split?1.42:.92,x<split?1.42:.92,passageStone,x<split);
 }else masonry(aa,bb,ya-.18,yb-.18,h,h);}
 // Continuous understorey behind the roadside boundaries, keeping the carriageway open.
 if(x<18&&j%2===0){const hx=(aa[0]+bb[0])/2+nx*side*2.4,hz=(aa[1]+bb[1])/2+nz*side*2.4;roadsideShrubs.push({x:hx,z:hz,y:terrain(hx,hz),h:side===1?2.1:1.55})}
 }}
 for(let x=74;x<110;x+=1)masonry([x,passageWallZ(x)],[x+1,passageWallZ(x+1)],passageY-.25,passageY-.25,passageWallHeight(x),passageWallHeight(x+1),passageStone);
 masonry([59,27.05],[74,passageWallZ(74)],passageY-.25,passageY-.25,1.1,passageWallHeight(74),passageStone);
 const sideGate=addBridgeSideGate({box,batch,stone:boundaryStone,dark,ground});wallSegments.push({a:sideGate[0],b:sideGate[1]});
 // Retain the raised west passage apron instead of leaving paving floating above the bank.
 for(let z=12;z<27;z+=1){const a:P=[71.8,z],b:P=[71.8,z+1],ya=Math.min(sampledTerrain(...a)-.15,passageY-.3),yb=Math.min(sampledTerrain(...b)-.15,passageY-.3);masonry(a,b,ya,yb,passageY-.07-ya,passageY-.07-yb);wallSegments.pop()}
 // Threadfold Way north boundary, checked against June 2024 Street View.
 const threadfold=roads.find(f=>f.id==='655432303')!,threadPath=densify(threadfold.points,2);
 for(let j=1;j<threadPath.length;j++){const a=threadPath[j-1],b=threadPath[j],x=(a[0]+b[0])/2;if(x<45||x>130)continue;const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,aa:P=[a[0]+nx*5.1,a[1]+nz*5.1],bb:P=[b[0]+nx*5.1,b[1]+nz*5.1];masonry(aa,bb,roadY(...a)-.2,roadY(...b)-.2,x>104?1.9:1.05,x>104?1.9:1.05);}
 // Grass-island kerbs and the short perimeter at the western court.
 for(const p of [[[11,-5],[30,-5],[35,0]],[[12,29],[31,29],[35,24]],[[35,1],[38,6],[39,9]]] as P[][])for(let j=1;j<p.length;j++)beam(new T.Vector3(p[j-1][0],courtY(...p[j-1])+.07,p[j-1][1]),new T.Vector3(p[j][0],courtY(...p[j])+.07,p[j][1]),.18,.15,kerb);
 const vehicleSeg=segments(roads.filter(f=>width(f)>2));
 for(const f of roads.filter(f=>f.id==='655432309')){const path=densify(f.points,2);for(let i=1;i<path.length;i++){
 const a=path[i-1],b=path[i],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,r=nearest(mx,mz,riverSeg),dist=Math.hypot(r.x-mx,r.z-mz)||1;
 if(mx>110&&mz>12)continue; // Dedicated stone returns replace generic rails at the Hough Lane gate.
 const ox=(r.x-mx)/dist*1.25,oz=(r.z-mz)/dist*1.25,x=mx+ox,z=mz+oz,rd=nearest(x,z,vehicleSeg);if(rd.d<width(rd.s.f)/2+1.7)continue;
 const len=Math.hypot(b[0]-a[0],b[1]-a[1]),rot=Math.atan2(b[0]-a[0],b[1]-a[1]),top=roadY(mx,mz)+.12,base=Math.min(terrain(x,z)-.4,riverY(x,z)),height=Math.max(.5,top-base);
 box(x,top-height/2,z,.5,height,len+.12,stone,rot);box(x,top+.07,z,.62,.14,len+.15,trim,rot);
 box(x,top+.7,z,.075,1.3,.075,dark);for(const y of [.45,1.05]){const va=new T.Vector3(a[0]+ox,roadY(...a)+.12+y,a[1]+oz),vb=new T.Vector3(b[0]+ox,roadY(...b)+.12+y,b[1]+oz),delta=vb.clone().sub(va),g=new T.BoxGeometry(.055,delta.length(),.055);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...va.add(vb).multiplyScalar(.5).toArray());batch(g,dark)}
 wallSegments.push({a:[a[0]+ox,a[1]+oz],b:[b[0]+ox,b[1]+oz]});
 }}
 function sign(text:string,x:number,z:number,heading=0,size=5){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e8e6d8';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#2c3c39';ctx.lineWidth=8;ctx.strokeRect(7,7,498,114);ctx.fillStyle='#273a37';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 38px Arial';ctx.fillText(text,256,64,470);const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(size,size/4),new T.MeshStandardMaterial({map:t,roughness:.8,side:T.DoubleSide}));mesh.position.set(x,ground(x,z)+2.3,z);mesh.rotation.y=heading;scene.add(mesh);const back=mesh.clone();back.rotation.y+=Math.PI;back.position.x-=Math.sin(heading)*.025;back.position.z-=Math.cos(heading)*.025;scene.add(back);box(x,ground(x,z)+1.1,z,.09,2.2,.09,dark)}
 sign('EAGLEY WAY',-278,137,-.74,4);sign('THREADFOLD WAY',129,-31,-1,4);sign('BRIDGE MILL',17,0,1,4.5);
 // Trees are instanced to keep the valley responsive.
 let seed=713;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 function inPoly(x:number,z:number,p:P[]){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
 function hitBuilding(x:number,z:number,r=.4){return colliders.some(b=>x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r&&(inPoly(x,z,b.p)||nearest(x,z,segments([{points:[...b.p,b.p[0]]} as Feature])).d<r))}
 const trees:{x:number,z:number,h:number}[]=survey.trees.map(([x,z,h]:number[])=>({x,z,h})).filter((t:{x:number,z:number,h:number})=>{const rd=nearest(t.x,t.z,roadSeg);return rd.d>width(rd.s.f)/2+1.5&&!hitBuilding(t.x,t.z,3)&&!inPoly(t.x,t.z,court)});

 const leafMaterial=addTrees(scene,trees.filter(t=>!inPassage(t.x,t.z)),terrain);
 addRoadsideShrubs(scene,roadsideShrubs,leafMaterial);
 addBridgeGardens({box,batch,leaf:leafMaterial,stone,dark,terrain,passageY});
 for(let x=75;x<109;x+=1.25){for(let j=0;j<3;j++){const ivy=new T.PlaneGeometry(1.5,1.8);ivy.rotateZ(Math.sin(x+j)*.35);ivy.translate(x,passageY+passageWallHeight(x)-.8+j*.3,passageWallZ(x)-.32-Math.sin(x)*.08);batch(ivy,leafMaterial)}}

 // Street lights and bollards along the two principal roads.
 for(const f of roads.filter(f=>['Eagley Way','Threadfold Way'].includes(f.name))){let d=0;for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i];d+=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<34)continue;d=0;const th=Math.atan2(b[0]-a[0],b[1]-a[1]),x=b[0]+Math.cos(th)*5,z=b[1]-Math.sin(th)*5,y=ground(x,z);box(x,y+3.5,z,.1,7,.1,dark);box(x,y+7,z,.7,.13,.3,trim,th)}}
 // Consolidate static meshes by material.
 for(const [key,geos] of Object.entries(batches)){if(!geos.length)continue;const g=mergeGeometries(geos,false);if(g){const mesh=new T.Mesh(g,mats[key]);mesh.castShadow=![asphalt,waterMat,paint,paving,kerb,soil].includes(mats[key] as any);mesh.receiveShadow=true;scene.add(mesh)}geos.forEach(g=>g.dispose())}
 function carModel(color:string){const g=new T.Group();const body=new T.MeshStandardMaterial({color,metalness:.48,roughness:.28});const window=new T.MeshStandardMaterial({color:'#27434c',metalness:.35,roughness:.12});function part(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh}part(1.82,.55,4.2,0,.7,0,body);part(1.6,.55,1.9,0,1.23,-.17,window);part(1.65,.12,1.85,0,1.54,-.2,body);part(1.68,.1,4.23,0,.46,0,dark);part(1.84,.12,1.3,0,1.02,1.37,body);part(1.84,.13,.45,0,1.01,-1.78,body);for(const x of [-.73,.73]){part(.37,.17,.06,x,.83,2.12,new T.MeshStandardMaterial({color:'#fff7d0',emissive:'#ffecb4',emissiveIntensity:.7}));part(.38,.14,.06,x,.83,-2.12,new T.MeshStandardMaterial({color:'#c94731',emissive:'#9c2319',emissiveIntensity:.25}));part(.12,.52,.12,x,1.23,-.3,body);part(.2,.12,.3,x*1.24,1.2,.65,body)}part(.44,.12,.035,0,.62,-2.135,mat('plate','#edcf58'));const wheels:T.Mesh[]=[];for(const x of [-.94,.94])for(const z of [-1.37,1.38]){const wheel=new T.Mesh(new T.CylinderGeometry(.36,.36,.23,16),mat('rubber','#202924'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.38,z);wheel.castShadow=true;g.add(wheel);wheels.push(wheel);const hub=new T.Mesh(new T.CylinderGeometry(.2,.2,.245,12),mat('hub','#b5c3be',.32));hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub)}return {g,wheels}}
 const first=roads.find(f=>f.name==='Eagley Way')!;const a=first.points[0],b=first.points[1],angle=Math.atan2(b[0]-a[0],b[1]-a[1]);const spawn={x:a[0]+Math.sin(angle)*12+Math.cos(angle)*1.3,z:a[1]+Math.cos(angle)*12-Math.sin(angle)*1.3,yaw:angle};
 const cars=[{...spawn,color:'#426d61'},{x:17,z:24,yaw:0,color:'#b9ad89'},{x:27,z:24,yaw:0,color:'#934f39'}].map((v,i)=>{const model=carModel(v.color);model.g.position.set(v.x,ground(v.x,v.z),v.z);model.g.rotation.y=v.yaw;scene.add(model.g);return {...v,...model,id:i}});
 let player={x:spawn.x,z:spawn.z,yaw:spawn.yaw,speed:0},active=0,mode='drive',started=false,paused=false,camMode=0,look=0,lookPitch=0,time=0,disposed=false,arrived=false,showMap=false,muted=true,frame=0,hudTime=0;const keys=new Set<string>();
 let audio:AudioContext|undefined,osc:OscillatorNode|undefined,gain:GainNode|undefined;
 function sound(m:boolean){muted=m;if(!muted&&!audio){audio=new AudioContext();osc=audio.createOscillator();gain=audio.createGain();osc.type='triangle';gain.gain.value=.025;osc.connect(gain);gain.connect(audio.destination);osc.start()}if(audio)audio.resume();if(gain)gain.gain.value=muted?0:.025}
 function canStand(x:number,z:number,r:number){if(x< -420||x>340||z< -250||z>260||hitBuilding(x,z,r)||nearest(x,z,wallSegments).d<r+.25)return false;const rn=nearest(x,z,riverSeg),rd=nearest(x,z,roadSeg);if(rn.d<4.2&&!(rd.s?.f.tags.bridge&&rd.d<width(rd.s.f)/2))return false;return true}
 function reset(){active=0;mode='drive';player={...spawn,speed:0};cars[0].x=spawn.x;cars[0].z=spawn.z;cars[0].yaw=spawn.yaw;look=0;lookPitch=0;arrived=false;paused=false;syncCar();updateHud();updateCamera(1)}
 function interact(){if(!started)return;if(mode==='drive'){if(Math.abs(player.speed)>1.2)return;const options=[1,-1,2,-2];for(const side of options){const x=player.x+Math.cos(player.yaw)*2.15*side,z=player.z-Math.sin(player.yaw)*2.15*side;if(canStand(x,z,.35)){mode='walk';player={x,z,yaw:player.yaw,speed:0};break}}}else{const c=[...cars].sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z)).find(c=>Math.hypot(c.x-player.x,c.z-player.z)<4);if(c){active=c.id;mode='drive';player={x:c.x,z:c.z,yaw:c.yaw,speed:0}}}look=0;updateHud()}
 function syncCar(){if(mode!=='drive')return;const c=cars[active];c.x=player.x;c.z=player.z;c.yaw=player.yaw;c.g.position.set(player.x,ground(player.x,player.z),player.z);c.g.rotation.set(0,player.yaw,0);const front=ground(player.x+Math.sin(player.yaw)*1.5,player.z+Math.cos(player.yaw)*1.5),back=ground(player.x-Math.sin(player.yaw)*1.5,player.z-Math.cos(player.yaw)*1.5);c.g.rotateX(-Math.atan2(front-back,3));c.wheels.forEach(w=>w.rotation.x+=player.speed*.015)}
 const mapEl=document.createElement('div');mapEl.className='map-overlay';Object.assign(mapEl.style,{position:'absolute',right:'38px',top:'115px',width:'270px',height:'235px',background:'#18352eef',border:'1px solid #ffffff30',borderRadius:'8px',display:'none',pointerEvents:'none',overflow:'hidden'});host.appendChild(mapEl);
 const svgRoads=roads.map(f=>`<polyline points="${f.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${f.name==='Eagley Way'||f.name==='Threadfold Way'?'#e7d797':'#718374'}" stroke-width="${width(f)}"/>`).join('');const svgWater=water.map(f=>`<polyline points="${f.points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#79b7b6" stroke-width="8"/>`).join('');
 function updateMap(){mapEl.innerHTML=`<svg viewBox="-365 -170 580 470" width="100%" height="100%" role="img" aria-label="Map of Eagley roads and brook">${svgWater}${svgRoads}<circle cx="86" cy="16" r="6" fill="#e9dba8"/><text x="100" y="22" fill="#fff8dc" font-size="17">Bridge Mill</text><path d="M0 -9 L6 7 L0 4 L-6 7Z" fill="white" transform="translate(${player.x} ${player.z}) rotate(${180-player.yaw*180/Math.PI})"/><text x="-330" y="-126" fill="#e9dba8" font-size="18">N ↑</text></svg>`}
 function updateHud(){const r=nearest(player.x,player.z,roadSeg);const bm=buildings.find(f=>f.name==='Bridge Mill')!;const dest=nearest(player.x,player.z,segments([bm])).d;arrived=arrived||(mode==='walk'&&dest<8);onHud({x:player.x,z:player.z,latitude:53.6138-player.z/111320,longitude:-2.428+player.x/(111320*Math.cos(53.6138*Math.PI/180)),speed:Math.abs(player.speed)*2.23694,mode,road:dest<14?'Bridge Mill':r.s?.f.name||'Bridge Mill approach',distance:Math.round(dest),arrived,paused,nearCar:cars.some(c=>Math.hypot(c.x-player.x,c.z-player.z)<4)});if(showMap)updateMap()}
 function updateCamera(dt:number){cars.forEach(c=>c.g.visible=!(started&&mode==='drive'&&camMode===2&&c.id===active));let target:T.Vector3,position:T.Vector3;if(!started){const t=time*.016;position=new T.Vector3(175+Math.sin(t)*12,115,153+Math.cos(t)*9);target=new T.Vector3(15,terrain(15,-48)+8,-48)}else{const y=ground(player.x,player.z),heading=player.yaw+look;if(mode==='walk'){position=new T.Vector3(player.x,y+1.72,player.z);target=new T.Vector3(player.x+Math.sin(heading)*20,y+1.72+lookPitch*15,player.z+Math.cos(heading)*20)}else if(camMode===2){position=new T.Vector3(player.x+Math.sin(heading)*.7,y+1.7,player.z+Math.cos(heading)*.7);target=new T.Vector3(player.x+Math.sin(heading)*25,y+1.5+lookPitch*15,player.z+Math.cos(heading)*25)}else{const d=camMode===1?16:9;position=new T.Vector3(player.x-Math.sin(heading)*d,y+(camMode===1?8:4.4)+lookPitch*5,player.z-Math.cos(heading)*d);position.y=Math.max(position.y,ground(position.x,position.z)+1.5);target=new T.Vector3(player.x+Math.sin(player.yaw)*6,y+1.3,player.z+Math.cos(player.yaw)*6)}}camera.position.lerp(position,Math.min(1,dt*7));camera.lookAt(target);if(started){sun.target.position.set(player.x,ground(player.x,player.z),player.z);sun.position.set(player.x-170,240,player.z+110)}}
 function step(dt:number){time+=dt;if(started&&!paused){const gas=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),steer=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(mode==='drive'){const off=nearest(player.x,player.z,roadSeg).d>6&&!inPoly(player.x,player.z,court);player.speed+=gas*6.5*dt;player.speed*=Math.exp(-(gas? .14:1.0)*dt);if(keys.has('Space'))player.speed*=Math.exp(-8*dt);player.speed=T.MathUtils.clamp(player.speed,-5,off?6:17);player.yaw-=steer*player.speed*(.22/(1+Math.abs(player.speed)*.055))*dt;let x=player.x+Math.sin(player.yaw)*player.speed*dt,z=player.z+Math.cos(player.yaw)*player.speed*dt;const hitCar=cars.some(c=>c.id!==active&&Math.hypot(c.x-x,c.z-z)<2.3);if(canStand(x,z,1.0)&&!hitCar){player.x=x;player.z=z}else player.speed*= -.12;syncCar()}else{player.yaw-=steer*1.8*dt;player.speed=gas*(keys.has('ShiftLeft')?4.2:2.3);const x=player.x+Math.sin(player.yaw)*player.speed*dt,z=player.z+Math.cos(player.yaw)*player.speed*dt;if(canStand(x,z,.35)){player.x=x;player.z=z}}
 if(osc&&gain){osc.frequency.value=mode==='drive'?45+Math.abs(player.speed)*7:25;gain.gain.value=muted?0:mode==='drive'?.018+Math.abs(player.speed)*.001:0}
 }waterLines.forEach((l,i)=>{l.position.x=Math.sin(time*.8+i)*.6;l.position.z=Math.sin(time*.6+i)*.2});updateCamera(dt);hudTime+=dt;if(hudTime>.15){hudTime=0;updateHud()}}
 function render(){renderer.render(scene,camera)}
 let manualTime=false;let last=performance.now();function loop(now:number){if(disposed)return;const dt=Math.min((now-last)/1000,.04);last=now;if(!manualTime)step(dt);render();frame=requestAnimationFrame(loop)}
 function key(code:string,down:boolean){if(down)keys.add(code);else keys.delete(code)}
 function onKey(e:KeyboardEvent){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.type==='keyup'){keys.delete(e.code);return}keys.add(e.code);if(e.repeat)return;if(e.code==='KeyE')interact();if(e.code==='KeyC'){camMode=(camMode+1)%3;look=0;lookPitch=0}if(e.code==='KeyR')reset();if(e.code==='KeyF')fullscreen();if(e.code==='Escape'){paused=!paused;keys.clear();updateHud()}if(e.code==='KeyM'){showMap=!showMap;mapEl.style.display=showMap?'block':'none';updateMap()}}
 let dragging=false,px=0,py=0;function down(e:PointerEvent){dragging=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}function move(e:PointerEvent){if(!dragging)return;const delta=(e.clientX-px)*.005;if(mode==='walk')player.yaw-=delta;else look-=delta;lookPitch=T.MathUtils.clamp(lookPitch-(e.clientY-py)*.004,-.6,.7);px=e.clientX;py=e.clientY}function up(){dragging=false}function blur(){keys.clear();if(started){paused=true;updateHud()}}
 function resize(){renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix()}
 function fullscreen(){if(document.fullscreenElement)document.exitFullscreen();else host.parentElement?.requestFullscreen().catch(()=>{})}
 window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('blur',blur);window.addEventListener('resize',resize);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);
 const api={start(){started=true;paused=false;reset();updateCamera(1)},interact,reset,resume(){paused=false;keys.clear();updateHud()},sound,fullscreen,key,setMap(v:boolean){showMap=v;mapEl.style.display=v?'block':'none';updateMap()},dispose(){disposed=true;cancelAnimationFrame(frame);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('blur',blur);window.removeEventListener('resize',resize);renderer.dispose();scene.traverse(o=>{if((o as T.Mesh).geometry)(o as T.Mesh).geometry.dispose()});audio?.close();host.replaceChildren()}};
 (window as any).render_game_to_text=()=>JSON.stringify({coordinates:'Metres; x east, z south; origin 53.6138,-2.428',started,paused,mode,player:{...player,y:ground(player.x,player.z)},activeCar:active,cars:cars.map(c=>({id:c.id,x:c.x,z:c.z})),road:nearest(player.x,player.z,roadSeg).s?.f.name,arrived,map:showMap,camera:camMode});
 (window as any).advanceTime=(ms:number,renderFrame=true)=>{manualTime=true;for(let i=0;i<Math.ceil(ms/16.667);i++)step(1/60);if(renderFrame)render()};
 const lifecycle=new AbortController();
 const context=(document as any).modelContext;
 if(context?.registerTool){try{Promise.resolve(context.registerTool({name:'read_eagley_game',description:'Read the current player location, vehicle, road and journey state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input:unknown){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Expected an empty object');return JSON.parse((window as any).render_game_to_text())}},{signal:lifecycle.signal})).catch(()=>{})}catch{}}
 const dispose=api.dispose;api.dispose=()=>{lifecycle.abort();dispose()};
 updateCamera(1);updateHud();render();frame=requestAnimationFrame(loop);return api;
}
