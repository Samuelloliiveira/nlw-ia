import { FFmpeg } from '@ffmpeg/ffmpeg'

/** ?url faz com que o arquivo seja importado via URL 
 * como se fosse uma tag script */
import coreURL from '../ffmpeg/ffmpeg-core.js?url'
import wasmURL from '../ffmpeg/ffmpeg-core.wasm?url'
import workerURL from '../ffmpeg/ffmpeg-worker.js?url'

let ffmpeg: FFmpeg | null

/** cria uma única instância do FFmpeg para ser compartilhada
 * na aplicação e toda vez que chamar essa função e já tiver sido criada 
 * ele vai reaproveitar a variável de antes, caso não tenha sido criada ela
 * faz do zero */
export async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg
  }

  ffmpeg = new FFmpeg()

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
    })
  }

  return ffmpeg
}