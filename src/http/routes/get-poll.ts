//Importa a conexão com o meu BD
import {prisma} from "../../lib/prisma"

import { FastifyInstance } from "fastify"


//Importando a biblioteca de validação zod
import {z} from "zod"
import { redis } from "../../lib/redis"

export async function getPoll(app : FastifyInstance){
    

    //Pegando uma poll unica, é preciso referencia o ID na url (Route Param)
    app.get("/polls/:pollId", async (request, reply)=>{


        //Utilizando z para definir qual parametro deve conter na minha URL
        const getPollParams = z.object({

            //Espero receber o pollId como parametro e deve ser uma string e Universal Unique ID
            pollId : z.string().uuid(), 
        
        })
    
        //Request params pois estou analisando a url e não o corpo.
        const {pollId} = getPollParams.parse(request.params) //Desestruturação do objeto retornado, por isso usamos as chaves e a propriedades
       

       const poll = await prisma.poll.findUnique({

        //Onde o ID da poll seja igual o ID passado na URL
        where: {
            id : pollId
        }, 

        //Para que seja retornado as opcões relacionadas a tabela poll, usamos o inlcude
        include: {
           
           //Incluir as options  
           options: {

            //selecionar as options e traze-las com id e titulo
            select:{
                id : true,
                title: true,
            }
           }
        }
       })

       if(!poll){
        return reply.status(400).send({message: "Pool not found"})
       }

       //Me traz todas as opcoes com seus respectivos resultados
       const result = await redis.zrange(pollId, 0 , -1, 'WITHSCORES')

       //Reduce é um método para transformar o array em uma outra estrutura
       const votes = result.reduce((obj, row, index)=>{
            if( index % 2 === 0){
                const score = result[index + 1]

                //Mescla os objetos
                Object.assign(obj, {
                    [row] : Number(score)
                })
            }

            return obj
       }, {} as Record<string, number>)

       console.log(votes)

       //Reply 201 ( POST OU PUT realizado com sucesso)
        return reply.send({

            Poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map((option)=>{
                    return {
                        pollOptionId : option.id,
                        title: option.title,
                        score: (option.id in votes) ? votes[option.id] : 0,
                    }
                })
            }
            
        })
    })
}