"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, UserCheck, Stethoscope, Lock } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState("T-104");
  const [docPass, setDocPass] = useState("");
  const [error, setError] = useState("");

  const handlePatientStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    router.push(`/patient?token=${token}`);
  };

  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (docPass === "doctor123" || docPass === "admin") {
      router.push("/doctor");
    } else {
      setError("Invalid password! Demo ke liye 'doctor123' likhein.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-slate-900">MedTriage AI Hospital Portal</span>
        </div>
        <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
          Role-Based Access Control
        </span>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Patient Access Side */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Check-In</h2>
            <p className="text-sm text-slate-600 mb-6">
              Apna OPD Token number darj karein. Yahan se aap AI ko symptoms bata sakte hain, apna waiting time dekh sakte hain, aur Lab Report upload kar sakte hain.
            </p>
          </div>

          <form onSubmit={handlePatientStart} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Enter Your OPD Token Number
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. T-104"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base font-bold text-slate-900 bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Open My Patient Portal →
            </button>
          </form>
        </div>

        {/* Doctor Login Side */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-md flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Doctor Login</h2>
            <p className="text-sm text-slate-300 mb-6">
              Authorized Physicians only. Access patient queue, structured symptom summaries, AI triage urgency suggestions, and flagged OCR lab reports.
            </p>
          </div>

          <form onSubmit={handleDoctorLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Doctor Access Password (Demo: doctor123)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={docPass}
                  onChange={(e) => setDocPass(e.target.value)}
                  placeholder="Enter password (doctor123)"
                  className="w-full border border-slate-700 rounded-xl px-4 py-3 text-base font-bold text-slate-900 bg-white"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute right-4 top-4" />
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition"
            >
              Login to Doctor Dashboard →
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Disclaimer: AI outputs are decision-support suggestions only. All final diagnosis and prescription decisions remain with the licensed doctor.
      </footer>
    </div>
  );
}