// Remove the connected visible pieces touched by the user, at the full editing resolution.
// Original alpha is only used for connectivity; exported alpha remains original × edit mask.
export function removeConnected(rgba,width,height,seeds,baseAlpha=null){
 const size=width*height;
 if(rgba.length!==size*4||baseAlpha&&baseAlpha.length!==size)throw Error('Dimensiones de selección incorrectas.');
 const alpha=baseAlpha?new Uint8ClampedArray(baseAlpha):new Uint8ClampedArray(size).fill(255);
 const seen=new Uint8Array(size),queue=new Int32Array(size);let removed=0,components=0;
 const visible=i=>rgba[i*4+3]>0&&alpha[i]>0;
 for(const point of seeds){
  const x=Math.min(width-1,Math.max(0,Math.floor(point.x*width))),y=Math.min(height-1,Math.max(0,Math.floor(point.y*height))),seed=y*width+x;
  if(seen[seed]||!visible(seed))continue;
  components++;let head=0,tail=0;queue[tail++]=seed;seen[seed]=1;
  while(head<tail){const i=queue[head++],px=i%width,py=Math.floor(i/width);alpha[i]=0;removed++;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=px+dx,ny=py+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const n=ny*width+nx;if(!seen[n]&&visible(n)){seen[n]=1;queue[tail++]=n;}}
  }
 }
 return {alpha,removed,components};
}
