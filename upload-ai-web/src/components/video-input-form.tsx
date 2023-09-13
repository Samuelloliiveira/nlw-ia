import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { FileVideo, Upload } from 'lucide-react'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null)

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

  function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value // essa interrogação(?) é porque a Ref demora um tempo para ser criada

    if (!videoFile) {
      return
    }

    // converter o vídeo em áudio
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
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo e separadas por vírgula(,)"
          ref={promptInputRef}
        />
      </div>

      <Button type="submit" className="w-full">
        Carregar vídeo
        <Upload className="w-4 h-4 ml-2" />
      </Button>
    </form >
  )
}