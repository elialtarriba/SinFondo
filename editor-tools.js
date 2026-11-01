export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export class ImageView{
 constructor(){this.zoom=1;this.x=0;this.y=0;this.fit=1;this.width=1;this.height=1;this.imageWidth=1;this.imageHeight=1;}
 layout(width,height,imageWidth,imageHeight,reset=false){const cx=(this.width/2-this.x)/(this.fit*this.zoom),cy=(this.height/2-this.y)/(this.fit*this.zoom);Object.assign(this,{width,height,imageWidth,imageHeight});this.fit=Math.min(width/imageWidth,height/imageHeight,1);if(reset){this.zoom=1;this.x=(width-imageWidth*this.fit)/2;this.y=(height-imageHeight*this.fit)/2;}else{this.x=width/2-cx*this.scale;this.y=height/2-cy*this.scale;}this.constrain();}
 get scale(){return this.fit*this.zoom;}
 constrain(){const w=this.imageWidth*this.scale,h=this.imageHeight*this.scale;this.x=w<=this.width?(this.width-w)/2:clamp(this.x,this.width-w,0);this.y=h<=this.height?(this.height-h)/2:clamp(this.y,this.height-h,0);}
 zoomAt(zoom,x=this.width/2,y=this.height/2){const ix=(x-this.x)/this.scale,iy=(y-this.y)/this.scale;this.zoom=clamp(zoom,1,20);this.x=x-ix*this.scale;this.y=y-iy*this.scale;this.constrain();}
 pan(dx,dy){this.x+=dx;this.y+=dy;this.constrain();}
 imagePoint(x,y){return {x:(x-this.x)/(this.imageWidth*this.scale),y:(y-this.y)/(this.imageHeight*this.scale)};}
}
class Heap{
 constructor(){this.items=[];}
 push(id,score){const value={id,score};let i=this.items.length;this.items.push(value);while(i){const p=(i-1)>>1;if(this.items[p].score<=score)break;this.items[i]=this.items[p];i=p;}this.items[i]=value;}
 pop(){const top=this.items[0],last=this.items.pop();if(this.items.length){let i=0;while(true){let c=i*2+1;if(c>=this.items.length)break;if(c+1<this.items.length&&this.items[c+1].score<this.items[c].score)c++;if(this.items[c].score>=last.score)break;this.items[i]=this.items[c];i=c;}this.items[i]=last;}return top;}
}
// Edge-guided paths are calculated on a small image to keep touch interactions responsive.
export class MagneticEdges{
 constructor(rgba,width,height){this.width=width;this.height=height;this.edges=new Float32Array(width*height);let maximum=1;
  const sample=(x,y,c)=>rgba[(clamp(y,0,height-1)*width+clamp(x,0,width-1))*4+c];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){let magnitude=0;for(let c=0;c<4;c++){const gx=sample(x+1,y,c)-sample(x-1,y,c),gy=sample(x,y+1,c)-sample(x,y-1,c);magnitude+=Math.hypot(gx,gy)*(c===3?1.4:1/3);}this.edges[y*width+x]=magnitude;maximum=Math.max(maximum,magnitude);}
  const normalizer=Math.min(maximum,220);for(let i=0;i<this.edges.length;i++)this.edges[i]=Math.min(1,this.edges[i]/normalizer);
 }
 grid(p){return{x:clamp(Math.round(p.x*(this.width-1)),0,this.width-1),y:clamp(Math.round(p.y*(this.height-1)),0,this.height-1)};}
 normalized(x,y){return{x:x/(this.width-1||1),y:y/(this.height-1||1)};}
 snap(point,radius=8){const p=this.grid(point);radius=clamp(Math.round(radius),1,24);let best={...p},score=-Infinity;for(let y=Math.max(0,p.y-radius);y<=Math.min(this.height-1,p.y+radius);y++)for(let x=Math.max(0,p.x-radius);x<=Math.min(this.width-1,p.x+radius);x++){const d=Math.hypot(x-p.x,y-p.y);if(d>radius)continue;const value=this.edges[y*this.width+x]-.5*d/radius;if(value>score){score=value;best={x,y};}}return this.normalized(best.x,best.y);}
 path(from,to,magnetic=true){if(!magnetic)return [from,to];const a=this.grid(from),b=this.grid(to);if(a.x===b.x&&a.y===b.y)return[from,to];const pad=clamp(Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*.18),12,48),left=Math.max(0,Math.min(a.x,b.x)-pad),top=Math.max(0,Math.min(a.y,b.y)-pad),right=Math.min(this.width-1,Math.max(a.x,b.x)+pad),bottom=Math.min(this.height-1,Math.max(a.y,b.y)+pad),w=right-left+1,h=bottom-top+1,n=w*h,start=(a.y-top)*w+a.x-left,end=(b.y-top)*w+b.x-left;
  const costs=new Float32Array(n).fill(Infinity),previous=new Int32Array(n).fill(-1),closed=new Uint8Array(n),heap=new Heap();costs[start]=0;heap.push(start,0);
  while(heap.items.length){const {id}=heap.pop();if(closed[id])continue;if(id===end)break;closed[id]=1;const x=id%w,y=Math.floor(id/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;const next=ny*w+nx;if(closed[next])continue;const edge=this.edges[(ny+top)*this.width+nx+left],distance=dx&&dy?Math.SQRT2:1,cost=costs[id]+distance*(.12+2*(1-edge)**2);if(cost<costs[next]){costs[next]=cost;previous[next]=id;heap.push(next,cost+.12*Math.hypot(nx+left-b.x,ny+top-b.y));}}}
  if(previous[end]===-1)return[from,to];const result=[];for(let id=end;id!==-1;id=previous[id]){result.push(this.normalized(id%w+left,Math.floor(id/w)+top));if(id===start)break;}result.reverse();result[0]=from;result[result.length-1]=to;return result;
 }
}
