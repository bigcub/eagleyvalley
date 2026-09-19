import {passageWallZ} from './bridge-passage';
import * as T from 'three';

type Helpers = {
  box: (x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rot?:number)=>void;
  batch: (g:T.BufferGeometry,m:T.Material)=>void;
  leaf:T.Material; stone:T.Material; dark:T.Material;
  terrain:(x:number,z:number)=>number; passageY:number;
};

// Planting is interpreted from the supplied passage photos and brook-side reference.
// These are small borders and lawns, not surveyed property boundaries.
export function addBridgeGardens({box,batch,leaf,stone,dark,terrain,passageY}:Helpers){
  const earth=new T.MeshStandardMaterial({color:'#494637',roughness:1});
  const grass=new T.MeshStandardMaterial({color:'#637449',roughness:1});
  const petals=['#c391a6','#e4d7bf','#b3a4bd'].map(color=>new T.MeshStandardMaterial({color,roughness:.9}));
  function patch(x:number,z:number,w:number,d:number,m:T.Material,floor:(x:number,z:number)=>number){
    const g=new T.PlaneGeometry(w,d,8,4);g.rotateX(-Math.PI/2);
    const p=g.getAttribute('position');for(let i=0;i<p.count;i++){const px=x+p.getX(i),pz=z+p.getZ(i);p.setXYZ(i,px,floor(px,pz)+.035,pz)}
    g.computeVertexNormals();batch(g,m);
  }
  function shrub(x:number,z:number,h:number,y:number,flowers=false){
    let seed=(Math.round(x*103+z*211)+94031)>>>0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    for(let k=0;k<4;k++){const g=new T.CylinderGeometry(.008,.018,h*.6,5);g.rotateZ((rand()-.5)*.65);g.translate(x+(rand()-.5)*h*.2,y+h*.3,z+(rand()-.5)*h*.2);batch(g,dark)}
    for(let k=0;k<48;k++){
      const a=rand()*Math.PI*2,level=rand(),r=Math.sqrt(rand())*h*.42*Math.sqrt(1-Math.pow(level-.35,2));
      const px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r,py=y+.08+level*h*.8;
      const size=.2+rand()*.14,g=new T.PlaneGeometry(size,size);g.rotateX((rand()-.5)*1.2);g.rotateY(a);g.rotateZ((rand()-.5)*.7);g.translate(px,py,pz);batch(g,leaf);
      if(flowers&&k%9===0){for(let j=0;j<4;j++){const f=new T.SphereGeometry(.025,5,3);f.scale(1,.5,1);f.translate(px+Math.sin(j*2.4)*.035,py+.04,pz+Math.cos(j*2.4)*.035);batch(f,petals[k%3])}}
    }
  }
  // Border against the retaining wall leaves the centre of the passage open.
  for(let x=76;x<109;x+=.55){
    const z=passageWallZ(x)-.72;
    patch(x,z,.58,.85,earth,()=>passageY);
    box(x,passageY+.05,z-.48,.56,.17,.18,stone,-Math.atan((passageWallZ(x+.1)-passageWallZ(x-.1))/.2));
    if((x<101.4||x>105)&&Math.floor(x*10)%3!==0)shrub(x,z,.55+(Math.sin(x)*.5+.5)*.7,passageY,Math.floor(x)%3===0);
  }
  // IMG_9029: weathered square trellis and clustered glazed pots against the wall.
  // Location and dimensions are interpreted; keep all additions within the existing border.
  const timber=new T.MeshStandardMaterial({color:'#777260',roughness:1});
  const potMaterials=['#244c83','#999589','#77513d','#35574a'].map(color=>new T.MeshStandardMaterial({color,roughness:.48}));
  const tx=103.3,tz=passageWallZ(tx)-.34;
  for(let i=0;i<8;i++)box(tx-1.05+i*.3,passageY+1.45,tz,.045,1.95,.055,timber);
  for(let i=0;i<7;i++)box(tx,passageY+.5+i*.3,tz-.025,2.16,.045,.045,timber);
  for(let i=0;i<24;i++){
    const x=tx-1+((i*7)%23)/11,z=tz-.08;
    const g=new T.PlaneGeometry(.31,.37);g.rotateY(Math.sin(i)*.35);g.rotateZ(Math.sin(i*2)*.4);
    g.translate(x,passageY+.65+i*.065,z);batch(g,leaf);
  }
  for(const [i,x] of [101.8,102.5,103.2,104,104.65].entries()){
    const z=passageWallZ(x)-.73,h=.4+(i%3)*.08,r=.23+(i%2)*.055;
    const pot=new T.CylinderGeometry(r,r*.7,h,12,1,true);pot.translate(x,passageY+h/2,z);batch(pot,potMaterials[i%4]);
    const rim=new T.TorusGeometry(r,.025,5,12);rim.rotateX(Math.PI/2);rim.translate(x,passageY+h,z);batch(rim,potMaterials[i%4]);
    const soil=new T.CircleGeometry(r-.025,12);soil.rotateX(-Math.PI/2);soil.translate(x,passageY+h-.04,z);batch(soil,earth);
    shrub(x,z,.65+(i%2)*.2,passageY+h-.03,true);
  }
  // Planting between entrances rather than across the doors or route around the west end.
  for(const x of [82.82,89.06,95.3,101.54]){
    const z=19.55+(x-80)*.041+.8;
    patch(x,z,1.35,.85,earth,()=>passageY);
    shrub(x,z,.65,passageY,true);
  }
  // Approximate visible garden edges traced from north-up Google aerial imagery.
  // Roof corners anchor the trace; the mapped riverside path remains outside it.
  // These are landscape outlines, not surveyed ownership boundaries.
  const plots:number[][][]=[
    [[70,-5.5],[83,-6],[83,9.6],[78.8,9.4],[78.8,0],[70,0]],
    [[83,-6],[88.7,-6.5],[88.7,9.85],[83,9.6]],
    [[88.7,-6.5],[94,-6.1],[94,10.07],[88.7,9.85]],
    [[94,-6.1],[100.3,-5.7],[100.3,10.33],[94,10.07]],
    [[100.3,-5.7],[111.5,-4.3],[113.1,-1.8],[113.4,10.8],[100.3,10.33]]
  ];
  function lawn(points:number[][]){
    const contour=points.map(([x,z])=>new T.Vector2(x,z));
    const triangles=T.ShapeUtils.triangulateShape(contour,[]),positions:number[]=[];
    // Subdivide each triangle so lawns follow the same sampled terrain as movement.
    function triangle(a:number[],b:number[],c:number[],depth:number){
      if(depth){const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca=[(c[0]+a[0])/2,(c[1]+a[1])/2];triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);return}
      for(const [x,z] of [a,c,b])positions.push(x,terrain(x,z)+.055,z);
    }
    for(const [a,b,c] of triangles)triangle(points[a],points[b],points[c],3);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();batch(g,grass);
  }
  function hedge(a:number[],b:number[],height:number){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.55);
    for(let i=0;i<=steps;i++){const t=i/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;shrub(x,z,height*(.92+.08*Math.sin(i*1.7)),terrain(x,z))}
  }
  for(const plot of plots){lawn(plot);hedge(plot[0],plot[1],1.35)}
  // Shared divisions occur once, rather than overlapping hedges from each plot.
  for(let i=1;i<plots.length;i++)hedge(plots[i][0],plots[i][plots[i].length-1],1.15);
  hedge([70,0],[70,-5.5],1.3);hedge([111.5,-4.3],[113.1,-1.8],1.3);hedge([113.1,-1.8],[113.4,10.8],1.3);
  // Small paved areas adjoining the rear elevation; individual furniture awaits photos.
  const paving=new T.MeshStandardMaterial({color:'#8b8773',roughness:.95});
  for(const [x,width] of [[81,3.4],[85.8,4.6],[91.3,4.2],[97.2,5.1],[103.8,5.2]]){
    const rear=9.43+(x-78.79)*.0415;patch(x,rear-1.35,width,2.5,paving,(px,pz)=>terrain(px,pz)+.04);
  }
}
