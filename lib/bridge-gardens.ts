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
    for(let k=0;k<9;k++){
      const a=k*2.399,px=x+Math.sin(a)*h*.28,pz=z+Math.cos(a)*h*.28;
      const g=new T.PlaneGeometry(h*.8,h*.85);g.rotateY(a);g.rotateZ(Math.sin(k+x)*.2);g.translate(px,y+h*(.38+(k%3)*.12),pz);batch(g,leaf);
      if(flowers&&k%2===0){const f=new T.SphereGeometry(h*.075,6,4);f.scale(1,.6,1);f.translate(px,y+h*.75,pz);batch(f,petals[k%3])}
    }
  }
  // Border against the retaining wall leaves the centre of the passage open.
  for(let x=76;x<109;x+=.55){
    const z=passageWallZ(x)-.72;
    patch(x,z,.58,.85,earth,()=>passageY);
    box(x,passageY+.05,z-.48,.56,.17,.18,stone,-Math.atan(.125));
    if(Math.floor(x*10)%3!==0)shrub(x,z,.55+(Math.sin(x)*.5+.5)*.7,passageY,Math.floor(x)%3===0);
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
