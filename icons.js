export const appIcons=[
 {id:'1',name:'Marrón y crema',slug:'marron'},
 {id:'2',name:'Grafito y rojo',slug:'grafito-rojo'},
 {id:'3',name:'Rojo y gris',slug:'rojo-gris'},
 {id:'4',name:'Gris y rojo',slug:'gris-rojo'},
 {id:'5',name:'Azul y gris',slug:'azul-gris'},
 {id:'6',name:'Lima y arena',slug:'lima-arena'}
];
export const iconOfflinePaths=['./icons.js',...appIcons.flatMap(({id})=>[
 `./manifest-icon-${id}.webmanifest`,`./install-icon-${id}.html`,
 ...[180,192,512].map(size=>`./icons/choices/${id}/icon-${size}.png`),
 `./icons/choices/${id}/icon.ico`
])];
const byId=id=>document.getElementById(id);
const isValid=id=>appIcons.some(icon=>icon.id===id);
let selectedIcon='1';
try{const stored=localStorage.getItem('sinfondo-app-icon');if(isValid(stored))selectedIcon=stored;}catch{}
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const installMatch=location.pathname.match(/\/install-icon-([1-6])\.html$/);
const queryIcon=new URLSearchParams(location.search).get('appIcon');
if(installMatch&&!standalone)selectedIcon=installMatch[1];
else {let stored=false;try{stored=isValid(localStorage.getItem('sinfondo-app-icon'));}catch{}if(!stored){if(isValid(queryIcon))selectedIcon=queryIcon;else if(installMatch)selectedIcon=installMatch[1];}}
function applyIcon(id){
 if(!isValid(id))return;
 selectedIcon=id;const icon=appIcons.find(item=>item.id===id);
 const brand=document.querySelector('.brand img');brand.src=`icons/choices/${id}/icon-192.png`;
 document.querySelector('link[rel="manifest"]').href=`manifest-icon-${id}.webmanifest`;
 document.querySelector('link[rel="apple-touch-icon"]').href=`icons/choices/${id}/icon-180.png`;
 document.querySelector('link[rel="icon"]').href=`icons/choices/${id}/icon-192.png`;
 document.querySelectorAll('[data-app-icon]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.appIcon===id)));
 byId('appIconSelection').textContent=`Elegido: ${icon.name}${id==='1'?' · predeterminado':''}`;
 byId('appIconInstall').href=`install-icon-${id}.html`;
 const png=byId('appIconDownloadPng'),ico=byId('appIconDownloadIco');
 png.href=`icons/choices/${id}/icon-512.png`;png.download=`SinFondo-${icon.slug}.png`;
 ico.href=`icons/choices/${id}/icon.ico`;ico.download=`SinFondo-${icon.slug}.ico`;
 try{localStorage.setItem('sinfondo-app-icon',id);}catch{}
}
for(const icon of appIcons){const button=document.createElement('button');button.type='button';button.className='app-icon-option';button.dataset.appIcon=icon.id;button.setAttribute('aria-label',`Icono ${icon.id}: ${icon.name}`);button.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src=`icons/choices/${icon.id}/icon-192.png`;img.width=92;img.height=92;img.alt='';const label=document.createElement('span');label.textContent=icon.name;button.append(img,label);button.onclick=()=>applyIcon(icon.id);byId('appIconOptions').append(button);}
applyIcon(selectedIcon);
const dialog=byId('appIconDialog');byId('appIconBtn').onclick=()=>dialog.showModal();
function closeDialog(){dialog.close();byId('appIconBtn').focus();}
byId('appIconClose').onclick=closeDialog;byId('appIconDone').onclick=closeDialog;
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();});
if(installMatch&&!standalone){byId('iconInstallNotice').hidden=false;byId('iconInstallTitle').textContent=`Icono listo para instalar: ${appIcons.find(icon=>icon.id===selectedIcon).name}`;}
