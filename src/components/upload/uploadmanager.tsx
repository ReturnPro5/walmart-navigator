import * as XLSX from "xlsx"
import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

type UploadStatus = "idle" | "reading" | "parsing" | "done" | "error"

export default function UploadManager() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [message, setMessage] = useState<string>("")

  async function handleFile(file: File) {
    try {
      setStatus("reading")
      setProgress(0)
      setMessage(`Reading ${file.name}…`)

      const arrayBuffer = await readFileWithProgress(file, setProgress)

      setStatus("parsing")
      setProgress(0)
      setMessage("Parsing Excel workbook…")

      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: null,
      })

      // IMPORTANT: DO NOT PUT rows INTO REACT STATE
      console.log("Parsed rows:", rows.length)

      setStatus("done")
      setProgress(100)
      setMessage(`Loaded ${rows.length.toLocaleString()} rows`)
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      setMessage(err?.message ?? "Upload failed")
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Upload Excel File</h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {status !== "idle" && (
        <>
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}

      {status === "error" && (
        <Button variant="destructive" onClick={() => location.reload()}>
          Reset
        </Button>
      )}
    </div>
  )
}

/**
 * Reads file in chunks so progress is REAL, not fake
 */
function readFileWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)

    reader.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100)
        onProgress(pct)
      }
    }

    reader.readAsArrayBuffer(file)
  })
}
