export function describeNetwork(info){
 const labels={wifi:'Wi-Fi',cellular:'Datos móviles',ethernet:'Cable Ethernet',bluetooth:'Bluetooth',wimax:'WiMAX',none:'Sin red',other:'Otra conexión'};
 return {type:labels[info?.type]||'Tipo de red no disponible',name:'El navegador no permite leer el nombre de la wifi (SSID).'};
}
export async function checkConnection({online=true,probeUrl,fetcher=globalThis.fetch,timeoutMs=4000}={}){
 if(!online)return {connected:false,reason:'offline'};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{const response=await fetcher(probeUrl,{cache:'no-store',credentials:'omit',signal:controller.signal});if(response.ok&&(await response.text()).trim()==='sinfondo-online-v1')return {connected:true,reason:'online'};return {connected:false,reason:'unreachable'};}catch{return {connected:false,reason:'unreachable'};}finally{clearTimeout(timer);}
}
export function initConnectionIndicator(probeUrl){
 const get=id=>document.getElementById(id),button=get('connectionStatus'),dialog=get('connectionDialog');
 let prepared=null,current=null,checking=false;
 function show(result){current=result;const state=result.connected?'online':'offline';button.dataset.connection=state;const text=result.connected?'Con conexión a Internet':result.reason==='offline'?'Sin conexión a Internet':'Sin conexión comprobada';get('connectionLabel').textContent=text;button.setAttribute('aria-label',text+'. Ver estado y uso sin Internet');button.title=text;get('connectionSummary').textContent=text;const network=describeNetwork(navigator.connection||navigator.mozConnection||navigator.webkitConnection);get('networkType').textContent=result.connected?network.type:'Sin conexión comprobada';get('networkName').textContent=network.name;window.dispatchEvent(new CustomEvent('sinfondo-connection-change',{detail:result}));get('connectionDetail').textContent=result.connected?'La app ha podido contactar con su web. Tus fotos siguen procesándose solo en tu dispositivo.':result.reason==='offline'?'Puedes seguir editando y guardando sin Internet si has preparado la app en este dispositivo.':'La web no responde o no hay acceso a Internet. El editor sigue funcionando con los archivos guardados en este dispositivo.';}
 async function refresh(){if(checking)return;checking=true;try{const result=await checkConnection({online:navigator.onLine!==false,probeUrl});show(navigator.onLine===false?{connected:false,reason:'offline'}:result);}finally{checking=false;}}
 function setPrepared(value){prepared=value;get('connectionReady').textContent=value?'Preparada para funcionar sin Internet en este dispositivo.':'Preparación pendiente: guarda la app, la IA, los iconos y la tipografía con el botón Preparar mientras tengas Internet.';button.dataset.preparing='false';}
 button.onclick=()=>{dialog.showModal();refresh();};get('connectionClose').onclick=()=>{dialog.close();button.focus();};get('connectionRecheck').onclick=refresh;

 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 window.addEventListener('offline',()=>show({connected:false,reason:'offline'}));window.addEventListener('online',refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
 const interval=setInterval(()=>{if(document.visibilityState==='visible')refresh();},30000);window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
 get('connectionReady').textContent='Comprobando que todos los archivos estén guardados para usar la app sin Internet…';
 if(navigator.onLine===false)show({connected:false,reason:'offline'});else refresh();
 return {setPrepared,setPreparing(text){get('connectionReady').textContent=text;button.dataset.preparing='true';},refresh,get prepared(){return prepared;},get state(){return current;}};
}
