import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
const db=new PrismaClient();
const origin={Origin:'http://localhost:3012'};
test.afterAll(async()=>db.$disconnect());
async function publicQueries(){const rows=await db.$queryRaw<{calls:bigint}[]>`SELECT coalesce(sum(calls),0)::bigint AS calls FROM pg_stat_statements WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND query ~ '(FROM|JOIN) "public"."(Product|Category|Setting|Page|PublicationState)"'`;return Number(rows[0].calls)}
test('static pages and previously unseen searches need no public SQL',async({page,request})=>{
 const before=await publicQueries();
 for(const route of ['/','/productos','/nosotros','/contacto','/productos/sofa-olivo','/paginas/terminos','/sitemap.xml',`/productos?q=${randomUUID()}&orden=price-desc`,`/productos/no-existe-${randomUUID()}`]){
  const r=await request.get(route);expect([200,404]).toContain(r.status());
 }
 await page.goto('/');await expect(page.locator('.announcement')).toHaveCount(0);
 await page.goto('/productos');await page.getByRole('textbox',{name:'Buscar muebles'}).fill('sofá');await page.getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);
 await page.waitForTimeout(1200);
 expect(await publicQueries()).toBe(before);
});
test('publication changes only after editing and updates generated HTML, settings and pages',async({playwright})=>{
 const admin=await playwright.request.newContext({baseURL:'http://localhost:3012',extraHTTPHeaders:origin});
 expect((await admin.post('/api/auth/login',{data:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}})).ok()).toBeTruthy();
 const category=await db.category.findFirstOrThrow();
 const slug='qa-publication-'+randomUUID();
 const data={name:'Mueble publicado original',slug,sku:slug,description:'Descripción de publicación',categoryId:category.id,price:99900,salePrice:null,image:'/images/chair.webp',gallery:[],material:'Madera',dimensions:'50 × 50 × 80 cm',finishes:['Natural'],leadDays:7,stock:2,madeToOrder:false,featured:false,active:true};
 expect((await admin.post('/api/admin/products',{data})).ok()).toBeTruthy();
 await expect.poll(async()=>await(await admin.get('/productos/'+slug)).text()).toContain(data.name);
 const product=await db.product.findUniqueOrThrow({where:{slug}});
 await db.product.update({where:{id:product.id},data:{name:'Cambio SQL sin publicar'}});
 expect(await(await admin.get('/productos/'+slug)).text()).not.toContain('Cambio SQL sin publicar');
 const next={...data,name:'Mueble publicado actualizado',price:88800};
 expect((await admin.patch('/api/admin/products/'+product.id,{data:next})).ok()).toBeTruthy();
 await expect.poll(async()=>await(await admin.get('/productos/'+slug)).text()).toContain(next.name);
 await expect.poll(async()=>await(await admin.get('/productos')).text()).toContain(next.name);
 const settings=await db.setting.findUniqueOrThrow({where:{key:'store'}});
 const changed={...(settings.value as object),heroTitle:'Portada publicada de prueba'};
 expect((await admin.put('/api/admin/settings',{data:changed})).ok()).toBeTruthy();
 await expect.poll(async()=>await(await admin.get('/')).text()).toContain(changed.heroTitle);
 expect((await admin.put('/api/admin/settings',{data:settings.value})).ok()).toBeTruthy();
 const page={title:'Página publicada de prueba',slug:'qa-pagina-'+randomUUID(),content:'Contenido publicado sin consultas',seoDescription:'Prueba',published:true};
 expect((await admin.post('/api/admin/pages',{data:page})).ok()).toBeTruthy();
 await expect.poll(async()=>await(await admin.get('/paginas/'+page.slug)).text()).toContain(page.content);
 const created=await db.page.findUniqueOrThrow({where:{slug:page.slug}});
 expect((await admin.patch('/api/admin/pages/'+created.id,{data:{...page,published:false}})).ok()).toBeTruthy();
 await expect.poll(async()=>(await admin.get('/paginas/'+page.slug)).status()).toBe(404);
 expect((await admin.delete('/api/admin/products/'+product.id)).ok()).toBeTruthy();
 await expect.poll(async()=>(await admin.get('/productos/'+slug)).status()).toBe(404);
 await admin.dispose();
});
