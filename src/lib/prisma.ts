//Importando o Prisma Cliente para estabelecer a conexão com o BD
import { PrismaClient } from "@prisma/client"

//Estabelecendo a conexão com meu BD
export const prisma = new PrismaClient({
    log: ["query"]
})