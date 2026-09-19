import * as T from 'three';

// Pinnate fronds for the fern bank visible in EAG-020..026.
// Individual plants and dimensions are interpreted, not surveyed specimens.
export function addWoodlandFerns(scene:T.Scene,plants:{x:number,y:number,z:number,h:number}[]){
 const positions:number[]=[],colors:number[]=[];
 const color=new T.Color();
 function blade(a:T.Vector3,b:T.Vector3,c:T.Vector3,d:T.Vector3){
  for(const p of [a,b,c,a,c,d]){positions.push(p.x,p.y,p.z);colors.push(color.r,color.g,color.b)}
 }
 plants.forEach((p,index)=>{
  for(let f=0;f<7;f++){
   const angle=f*2.399+index*.73,radial=new T.Vector3(Math.cos(angle),0,Math.sin(angle)),across=new T.Vector3(-Math.sin(angle),0,Math.cos(angle));
   const length=p.h*(1.05+.18*Math.sin(index+f));
   for(let k=1;k<15;k++){
    const t=k/15,centre=new T.Vector3(p.x,p.y+.06+p.h*Math.sin(t*2.15)*.7,p.z).addScaledVector(radial,length*t);
    const width=length*.24*Math.pow(Math.sin(Math.PI*t),.8);
    color.setHSL(.24+.015*Math.sin(index+f),.42,.17+.025*Math.sin(k+f));
    for(const side of [-1,1]){
     const tip=centre.clone().addScaledVector(across,side*width).addScaledVector(radial,length*.07);tip.y-=width*.22;
     blade(centre.clone().addScaledVector(radial,-.022),centre.clone().lerp(tip,.42).addScaledVector(radial,.025),tip,centre.clone().lerp(tip,.55).addScaledVector(radial,-.035));
    }
   }
  }
 });
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);
}
