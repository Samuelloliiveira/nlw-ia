import { FastifyInstance } from 'fastify'
import { fastifyMultipart } from '@fastify/multipart'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import { prisma } from '../lib/prisma'

/** pipeline serve para aguardar todo o processo de upload, mas usa
 * uma api antiga, para saber que esse processo finalizou antigamente
 * usava callbacks, mas hoje em dia temos o async/await do JS, só que algumas
 * funções node ainda não tem suporte então podemos usar promisify( que transforma
 * uma função antiga do node para usar Promise - async/await ) */
const pump = promisify(pipeline)

// Nessa rota recebemos o vídeo já convertido em áudio pela aplicação web
export async function uploadVideoRoute(app: FastifyInstance) {
  //Configuração do arquivo de video - 1_048_576 = 1MB
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, // 25MB
    }
  })

  app.post('/videos', async (req, reply) => {
    const data = await req.file()

    if (!data) {
      return reply.status(400).send({ error: "Missing file input" })
    }

    const extension = path.extname(data.filename)

    if (extension !== '.mp3') {
      return reply.status(400).send({ error: "Invalid input type, please upload a MP3" })
    }

    // Evitando que os arquivos sejam salvos com o mesmo nome
    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    // Salvando arquivo na pasta
    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

    // Fazer upload do arquivo aos poucos com stream
    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      }
    })

    return {
      video
    }
  })
}