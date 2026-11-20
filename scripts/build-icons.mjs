// Recreate Android/iOS icons from the ORIGINAL SKI-je wordmark embedded in
// brand-skije.svg. No invented logo; produces installable 192/512 PNG icons.
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const xml=await readFile(new URL('../public/brand-skije.svg',import.meta.url),'utf8');
const match=xml.match(/href="data:image\/webp;base64,([^"]+)"/);
if(!match)throw Error('Origineel SKI-je-logo ontbreekt.');
const logo=Buffer.from(match[1],'base64');
const dir=new URL('../public/icons/',import.meta.url);
await mkdir(dir,{recursive:true});
for(const size of [192,512]){
  const logoWidth=Math.round(size*.78);
  const logoData=await sharp(logo).resize({width:logoWidth,fit:'inside'}).png().toBuffer();
  const {width,height}=await sharp(logoData).metadata();
  const background=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
   <defs><linearGradient id="g" x2="0.7" y2="1"><stop stop-color="#0787c1"/><stop offset="1" stop-color="#074470"/></linearGradient></defs>
   <rect width="512" height="512" rx="116" fill="url(#g)"/>
   <circle cx="406" cy="92" r="39" fill="#ffe39b"/>
   <path d="M0 365 128 218 234 342 333 195 512 388 512 512 0 512Z" fill="#ecf8ff" opacity=".29"/>
   <path d="M0 431 152 283 271 405 370 298 512 438 512 512 0 512Z" fill="#eafaff" opacity=".22"/>
   </svg>`);
  const left=Math.round((size-width)/2),top=Math.round((size-height)/2);
  await sharp(background).composite([{input:logoData,left,top}]).png().toFile(fileURLToPath(new URL(`icon-${size}-v455.png`,dir)));
}
