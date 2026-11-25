"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, FileWarning, ArrowLeft, Stethoscope, RefreshCw } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DoctorDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("T-104");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionAction, setPrescriptionAction] = useState("Modify Prescription");
  const [notes, setNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/queue`);
      const data = await res.json();
      if (data.patients && data.patients.length > 0) {
        setQueue(data.patients);
        if (!data.patients.some((p: any) => p.token === selectedToken)) {
          setSelectedToken(data.patients[0].token);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, 4000);
    return () => clearInterval(timer);
  }, []);

  const selectedPatient = queue.find((p) => p.token === selectedToken) || queue[0];

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      await fetch(`${API_BASE_URL}/api/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: selectedPatient.token,
          diagnosis,
          action: prescriptionAction,
          notes,
        }),
      });
      setSavedSuccess(true);
      fetchQueue();
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      alert("Error saving decision to backend.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Stethoscope className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Doctor Clinical Decision-Support Dashboard</h1>
              <p className="text-xs text-slate-500">Outpatient Department (OPD) — Live ML Triage & Lab OCR View</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
            </button>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-300">
              AI Outputs = Advisory Support Only | Doctor Retains Final Authority
            </span>
          </div>
        </div>

        {!selectedPatient ? (
          <div className="bg-white p-10 rounded-2xl text-center text-slate-500">
            Loading active OPD patient queue from FastAPI server (port 8000)...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Active Patient Queue ({queue.length})
              </h2>
              <div className="space-y-3">
                {queue.map((p) => (
                  <button
                    key={p.token}
                    onClick={() => setSelectedToken(p.token)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedPatient.token === p.token
                        ? "border-blue-600 bg-blue-50/60"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900">{p.token}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.urgency === "High Priority"
                            ? "bg-red-100 text-red-700"
                            : p.urgency === "Moderate"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {p.urgency}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">{p.name}, {p.age}y</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> Est. Wait: {p.waitEstimate}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">
                    Pre-Consultation Structured Symptoms ({selectedPatient.token})
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Patient Name:</span>
                      <span className="font-semibold">{selectedPatient.name} ({selectedPatient.age} yrs)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Extracted Symptoms:</span>
                      <span className="font-semibold text-slate-900 text-right">{selectedPatient.symptoms?.type}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-medium">{selectedPatient.symptoms?.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reported Severity:</span>
                      <span className="font-bold text-red-600">{selectedPatient.symptoms?.severity}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800">AI Triage Decision Support</h3>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Non-Final Recommendation
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 block mb-1">Suggested Urgency Level:</span>
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 font-bold text-sm px-3 py-1 rounded-lg">
                      <AlertTriangle className="h-4 w-4" /> {selectedPatient.urgency}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1.5">
                      Possible Related Conditions (Random Forest ML):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedPatient.candidateConditions || []).map((c: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    OCR Extracted Laboratory Findings & Reference Range Flags
                  </h3>
                  <span className="text-xs text-slate-500">Linked to Token {selectedPatient.token}</span>
                </div>
                {selectedPatient.labResults && selectedPatient.labResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                        <tr>
                          <th className="p-3">Test Name</th>
                          <th className="p-3">OCR Extracted Value</th>
                          <th className="p-3">Reference Range</th>
                          <th className="p-3">Flag / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPatient.labResults.map((lab: any, index: number) => (
                          <tr key={index}>
                            <td className="p-3 font-medium text-slate-800">{lab.test}</td>
                            <td className="p-3 font-bold text-slate-900">{lab.value}</td>
                            <td className="p-3 text-slate-500">{lab.range}</td>
                            <td className="p-3">
                              {lab.status.includes("Abnormal") && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                                  <AlertTriangle className="h-3.5 w-3.5" /> {lab.status}
                                </span>
                              )}
                              {lab.status === "Normal" && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                                  <CheckCircle className="h-3.5 w-3.5" /> Normal
                                </span>
                              )}
                              {lab.status.includes("Manual") && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                                  <FileWarning className="h-3.5 w-3.5" /> {lab.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No lab report uploaded by Token {selectedPatient.token} yet.
                  </p>
                )}
              </div>

              <form onSubmit={handleSaveDecision} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Doctor Final Clinical Decision & Prescription Action
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Final Confirmed Diagnosis *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter doctor's final diagnosis..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Post-Lab Treatment Decision *
                    </label>
                    <select
                      value={prescriptionAction}
                      onChange={(e) => setPrescriptionAction(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="Continue Current Prescription">Continue Current Prescription</option>
                      <option value="Modify Prescription">Modify Prescription (Based on Lab Report)</option>
                      <option value="Order Additional Lab Tests">Order Additional Lab Tests</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prescription & Clinical Notes *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Write medication dosage, changes, or follow-up instructions for patient..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Submitting this form updates the patient&apos;s follow-up portal and closes the loop.
                  </span>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700"
                  >
                    Approve & Send to Patient
                  </button>
                </div>
                {savedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                    Doctor decision recorded and routed to Token {selectedPatient.token} successfully!
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}