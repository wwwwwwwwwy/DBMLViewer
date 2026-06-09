import { FileUp } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { defaultLanguage, t, type Language } from '../../i18n'

type FileImportProps = {
  language?: Language
  onImport: (source: string, name?: string) => void
}

export function FileImport({ language = defaultLanguage, onImport }: FileImportProps) {
  async function handleFile(file?: File) {
    if (!file) return
    onImport(await file.text(), file.name.replace(/\.[^.]+$/, ''))
  }

  const label = t(language, 'editor.importFile')

  return (
    <Button asChild size="icon" variant="outline" title={label}>
      <label aria-label={label} className="relative overflow-hidden" title={label}>
        <FileUp size={18} />
        <input
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
          type="file"
          accept=".dbml,.txt"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
    </Button>
  )
}
