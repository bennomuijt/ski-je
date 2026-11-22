/* SKI-je groepsfoto: automatische verkleining op toestel, alleen een compacte JPEG naar Cloudflare. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='skije-cloudflare-room-v1';
 const TARGET_BYTES=60000; // Max. 60 kB per groepsfoto, ongeacht de originele foto.
 const PREFIX='data:image/jpeg;base64,';
 const photoImage=$('cf-group-photo-image'),placeholder=$('cf-group-photo-placeholder');
 const choose=$('cf-group-photo-upload'),input=$('cf-group-photo-file');
 const remove=$('cf-group-photo-remove'),controls=$('cf-group-photo-controls');
 if(!photoImage||!placeholder||!choose||!input||!remove||!controls)return;
 let busy=false,requestId=0,hasPhoto=false;
 const status=text=>{const el=$('cf-group-photo-status');if(el)el.textContent=text;};
 const byteLabel=n=>n>=1024*1024?(n/1024/1024).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' kB';
 function identity(){
  try{
   const g=JSON.parse(localStorage.getItem(KEY)||'null');
   return g&&g.room&&g.memberId&&g.token?g:null;
  }catch{return null;}
 }
 function controlsState(){
  const g=identity();
  controls.hidden=!g?.owner;
  choose.disabled=busy;
  remove.disabled=busy;
  remove.hidden=!hasPhoto||!g?.owner;
  choose.textContent=hasPhoto?'📷 Groepsfoto vervangen':'📷 Groepsfoto toevoegen';
 }
 function showPhoto(photo){
  const valid=photo&&typeof photo.image==='string'&&photo.image.length<=90000&&/^[A-Za-z0-9+/]+={0,2}$/.test(photo.image);
  hasPhoto=!!valid;
  photoImage.hidden=!valid;
  placeholder.hidden=!!valid;
  photoImage.src=valid?PREFIX+photo.image:'';
  controlsState();
 }
 function clearPhoto(){
  ++requestId;showPhoto(null);
  status('Iedereen in de groep ziet dezelfde foto. De groepsbeheerder kan deze aanpassen.');
 }
 async function api(action,payload={},owner=identity()){
  if(!owner)throw Error('Meld je eerst aan bij een skigroep.');
  const response=await fetch('/api/group/photo',{
   method:'POST',cache:'no-store',headers:{'content-type':'application/json'},
   body:JSON.stringify({room:owner.room,memberId:owner.memberId,token:owner.token,action,...payload})
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.ok)throw Error(result?.error||'De groepsfoto kon niet worden verwerkt.');
  return result;
 }
 async function reloadPhoto(){
  const g=identity();
  const current=++requestId;
  controlsState();
  if(!g){showPhoto(null);return;}
  try{
   const result=await api('get',{},g);
   if(current!==requestId||identity()?.room!==g.room)return;
   showPhoto(result.photo);
   status(result.photo?'Groepsfoto zichtbaar voor alle leden.':'Nog geen groepsfoto. De beheerder kan er een toevoegen.');
  }catch(error){
   if(current===requestId)status('Groepsfoto ophalen mislukt: '+error.message);
  }
 }
 function decodeImage(file){
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file);
   const img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Dit beeldformaat wordt niet ondersteund door je telefoon of browser. Gebruik bijvoorbeeld JPG, PNG of WebP.'));};
   img.src=url;
  });
 }
 async function compress(file){
  if(!file)throw Error('Selecteer eerst een afbeelding.');
  const looksLikeImage=file.type.startsWith('image/')||/\.(jpg|jpeg|png|webp|gif|avif|heic|heif|bmp|tif|tiff)$/i.test(file.name||'');
  if(!looksLikeImage)throw Error('Kies een foto of afbeelding, geen document.');
  const image=await decodeImage(file);
  const naturalWidth=image.naturalWidth,naturalHeight=image.naturalHeight;
  if(!naturalWidth||!naturalHeight)throw Error('Deze afbeelding kan niet worden geopend.');
  let longest=900,quality=0.77;
  for(let attempt=0;attempt<12;attempt++){
   const factor=Math.min(1,longest/Math.max(naturalWidth,naturalHeight));
   const width=Math.max(1,Math.round(naturalWidth*factor));
   const height=Math.max(1,Math.round(naturalHeight*factor));
   const canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Fotoverwerking op deze telefoon niet beschikbaar.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
   ctx.drawImage(image,0,0,width,height);
   const encodedUrl=canvas.toDataURL('image/jpeg',quality);
   canvas.width=0;canvas.height=0;
   if(!encodedUrl.startsWith(PREFIX))throw Error('De foto kon niet worden omgezet naar JPEG.');
   const encoded=encodedUrl.slice(PREFIX.length);
   const bytes=Math.ceil(encoded.length*3/4)-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);
   if(bytes>0&&bytes<=TARGET_BYTES&&encoded.length<=90000)return {encoded,bytes};
   longest=Math.max(120,Math.floor(longest*.79));
   quality=Math.max(.37,quality-.065);
  }
  throw Error('De foto kan op dit toestel niet klein genoeg worden gemaakt. Probeer een andere foto.');
 }
 choose.addEventListener('click',()=>{if(!busy&&identity()?.owner)input.click();});
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];
  input.value='';
  if(!file)return;
  const g=identity();
  if(!g?.owner){status('Alleen de beheerder kan de groepsfoto aanpassen.');return;}
  busy=true;controlsState();
  status('Foto automatisch verkleinen, zonder locatie- of cameragegevens...');
  try{
   const compact=await compress(file);
   if(identity()?.room!==g.room)throw Error('Je bent inmiddels van skigroep gewisseld.');
   status('Foto verkleind van '+byteLabel(file.size)+' naar '+byteLabel(compact.bytes)+'. Uploaden...');
   const response=await api('save',{image:compact.encoded},g);
   if(identity()?.room!==g.room)return;
   ++requestId;showPhoto({image:compact.encoded,at:response.photo?.at});
   status('Groepsfoto opgeslagen: '+byteLabel(file.size)+' → '+byteLabel(compact.bytes)+'. Ook zichtbaar voor de andere groepsleden.');
  }catch(error){status('Groepsfoto niet opgeslagen: '+(error?.message||'onbekende fout'));}
  finally{busy=false;controlsState();}
 });
 remove.addEventListener('click',async()=>{
  if(!identity()?.owner||busy||!hasPhoto||!confirm('Groepsfoto voor alle leden verwijderen?'))return;
  busy=true;controlsState();
  const g=identity();
  try{
   await api('remove',{},g);
   if(identity()?.room!==g.room)return;
   ++requestId;showPhoto(null);status('De groepsfoto is verwijderd voor alle groepsleden.');
  }catch(error){status('Verwijderen mislukt: '+error.message);}
  finally{busy=false;controlsState();}
 });
 window.addEventListener('skije:group-social',e=>{
  const type=e.detail?.type;
  if(type==='welcome'||type==='group-photo-updated')reloadPhoto();
  if(type==='reset'||type==='inactive')clearPhoto();
 });
 $('group-section')?.addEventListener('toggle',()=>{if($('group-section').open&&identity())reloadPhoto();});
 controlsState();showPhoto(null);
})();