import { Upload } from 'lucide-react';

export function UploadPanel() {
  return (
    <div className="w-full rounded-lg border-2 border-dashed border-blue-500 bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-semibold text-blue-700">
              Upload Listings Snapshot
            </div>
            <div className="text-sm text-blue-600">
              Upload CSV or Excel • Replaces existing data
            </div>
          </div>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                alert(`Selected file: ${file.name}`);
              }
            }}
          />
          <span className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Choose File
          </span>
        </label>
      </div>
    </div>
  );
}
