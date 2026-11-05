import {PrismaClient} from '@prisma/client';
const db=new PrismaClient();
try{const now=new Date();await db.$transaction([db.session.deleteMany({where:{expiresAt:{lt:now}}}),db.rateLimit.deleteMany({where:{expiresAt:{lt:now}}})]);console.log('Expired sessions and rate limit windows removed.')}finally{await db.$disconnect()}
