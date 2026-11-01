import { env, SamModel, AutoProcessor, RawImage, Tensor } from './transformers.min.js';
// Transformers requests virtual model paths; this adapter maps each one to a real flat file.
const flatModelFiles={
 'slimsam/config.json':'model-config.json',
 'slimsam/preprocessor_config.json':'model-preprocessor.json',
 'slimsam/onnx/vision_encoder_quantized.onnx':'vision_encoder_quantized.onnx',
 'slimsam/onnx/prompt_encoder_mask_decoder_quantized.onnx':'prompt_encoder_mask_decoder_quantized.onnx'
};
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = new URL('./', self.location.href).href;
env.useBrowserCache = false;
env.useFSCache = false;
env.useCustomCache = true;
env.customCache={
 async match(request){const path=new URL(typeof request==='string'?request:request.url,self.location.href).pathname;const key=Object.keys(flatModelFiles).find(name=>path.endsWith('/'+name));if(!key)return undefined;const response=await fetch(new URL(flatModelFiles[key],self.location.href));return response.ok?response:undefined;},
 async put(){}
};
env.backends.onnx.wasm.wasmPaths = new URL('./', self.location.href).href;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let model, processor, embeddings, sizes, originalSizes;
self.onmessage = async ({data:m}) => {
 try {
  if (m.type === 'image') {
   if (!model) {
    self.postMessage({type:'status',text:'Preparando la IA en tu dispositivo…'});
    model = await SamModel.from_pretrained('slimsam', {quantized:true});
    processor = await AutoProcessor.from_pretrained('slimsam');
   }
   self.postMessage({type:'status',text:'Analizando la foto… La primera vez puede tardar un poco.'});
   embeddings = null;
   const inputs = await processor(new RawImage(new Uint8ClampedArray(m.pixels),m.width,m.height,4));
   originalSizes=inputs.original_sizes; sizes=inputs.reshaped_input_sizes;
   embeddings = await model.get_image_embeddings(inputs);
   self.postMessage({type:'ready'});
  } else if(m.type === 'segment') {
   if(!embeddings) throw new Error('No hay una foto preparada.');
   const points=processor.reshape_input_points([m.points.map(p=>[p.x*originalSizes[0][1],p.y*originalSizes[0][0]])],originalSizes,sizes);
   const labels=new Tensor('int64',BigInt64Array.from(m.points.map(p=>BigInt(p.label))),[1,1,m.points.length]);
   const out=await model({...embeddings,input_points:points,input_labels:labels});
   const masks=processor.post_process_masks(out.pred_masks,originalSizes,sizes,{binarize:false})[0];
   const count=originalSizes[0][0]*originalSizes[0][1];
   const order=Array.from(out.iou_scores.data, (score,i)=>({score,i})).sort((a,b)=>b.score-a.score);
   const results=order.map(({i})=>{
    const alpha=new Uint8ClampedArray(count);
    for(let k=0;k<count;k++) alpha[k]=Math.round(255/(1+Math.exp(-masks.data[i*count+k]*3)));
    return alpha.buffer;
   });
   self.postMessage({type:'masks',masks:results,width:originalSizes[0][1],height:originalSizes[0][0]},results);
  }
 } catch(e) { self.postMessage({type:'error',text:e.message || String(e)}); }
};
