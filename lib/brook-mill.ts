import * as T from 'three';
// Upper-storey segmental heads described in Historic England 1388079.
// Dimensions are interpreted; present-day opening counts remain under review.
export function addBrookUpperWindow(x:number,y:number,z:number,rot:number,glass:T.Material,trim:T.Material,brick:T.Material,batch:(g:T.BufferGeometry,m:T.Material)=>void){
 const w=1.55,h=2.25,rise=.23;
 const place=(g:T.BufferGeometry,m:T.Material)=>{g.rotateY(rot);g.translate(x,y,z);batch(g,m)};
 const box=(u:number,v:number,depth:number,ww:number,hh:number,m:T.Material)=>{const g=new T.BoxGeometry(.36,hh,ww);g.translate(depth,v,u);place(g,m)};
 // Both sides of the thin facade overlay are rendered, matching either polygon winding.
 const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2-rise);for(let k=1;k<=16;k++){const u=w/2-w*k/16;shape.lineTo(u,h/2-rise+rise*(1-Math.pow(u/(w/2),2)))}shape.closePath();
 for(const side of [-1,1]){const g=new T.ShapeGeometry(shape);g.rotateY(side*Math.PI/2);g.translate(side*.15,0,0);place(g,glass)}
 for(const u of [-w/2,w/2])box(u,-rise/2,0,.055,h-rise,trim);
 box(0,-h/2,0,w+.16,.12,trim);
 for(const u of [-w/4,0,w/4])box(u,-rise/2,0,.035,h-rise,trim);
 for(const v of [-h/4,0,h/4])box(0,v,0,w,.035,trim);
 for(let k=0;k<14;k++){const u=-w/2+(k+.5)*w/14,v=h/2-rise+rise*(1-Math.pow(u/(w/2),2));box(u,v+.045,0,w/14+.006,.08,trim);box(u,v+.17,0,w/14-.006,.16,brick)}
}
