// Conway B3/S23, finite dead boundary. Pure synchronous step; no mutation of input.
export function nextGeneration(grid,width,height){
  const next=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let neighbours=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const nx=x+dx,ny=y+dy;if((dx||dy)&&nx>=0&&nx<width&&ny>=0&&ny<height)neighbours+=grid[ny*width+nx];
    }
    const i=y*width+x;next[i]=Number(neighbours===3||(grid[i]===1&&neighbours===2));
  }
  return next;
}
