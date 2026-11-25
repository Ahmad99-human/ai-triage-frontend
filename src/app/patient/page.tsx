"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  Send,
  CheckCircle2,
  UploadCloud,
  FileText,
  MessageSquare,
  LogOut,
  Mic,
  MicOff,
  Volume2,
  Keyboard,
  Activity,
  AlertTriangle,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PatientAgentPage() {
  const [activeTab, setActiveTab] = useState<"intake" | "lab">("intake");
  const [token, setToken] = useState("T-104");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isUploadingLab, setIsUploadingLab] = useState(false);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [doctorDecision, setDoctorDecision] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVoiceOnlyMode, setIsVoiceOnlyMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(12);

  const [waitTime, setWaitTime] = useState(14);
  const [queuePos, setQueuePos] = useState(3);
  const [urgency, setUrgency] = useState("Evaluating...");
  const [suggestions, setSuggestions] = useState<string[]>([
    "Mujhe tez bukhar aur seene mein dard hai",
    "Kal raat se lagatar ho raha hai",
    "Dard bohot tez hai, 10 mein se 8",
  ]);

  const [summary, setSummary] = useState({
    type: "Awaiting input...",
    duration: "Awaiting input...",
    severity: "Awaiting input...",
  });

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Assalam-o-Alaikum! Welcome to Outpatient Triage. Please type or speak your symptoms, duration, and severity.",
    },
  ]);

  const recognitionRef = useRef<any>(null);

  const speakText = (text: string, autoListenAfter = true) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (autoListenAfter) startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition ke liye Google Chrome browser istemal karein.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ur-PK";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => handlePatientResponse(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handlePatientResponse = async (userText: string) => {
    if (!userText.trim() || isLoading) return;
    const updatedHistory = [...messages, { sender: "patient", text: userText }];
    setMessages(updatedHistory);
    setInput("");
    setIdleSecondsLeft(12);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: userText, history: updatedHistory }),
      });
      const data = await res.json();
      const aiReply = data.reply || "Shukriya, mazeed batayein?";
      setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);

      if (data.suggestions?.length) setSuggestions(data.suggestions);
      if (data.summary) {
        setSummary({
          type: data.summary.type || summary.type,
          duration: data.summary.duration || summary.duration,
          severity: data.summary.severity || summary.severity,
        });
      }
      if (data.triage) {
        setWaitTime(data.triage.wait_mins);
        setQueuePos(data.triage.queue_position);
        setUrgency(data.triage.urgency);
      }
      if (isVoiceOnlyMode) speakText(aiReply, true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Backend server se rabta nahi ho saka. Server connection check karein." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLab(true);
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
      alert("Lab OCR upload failed. Check backend connection.");
    } finally {
      setIsUploadingLab(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "lab") return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/patient/${token}`);
        const data = await res.json();
        if (data.decision) setDoctorDecision(data.decision);
        if (data.labResults?.length && labResults.length === 0) setLabResults(data.labResults);
      } catch {}
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [activeTab, token]);

  const activateVoiceMode = () => {
    setIsVoiceOnlyMode(true);
    const introPrompt =
      "Assalam-o-Alaikum! Main dekh raha hoon ke aapko likhne mein mushkil ho rahi hai. Maine Voice Mode on kar diya hai. Aap bas bol kar batayein, aapko aaj kya takleef ya alamaat hain?";
    setMessages((prev) => [...prev, { sender: "ai", text: introPrompt }]);
    speakText(introPrompt, true);
  };

  useEffect(() => {
    if (activeTab !== "intake" || isVoiceOnlyMode || input.trim().length > 0 || isLoading) return;
    const interval = setInterval(() => {
      setIdleSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          activateVoiceMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, isVoiceOnlyMode, input, isLoading]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white font-extrabold px-3 py-1 rounded-lg text-sm">
            Token: {token}
          </span>
          <h1 className="font-bold text-slate-900 text-lg">Patient Self-Service Portal</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("intake")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "intake"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" /> 1. Symptom Intake & Wait Time
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "lab"
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" /> 2. Lab OCR Report & Follow-Up
          </button>
          <Link
            href="/"
            className="ml-4 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-2"
          >
            <LogOut className="h-4 w-4" /> Exit
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {activeTab === "intake" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-blue-100">
                    ML Estimated Wait Time
                  </span>
                  <Clock className="h-5 w-5 text-blue-200" />
                </div>
                <div className="text-4xl font-extrabold mb-1">~{waitTime} Mins</div>
                <p className="text-xs text-blue-100 mb-4">
                  Queue Position: <strong>#{queuePos}</strong> (Gradient Boosting Prediction)
                </p>
                <div className="bg-white/15 p-3 rounded-xl text-xs flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-amber-300 shrink-0" />
                    Triage Urgency:
                  </span>
                  <strong className="bg-white/20 px-2 py-0.5 rounded">{urgency}</strong>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 mb-3">
                  Your Extracted Symptom Summary
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Symptom Type:</span>
                    <span className="font-bold text-slate-900 text-right">{summary.type}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900 text-right">{summary.duration}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Reported Severity:</span>
                    <span className="font-bold text-amber-600 text-right">{summary.severity}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[560px] overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="font-bold text-slate-900">AI Symptom Intake Assistant</h2>
                  {!isVoiceOnlyMode ? (
                    <p className="text-xs text-amber-700 font-semibold">
                      Auto-switching to Voice-Only Mode in {idleSecondsLeft}s if no typing detected...
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-700 font-semibold">
                      Hands-Free Voice Mode Active — AI is guiding the patient
                    </p>
                  )}
                </div>

                {!isVoiceOnlyMode ? (
                  <button
                    onClick={activateVoiceMode}
                    className="bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition"
                  >
                    <Mic className="h-4 w-4" /> Switch to Voice Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      window.speechSynthesis?.cancel();
                      stopListening();
                      setIsVoiceOnlyMode(false);
                      setIdleSecondsLeft(20);
                    }}
                    className="bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-300 transition"
                  >
                    <Keyboard className="h-4 w-4" /> Switch Back to Typing
                  </button>
                )}
              </div>

              {isVoiceOnlyMode ? (
                <div className="flex-1 bg-slate-900 text-white p-8 flex flex-col items-center justify-between text-center">
                  <div className="max-w-lg">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full mb-4">
                      AI Voice Triage Assistant
                    </span>
                    <h3 className="text-xl font-bold leading-relaxed text-white">
                      &ldquo;{messages[messages.length - 1]?.text}&rdquo;
                    </h3>
                  </div>

                  <div className="my-4 flex flex-col items-center">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`h-28 w-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                        isListening
                          ? "bg-red-500 animate-pulse ring-8 ring-red-500/30"
                          : isSpeaking
                          ? "bg-blue-600 ring-8 ring-blue-500/30"
                          : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {isSpeaking ? (
                        <Volume2 className="h-12 w-12 text-white animate-bounce" />
                      ) : (
                        <Mic className="h-12 w-12 text-white" />
                      )}
                    </button>
                    <p className="mt-4 text-sm font-semibold text-slate-300">
                      {isLoading
                        ? "AI alamaat samajh raha hai..."
                        : isSpeaking
                        ? "AI bol raha hai... (Please listen)"
                        : isListening
                        ? "Mic ON hai — Ab apni takleef bolein..."
                        : "Bolne ke liye Mic button dabayein"}
                    </p>
                  </div>

                  <div className="w-full border-t border-slate-800 pt-4">
                    <p className="text-xs text-slate-400 mb-2">
                      Quick Response Options (Click karein ya mic par bolein):
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handlePatientResponse(sug)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                          🎙️ &ldquo;{sug}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${m.sender === "patient" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-3 text-sm ${
                            m.sender === "patient"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-900 font-medium"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="text-xs text-slate-400 italic">
                        AI analyzing symptoms & calculating triage urgency...
                      </div>
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex gap-2 overflow-x-auto">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handlePatientResponse(sug)}
                          className="whitespace-nowrap bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-4 border-t border-slate-200 flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`p-3 rounded-xl font-semibold transition flex items-center justify-center ${
                        isListening
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <input
                      type="text"
                      placeholder="Apni alamaat likhein (ya 12 sec intezar karein Voice Mode ke liye)..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setIdleSecondsLeft(12);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handlePatientResponse(input)}
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                    />
                    <button
                      onClick={() => handlePatientResponse(input)}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upload Scanned Lab Report (OCR)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Apni lab test report image select karein taake OCR values extract karke Doctor Dashboard par bhej de.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  Patient Token Number
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
                onChange={handleLabFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-400 bg-purple-50/50 rounded-2xl p-8 text-center cursor-pointer hover:bg-purple-100/50 transition"
              >
                <UploadCloud className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">
                  {isUploadingLab
                    ? "Extracting Lab Values via OCR..."
                    : "Click to Select Lab Report Image (PNG / JPG)"}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  System will extract test values & flag abnormal ranges for your doctor.
                </p>
              </div>

              {labResults.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>OCR Complete & Sent to Doctor!</strong> Linked to Token <strong>{token}</strong>.
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-2.5">Test</th>
                          <th className="p-2.5">Value</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {labResults.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-medium">{r.test}</td>
                            <td className="p-2.5 font-bold">{r.value}</td>
                            <td className="p-2.5">
                              {r.status.includes("Abnormal") ? (
                                <span className="text-red-700 font-bold flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" /> {r.status}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">{r.status}</span>
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Doctor Prescription & Lab Follow-Up
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Jab doctor aapki lab report dekh kar dawa (prescription) update karenge, to woh yahan automatically show hogi.
                </p>

                {doctorDecision ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-emerald-200 pb-2">
                      <span className="text-slate-600">Confirmed Diagnosis:</span>
                      <span className="font-bold text-slate-900">{doctorDecision.diagnosis}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-200 pb-2">
                      <span className="text-slate-600">Treatment Action:</span>
                      <span className="font-bold text-emerald-800">{doctorDecision.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block mb-1">Prescription & Instructions:</span>
                      <p className="font-semibold text-slate-900 bg-white p-3 rounded-lg border border-emerald-200">
                        {doctorDecision.notes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Consultation Status:</span>
                      <span className="font-bold text-blue-800">Awaiting Doctor Review</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Post-Lab Prescription Decision:</span>
                      <span className="font-semibold text-slate-800">Pending Lab Review</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-6">
                Note: All diagnosis and prescription decisions are made strictly by your consulting physician.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}