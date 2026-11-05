import type {MetadataRoute} from 'next';
import {readPublishedSnapshot} from '@/lib/published';
import {unstable_cache} from 'next/cache';
export const revalidate=false;
const entries=unstable_cache(async()=>{
 const snapshot=await readPublishedSnapshot();
 return [...snapshot.products.map(p=>({url:`https://jhamor.purprum.com/productos/${p.slug}`,lastModified:p.updatedAt})),...snapshot.pages.map(p=>({url:`https://jhamor.purprum.com/paginas/${p.slug}`,lastModified:p.updatedAt}))];
},['published-sitemap-v2'],{tags:['catalog','pages'],revalidate:false});
export default async function sitemap():Promise<MetadataRoute.Sitemap>{return [{url:'https://jhamor.purprum.com'},{url:'https://jhamor.purprum.com/productos'},{url:'https://jhamor.purprum.com/nosotros'},{url:'https://jhamor.purprum.com/contacto'},...await entries()]}
