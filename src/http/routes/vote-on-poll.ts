//Importa a conexão com o meu BD
import {prisma} from "../../lib/prisma"

import {randomUUID, verify} from "node:crypto"
import fastify, { FastifyInstance } from "fastify"

import { getPoll } from "./get-poll"

//Importando a biblioteca de validação zod
import {z} from "zod"
import { redis } from "../../lib/redis"
import { voting } from "../utils/voting-pub-sub"






//Em fastify é necessário exportar a função de rotas como async e o app é passado como argumento de tipagem FastifyInstance
export async function voteOnPoll(app : FastifyInstance){
    

    app.post("/polls/:pollId/votes", async (request, reply)=>{
       
        const voteOnPollBody = z.object({
          
            pollOptionId: z.string().uuid(),
        
        })

        const voteOnPollParams = z.object({
            pollId : z.string().uuid()
        })

        const {pollOptionId} = voteOnPollBody.parse(request.body)
        const {pollId} = voteOnPollParams.parse(request.params)
        
        // const poll = await prisma.poll.findUnique({
        //     where: {
        //         id: pollId
        //     }
        // })

        
        let sessionId = request.cookies.sessionId

        //Verifica se o usuário já votou nessa enquete
        if(sessionId){
            const userPreviousVoteOnPolls = await prisma.vote.findUnique({
                where: {
                    //Indice Unico criado na tabela vote
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    }
                }
            })

            console.log(userPreviousVoteOnPolls)

            
            if(userPreviousVoteOnPolls && userPreviousVoteOnPolls.pollOptionId !== pollOptionId){
                //Apaga o voto anterior 
                //Insere o novo
                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPolls.id
                    }
                })


                //Se deletarmos, precisamos decrementar do zredis na opção antiga (UserPrevious)
           const votes =  await redis.zincrby(pollId, -1 , userPreviousVoteOnPolls.pollOptionId)

           voting.publish(pollId, {
                pollOptionId: userPreviousVoteOnPolls.pollOptionId,
                 votes: Number(votes)
        })

           

            }else if(userPreviousVoteOnPolls){
                return reply.status(400).send({message:`User already vote on this poll! Poll:${pollId}` })

            }
        }
        
        //Verifica se um cookie já foi criado para este usuário
        if(!sessionId){
            //Garantindo que o usuário possa votar apenas uma vez. Iremos utilizar os cookies e a bibli fastify cookies para facilitar o uso.
            sessionId = randomUUID()
        
        //Utiliza o método setCoockie do fastify/coockie para lidar
        reply.setCookie("sessionId", sessionId, {
            path: "/" ,// Quais rotas da app irão disponibilizar o cookie ("/" == todas)
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            signed: true, //Usuário não vai poder modiicar o cookie
            httpOnly: true, //Somente acessivel pelo back da minha app
        })
        }

       const vote =  await prisma.vote.create({
            data:{
               sessionId,
               pollId,
               pollOptionId,    

            }
        })

        //Utilizando o redis para computar os votos e rankea-los

        //Incrementa 1 voto na pollOptionId que pertence ao PollId indicado
         const votes = await redis.zincrby(pollId, 1 , pollOptionId)
        
        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes)
        })
        return reply.status(201).send({
           vote : vote
        })
    })
}