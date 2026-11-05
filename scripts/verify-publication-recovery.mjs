import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const database=new URL(process.env.DATABASE_URL||'');
if(!database.pathname.endsWith('_test'))throw new Error('Este verificador solo puede usar una base _test.');
const db=new PrismaClient();
const base='http://127.0.0.1:3012';
async function count(){const r=await db.$queryRaw`SELECT coalesce(sum(calls),0)::bigint AS calls FROM pg_stat_statements WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND query ~ '(FROM|JOIN) "public"."(Product|Category|Setting|Page|PublicationState)"'`;return Number(r[0].calls)}
async function restart(){execFileSync('docker',['restart','jhamor-qa'],{stdio:'pipe'});for(let n=0;n<120;n++){try{if((await fetch(base+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('QA no terminó de precargarse.')}
try{
 const product=await db.product.findUniqueOrThrow({where:{slug:'sofa-olivo'}});const name='Sofá recuperado '+randomUUID();
 await db.$transaction([db.product.update({where:{id:product.id},data:{name}}),db.publicationState.upsert({where:{key:'catalog'},create:{key:'catalog',revision:randomUUID()},update:{revision:randomUUID()}})]);
 if((await(await fetch(base+'/productos/sofa-olivo')).text()).includes(name))throw new Error('Un cambio no publicado apareció antes de recuperar la revisión.');
 await restart();
 if(!(await(await fetch(base+'/productos/sofa-olivo')).text()).includes(name))throw new Error('La publicación pendiente no se recuperó tras reiniciar.');
 const before=await count();const responses=[];
 for(const route of ['/','/productos','/nosotros','/contacto','/productos/sofa-olivo','/paginas/terminos',`/productos?q=${randomUUID()}`,`/productos/no-existe-${randomUUID()}`]){
  const r=await fetch(base+route);await r.arrayBuffer();responses.push({route:route.split('?')[0],status:r.status,cache:r.headers.get('x-nextjs-cache')});
 }
 await new Promise(r=>setTimeout(r,1200));const extra=await count()-before;
 if(extra!==0)throw new Error(`${extra} consultas públicas después del reinicio.`);
 const report={at:new Date().toISOString(),recoveredCommittedChange:true,additionalPublicQueriesAfterRestart:extra,responses};
 await writeFile('docs/publication-recovery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await db.$disconnect()}
