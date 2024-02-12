//Importa a conexão com o meu BD
import {prisma} from "../../lib/prisma"

import { FastifyInstance } from "fastify"

//Importando a biblioteca de validação zod
import {z} from "zod"

//Em fastify é necessário exportar a função de rotas como async e o app é passado como argumento de tipagem FastifyInstance
export async function createPoll(app : FastifyInstance){
   
    app.post("/polls", async (request, reply)=>{

        /*Utilizando o zod para indicar qual estrutura eu quero que meu corpo da 
        requisição tenha*/
    
        const createPollBody = z.object({
            /*Quero que minha requisição possua obrigatóriamente um title e esse 
            deve ser uma string*/
            title : z.string(),
            
            /* Options será um array pois uma enquete pode ter mais de uma opção
            e cada opção deverá ter um titulo, por isso passamos z.string() dentro
            do array*/

            options: z.array(z.string())  

            
            
        })
    
        /*Aqui estamos falando para o esquema que criamos (cratePollBody) analisar
        (parse) o corpo da requisição (request.body)*/
    
        //Além de validar, retona as informações do body já tipadas
        const {title, options} = createPollBody.parse(request.body) //Desestruturação do objeto retornado, por isso usamos as chaves e a propriedades
       //Insere as polls no banco de dados 

       const poll = await prisma.poll.create({
            //Propriedade data é um objeto que espera receber os valores da inserção. Esses valores devem existir como tabela no bd
            data: {
                title: title,
                options: {
                    //CreateMany pois iremos inserir mais de uma opção por vez - 1 <> N
                    createMany: {
                        data: options.map((option) => {
                            return {
                                // Esse campo precisa ser exatamente como está definido na tabela
                                title: option,

                                /* No prisma, quando criamos um relacionamento ao mesmo tempo que criamos o registro da 
                                tabela, não é necessário indicar o id de referencia.

                                Decidimos colocar o relacionamento dentro, para não termos problemas de transação no futuro

                                // /*A chave estrangeira precisa fazer referencia ao Id primario da tabela Poll, justamente
                                // pro relacionamento ocorrer*/
                                // pollId:

                            }
                        })
                    }
                }
               
            }
       })
    

       //Reply 201 ( POST OU PUT realizado com sucesso)
        return reply.status(201).send({
            pollId: poll.id,
            pollOptions: options,
            
        })
    })
}