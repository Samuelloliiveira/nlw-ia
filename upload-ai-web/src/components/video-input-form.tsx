import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { FileVideo, Upload } from 'lucide-react'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { getFFmpeg } from '@/lib/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { api } from '@/lib/axios'

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success'

const statusMessage = {
  converting: 'Convertendo...',
  generating: 'Transcrevendo...',
  uploading: 'Enviando...',
  success: 'Sucesso!',
}

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('waiting')

  /** useRef serve para acessar a versão de um elemento na DOM */
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      return
    }

    //files sempre vai ser um array
    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File) {
    console.log('The conversion started...')

    const ffmpeg = await getFFmpeg()

    /** writeFile coloca o arquivo dentro do contexto do ffmpeg.
     * Quando usamos WebAssembly é como se o ffmpeg não estivesse
     * rodando na máquina, é como se estivesse rodando em um contêiner
     * num ambiente isolado */
    await ffmpeg.writeFile('input.mp4', await fetchFile(video)) // fetchFile converte o arquivo em uma representação binária

    // ffmpeg.on('log', log => {
    //   console.log(log)
    // })

    ffmpeg.on('progress', progress => {
      console.log('Convert progress: ' + Math.round(progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    })

    console.log('Convert finished.')

    return audioFile
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value // essa interrogação(?) é porque a Ref demora um tempo para ser criada

    if (!videoFile) {
      return
    }

    setStatus('converting')

    const audioFile = await convertVideoToAudio(videoFile)

    const data = new FormData() // o formato recebido no back é multipart/form-data

    //cria um novo campo do tipo file com o valor audioFile
    data.append('file', audioFile)

    setStatus('uploading')

    const response = await api.post('/videos', data)

    const videoId = response.data.video.id

    setStatus('generating')

    await api.post(`/videos/${videoId}/transcription`, {
      prompt,
    })

    setStatus('success')

    props.onVideoUploaded(videoId)
  }

  /** useMemo recebe uma função como parâmetro e
   * um segundo parâmetro chamado array de dependências.
   * Serve para evitar que algo seja gerado do zero toda 
   * vez que o componente sofrer uma alteração. */
  const previewURL = useMemo(() => {
    if (!videoFile) {
      return
    }

    return URL.createObjectURL(videoFile) // cria uma URL de pré-visualização de um arquivo
  }, [videoFile]) // previewURL só vai mudar se o videoFile mudar

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        className=" relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm gap-2 items-center justify-center text-muted-foreground hover:bg-violet-600/40 hover:text-white hover:border-0"
        htmlFor="video"
      >
        {videoFile ? (
          <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
        ) : (
          <>
            Selecione um vídeo
            <FileVideo className="w-4 h-4" />
          </>
        )}
      </label>

      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo e separadas por vírgula(,)"
        />
      </div>

      <Button
        data-success={status === 'success'} // data attribute
        disabled={status !== 'waiting'}
        type="submit"
        className="w-full data-[success=true]:bg-emerald-400 data-[success=true]:text-black"
      >
        {status === 'waiting' ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : statusMessage[status]}
      </Button>
    </form >
  )
}