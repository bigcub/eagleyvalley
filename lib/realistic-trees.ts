import * as T from 'three';
export function addTrees(scene:T.Scene,trees:{x:number,z:number,h:number}[],height:(x:number,z:number)=>number){
 let seed=8192;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;
 // Transparent foliage clusters preserve gaps and leaf silhouettes at walking distance.
 for(let i=0;i<620;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*112,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;ctx.save();ctx.translate(x,y);ctx.rotate(rand()*6.28);ctx.fillStyle=`rgb(${55+rand()*55},${85+rand()*55},${35+rand()*35})`;ctx.beginPath();ctx.ellipse(0,0,1.5+rand()*2,3+rand()*3,0,0,6.28);ctx.fill();ctx.restore()}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const foliage=new T.MeshStandardMaterial({map:texture,alphaTest:.42,side:T.DoubleSide,roughness:.92,color:'#d7dfb5'});
 const bark=new T.MeshStandardMaterial({color:'#655e4e',roughness:1});
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(.11,.32,1,8),bark,trees.length);
 const branches=new T.InstancedMesh(new T.CylinderGeometry(.025,.1,1,5),bark,trees.length*5);
 const crowns=new T.InstancedMesh(new T.PlaneGeometry(1,1),foliage,trees.length*24);
 const dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
 trees.forEach((t,i)=>{const y=height(t.x,t.z),radius=t.h*(.19+rand()*.12);dummy.position.set(t.x,y+t.h*.34,t.z);dummy.rotation.set(.02*(rand()-.5),rand()*6.28,.03*(rand()-.5));dummy.scale.set(1,t.h*.68,1);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);
 for(let j=0;j<5;j++){const a=j*2.4+rand(),v=new T.Vector3(Math.sin(a)*radius*.8,t.h*(.19+rand()*.12),Math.cos(a)*radius*.8),start=new T.Vector3(t.x,y+t.h*(.32+j*.055),t.z);dummy.position.copy(start.add(v.clone().multiplyScalar(.5)));dummy.quaternion.setFromUnitVectors(up,v.clone().normalize());dummy.scale.set(1,v.length(),1);dummy.updateMatrix();branches.setMatrixAt(i*5+j,dummy.matrix)}
 for(let j=0;j<12;j++){const a=j*2.399+rand()*.4,r=radius*Math.sqrt(rand()),cy=y+t.h*(.5+rand()*.43),size=radius*(.9+rand()*.6);for(let k=0;k<2;k++){dummy.position.set(t.x+Math.sin(a)*r,cy,t.z+Math.cos(a)*r);dummy.rotation.set((rand()-.5)*.6,a+k*Math.PI/2,(rand()-.5)*.4);dummy.scale.set(size,size*(.8+rand()*.35),1);dummy.updateMatrix();crowns.setMatrixAt(i*24+j*2+k,dummy.matrix);crowns.setColorAt(i*24+j*2+k,new T.Color().setHSL(.22+rand()*.035,.2+rand()*.15,.62+rand()*.19))}}
 });
 trunk.castShadow=branches.castShadow=crowns.castShadow=true;trunk.receiveShadow=branches.receiveShadow=crowns.receiveShadow=true;scene.add(trunk,branches,crowns);return foliage;
}
