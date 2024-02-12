
//importando a função fastify da biblioteca fastifys
import fastify from "fastify"
//Fazendo uma requisição para o fastify cookies
import cookie from "@fastify/cookie"
import { createPoll } from "./routes/create-poll"
import { getPoll } from "./routes/get-poll"
import { voteOnPoll } from "./routes/vote-on-poll"
import {fastifyWebsocket} from "@fastify/websocket"
import { pollResults } from "./ws/poll-results"



//Usando a função fastify para iniciar nossa app web
const app = fastify()


app.register(fastifyWebsocket)
app.register(cookie, {
    secret: "polls-cookie", // for cookies signature
    hook: 'onRequest', // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
})

//Registando minhas rotas
app.register(createPoll)

app.register(getPoll)

app.register(voteOnPoll)

app.register(pollResults)


//Inicia minha app quando a porta 3333 for chamada e meu servidor iniciado
app.listen({port: 3333}).then(()=>{
    console.log(`HTTP server rodando em: http://localhost:3333`)
})





