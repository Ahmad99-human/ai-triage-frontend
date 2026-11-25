"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LabUploadPage() {
  const [token, setToken] = useState("T-104");
  const [isUploading, setIsUploading] = useState(false);
  const [labResults, setLabResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("token", token);
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ocr-lab`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.labResults) {
        setLabResults(data.labResults);
      }
    } catch {
      alert("Lab OCR upload failed. Check backend server connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const abnormalCount = labResults.filter((r) => r.status?.includes("Abnormal")).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Laboratory OCR Report Pipeline</h1>
            <p className="text-sm text-slate-500">
              Upload scanned lab reports to automatically extract test values, flag abnormal ranges, and route to the Doctor Dashboard.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Select Patient Token Number
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 bg-white"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-2xl p-10 text-center cursor-pointer hover:bg-purple-50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-purple-600 mx-auto mb-3 animate-spin" />
            ) : (
              <UploadCloud className="h-10 w-10 text-purple-600 mx-auto mb-3" />
            )}
            <p className="text-sm font-semibold text-slate-800">
              {isUploading
                ? "Processing Image & Extracting Lab Values via OCR..."
                : "Click to Upload Scanned Lab Report Image (PNG / JPG)"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Image preprocessing & OCR will automatically compare results against standard reference ranges.
            </p>
          </div>

          {labResults.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>OCR Processing Complete!</strong> Extracted {labResults.length} test values and{" "}
                  <strong>{abnormalCount} abnormal flag(s)</strong>, linked to patient record{" "}
                  <strong>{token}</strong>, and saved to the database.
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Extracted Value</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Flag / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {labResults.map((lab, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-slate-800">{lab.test}</td>
                        <td className="p-3 font-bold text-slate-900">{lab.value}</td>
                        <td className="p-3 text-slate-500">{lab.range}</td>
                        <td className="p-3">
                          {lab.status?.includes("Abnormal") ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                              <AlertTriangle className="h-3.5 w-3.5" /> {lab.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {lab.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}