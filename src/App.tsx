import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UploadsPage from "@/pages/Uploads";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/uploads" element={<UploadsPage />} />
        <Route path="/" element={<Navigate to="/uploads" replace />} />
        <Route path="*" element={<Navigate to="/uploads" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
