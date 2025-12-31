// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadManager from "./components/UploadManager";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadManager />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
