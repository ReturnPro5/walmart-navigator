import { useRef, useState } from "react";
import { ingestFile } from "@/lib/ingest";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");

  async function handleFiles(files: FileList | null) {
    if (!files) return;

    for (const file of Array.from(files)) {
      setProgress(1);
      setStatus(`Uploading ${file.name}…`);

      await ingestFile(file, (p) => {
        setProgress(p.percent);
        setStatus("detail" in p ? (p as any).detail ?? "" : `${p.phase}…`);
      });
    }

    setStatus("Upload complete");
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button onClick={() => inputRef.current?.click()}>
        Upload Inventory CSV
      </Button>

      {progress > 0 && (
        <>
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">{status}</div>
        </>
      )}
    </div>
  );
}
