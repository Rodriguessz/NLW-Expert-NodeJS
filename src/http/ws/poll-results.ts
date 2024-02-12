import { FastifyInstance } from "fastify";
import { json } from "stream/consumers";
import { z } from "zod";
import { voting } from "../utils/voting-pub-sub";

export async function pollResults(app : FastifyInstance){

    //Websocket: true indica que estamos criando uma rota que utiliza websocket
    app.get("/polls/:pollId/results", {websocket: true}, (connection, request)=>{
        
        const getPollParams = z.object({

            //Espero receber o pollId como parametro e deve ser uma string e Universal Unique ID
            pollId : z.string().uuid(), 
        
        })

        const {pollId} = getPollParams.parse(request.params)


        voting.subscribe(pollId, (message)=>{
            connection.socket.send(JSON.stringify(message))
        })
          

            
    } )
}