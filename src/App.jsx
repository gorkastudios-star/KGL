import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CalendarDays,
  CheckCircle2,
  VolumeX,
  Activity,
  HeartPulse,
  Flame,
  Wind,
  ShieldCheck,
  Zap
} from "lucide-react";

/**
 * Mini Kegel Coach (Mobile Pro Edition)
 * - Diseño "Mobile-First" con Bottom Action Bar.
 * - Scroll horizontal nativo para el calendario.
 * - Visualizador dinámico totalmente responsivo (SVG viewBox).
 */

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// --- 1. BASE DE DATOS DE EJERCICIOS CLÍNICOS ---
const KEGEL_LIBRARY = {
  warmup: { id: "warmup", name: "Conexión", desc: "Despierta el músculo suavemente", aLabel: "Contrae suave", bLabel: "Relaja", a: 3, b: 3 },
  flicks: { id: "flicks", name: "Pulsos Rápidos", desc: "Fibras rápidas (contra tos/estornudo)", aLabel: "Aprieta FUERTE", bLabel: "Suelta de golpe", a: 1, b: 2 },
  endurance5: { id: "endurance5", name: "Resistencia Media", desc: "Soporte de órganos", aLabel: "Contrae y mantén", bLabel: "Relaja profundo", a: 5, b: 5 },
  endurance10: { id: "endurance10", name: "Resistencia Larga", desc: "Fuerza profunda", aLabel: "Contrae y mantén", bLabel: "Relaja por completo", a: 10, b: 10 },
  elevator: { id: "elevator", name: "Ascensor", desc: "Control gradual", aLabel: "Sube poco a poco", bLabel: "Baja poco a poco", a: 5, b: 5 },
  cooldown: { id: "cooldown", name: "Relajación", desc: "Previene hipertonía pélvica", aLabel: "Tensión mínima", bLabel: "Expande al máximo", a: 2, b: 8 },
};

// --- 2. PLAN SEMANAL CLÍNICO ---
const WEEKLY_PROTOCOLS = [
  { day: "Lunes", title: "Fuerza Integral", icon: <ShieldCheck className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-400/10", seqs: ["warmup", "flicks", "endurance5", "endurance10", "cooldown"] },
  { day: "Martes", title: "Foco: Rápidas", icon: <Zap className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-400/10", seqs: ["warmup", "flicks", "flicks", "endurance5", "cooldown"] },
  { day: "Miércoles", title: "Foco: Resistencia", icon: <Activity className="w-5 h-5" />, color: "text-rose-400", bg: "bg-rose-400/10", seqs: ["warmup", "endurance5", "endurance10", "endurance10", "cooldown"] },
  { day: "Jueves", title: "Control y Ascensor", icon: <HeartPulse className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-400/10", seqs: ["warmup", "elevator", "elevator", "flicks", "cooldown"] },
  { day: "Viernes", title: "Fuerza Integral", icon: <ShieldCheck className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-400/10", seqs: ["warmup", "flicks", "endurance5", "endurance10", "cooldown"] },
  { day: "Sábado", title: "Foco: Relajación", icon: <Wind className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-400/10", seqs: ["warmup", "cooldown", "cooldown", "cooldown"] },
  { day: "Domingo", title: "Descanso Activo", icon: <Flame className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-400/10", seqs: ["warmup", "endurance5", "cooldown"] },
];

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTodayIndexLocal() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 1.0;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch { }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LS_DONE = "kegelPro_doneDays_mobile";

function loadDoneMap() {
  try { return JSON.parse(localStorage.getItem(LS_DONE)) || {}; }
  catch { return {}; }
}

function saveDoneMap(map) {
  try { localStorage.setItem(LS_DONE, JSON.stringify(map)); }
  catch { }
}

function buildStepsForSession(protocolKeys, restBetween = 7) {
  const steps = [];
  const ordered = protocolKeys.map(k => KEGEL_LIBRARY[k]);

  steps.push({ kind: "prep", label: "Postura cómoda", seconds: 5, seqIndex: -1, seqObj: null });

  ordered.forEach((seq, si) => {
    const cycleLength = seq.a + seq.b;
    const cycles = Math.floor(60 / cycleLength);

    for (let c = 0; c < cycles; c++) {
      steps.push({ kind: "A", label: seq.aLabel, seconds: seq.a, seqIndex: si, seqObj: seq });
      steps.push({ kind: "B", label: seq.bLabel, seconds: seq.b, seqIndex: si, seqObj: seq });
    }
    if (si < ordered.length - 1) {
      steps.push({ kind: "rest", label: "Respira normal", seconds: restBetween, seqIndex: si, seqObj: seq });
    }
  });

  steps.push({ kind: "done", label: "¡Completado!", seconds: 0, seqIndex: 99, seqObj: null });
  return { steps, ordered };
}

// --- VISUALIZADOR RESPONSIVO PARA MÓVIL ---
function PhaseVisualizer({ current, stepRemaining, running, totalPhaseSeconds }) {
  const isA = current.kind === 'A';
  const isB = current.kind === 'B';
  const isRest = current.kind === 'rest' || current.kind === 'prep';
  const isDone = current.kind === 'done';

  let circleClass = "scale-100 bg-zinc-800 shadow-none border-zinc-700";
  let textClass = "text-zinc-400";
  let ringColor = "stroke-zinc-800";

  if (running && isA) {
    circleClass = "scale-75 bg-rose-500/20 border-rose-500 shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)]";
    textClass = "text-rose-400";
    ringColor = "stroke-rose-500";
  } else if (running && isB) {
    circleClass = "scale-110 bg-emerald-500/10 border-emerald-400 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]";
    textClass = "text-emerald-400";
    ringColor = "stroke-emerald-500";
  } else if (running && isRest) {
    circleClass = "scale-100 bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_-10px_rgba(59,130,246,0.2)]";
    textClass = "text-blue-400";
    ringColor = "stroke-blue-500";
  }

  // SVG Responsive Logic
  const viewBoxSize = 300;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const progress = totalPhaseSeconds > 0 ? (stepRemaining / totalPhaseSeconds) : 0;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[320px] mx-auto py-4">

      <div className="relative flex items-center justify-center w-full aspect-square">
        {/* Anillo de progreso SVG (Responsive) */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <circle
            cx={viewBoxSize / 2} cy={viewBoxSize / 2} r={radius}
            className="stroke-zinc-800/80 fill-none"
            strokeWidth="8"
          />
          <circle
            cx={viewBoxSize / 2} cy={viewBoxSize / 2} r={radius}
            className={`${ringColor} fill-none transition-all duration-1000 ease-linear`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={running ? strokeDashoffset : circumference}
          />
        </svg>

        {/* Orbe dinámico central (Porcentual para mantener proporción) */}
        <div
          className="absolute w-[75%] h-[75%] rounded-full border-[3px] flex items-center justify-center backdrop-blur-md transition-all ease-in-out"
          style={{ transitionDuration: running && (isA || isB) ? `${totalPhaseSeconds}s` : '1s' }}
        >
          <div className={`w-full h-full rounded-full border-[1.5px] ${circleClass} transition-all ease-in-out`}
            style={{ transitionDuration: running && (isA || isB) ? `${totalPhaseSeconds}s` : '1s' }}
          ></div>
        </div>

        {/* Textos Centrales */}
        <div className="z-10 flex flex-col items-center text-center px-4 w-full">
          {isDone ? (
            <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-emerald-500 mb-2 drop-shadow-lg" />
          ) : (
            <div className="text-6xl sm:text-7xl font-light tracking-tighter text-zinc-100 tabular-nums drop-shadow-md">
              {stepRemaining}
            </div>
          )}
          <div className={`mt-1 text-base sm:text-lg font-medium tracking-wide transition-colors duration-500 drop-shadow-md px-4 leading-tight ${textClass}`}>
            {current.label || "Listo para empezar"}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const todayIdx = useMemo(() => getTodayIndexLocal(), []);
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [voiceOn, setVoiceOn] = useState(true);

  const activeProtocol = WEEKLY_PROTOCOLS[selectedDay];

  const { steps, ordered } = useMemo(
    () => buildStepsForSession(activeProtocol.seqs, 7),
    [activeProtocol]
  );

  const totalSeconds = useMemo(() => steps.reduce((acc, st) => acc + (st.seconds || 0), 0), [steps]);

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepRemaining, setStepRemaining] = useState(steps[0]?.seconds ?? 0);

  const doneMapRef = useRef(loadDoneMap());
  const [doneMap, setDoneMap] = useState(doneMapRef.current);

  const current = steps[stepIndex] || { label: "", seconds: 0, kind: "", seqIndex: -1, seqObj: null };

  const elapsed = useMemo(() => {
    let e = 0;
    for (let i = 0; i < stepIndex; i++) e += steps[i]?.seconds || 0;
    e += (steps[stepIndex]?.seconds || 0) - (stepRemaining || 0);
    return clamp(e, 0, totalSeconds);
  }, [stepIndex, stepRemaining, steps, totalSeconds]);

  const pct = totalSeconds > 0 ? Math.round((elapsed / totalSeconds) * 100) : 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setStepRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const cur = steps[stepIndex];
    if (!cur) return;

    if (cur.seconds === 0 && cur.kind === "done") {
      setRunning(false);
      const key = todayKey();
      const nextMap = { ...doneMapRef.current, [key]: true };
      doneMapRef.current = nextMap;
      saveDoneMap(nextMap);
      setDoneMap(nextMap);
      if (voiceOn) speak("Entrenamiento completado. Excelente trabajo.");
      return;
    }

    if (stepRemaining === 0) {
      const nextIndex = stepIndex + 1;
      const next = steps[nextIndex];
      if (!next) {
        setRunning(false);
        return;
      }
      setStepIndex(nextIndex);
      setStepRemaining(next.seconds ?? 0);

      if (voiceOn) {
        if (next.kind === "A") speak(next.seqObj?.id === "flicks" ? "Aprieta" : "Contrae");
        else if (next.kind === "B") speak("Relaja");
        else if (next.kind === "rest") speak("Descanso");
        else if (next.kind === "prep") speak("Prepárate");
      }
    }
  }, [running, stepRemaining, stepIndex, steps, voiceOn]);

  useEffect(() => {
    setRunning(false);
    setStepIndex(0);
    setStepRemaining(steps[0]?.seconds ?? 0);
  }, [steps]);

  const todayDone = !!doneMap[todayKey()];

  function toggleRun() {
    if (running) {
      setRunning(false);
      if (voiceOn) speak("Pausado");
      return;
    }
    if (current.kind === "done") {
      setStepIndex(0);
      setStepRemaining(steps[0]?.seconds ?? 0);
    }
    setRunning(true);
    if (voiceOn && stepRemaining === current.seconds) {
      if (current.kind === "prep") speak("Comenzamos. Postura cómoda.");
      else speak("Continuamos");
    }
  }

  function resetAll() {
    setRunning(false);
    setStepIndex(0);
    setStepRemaining(steps[0]?.seconds ?? 0);
  }

  // Prevenir selección de texto accidental en el móvil
  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0c] text-zinc-100 font-sans select-none pb-28">
      {/* Estilos para ocultar la barra de scroll en Chrome/Safari móvil */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-xl sm:py-8">

        {/* Cabecera Móvil */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              <Activity className="w-3 h-3" />
              Pro Protocol
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              Suelo Pélvico
            </h1>
          </div>
          <button
            onClick={() => setVoiceOn((v) => !v)}
            className={`p-3 rounded-full transition-all ${voiceOn ? "bg-zinc-800 text-zinc-200" : "bg-zinc-950 text-zinc-600 border border-zinc-800"
              }`}
            aria-label="Toggle Voice"
          >
            {voiceOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
        </header>

        {/* Info Rutina (Fuera del círculo para no estorbar en pantallas pequeñas) */}
        <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 mb-4">
          <div className="flex-1">
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${activeProtocol.color}`}>
              {activeProtocol.icon}
              {activeProtocol.title}
            </div>
            <div className="mt-1 text-zinc-300 text-sm font-medium line-clamp-1">
              {current.seqObj && current.kind !== "rest" && current.kind !== "done"
                ? `${current.seqIndex + 1}. ${current.seqObj.name}`
                : `${ordered.length} secuencias hoy`}
            </div>
          </div>
          <div className="text-right pl-4 border-l border-zinc-800">
            <div className="text-xl font-light tabular-nums tracking-tight">{formatTime(elapsed)}</div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">/ {formatTime(totalSeconds)}</div>
          </div>
        </div>

        {/* Zona del Visualizador */}
        <div className="relative mb-6">
          <PhaseVisualizer
            current={current}
            stepRemaining={stepRemaining}
            running={running}
            totalPhaseSeconds={current.seconds}
          />
        </div>

        {/* Calendario Semanal Móvil (Horizontal Scroll) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-3 px-1">
            <CalendarDays className="h-4 w-4" />
            Plan Semanal
          </div>
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4">
            {WEEKLY_PROTOCOLS.map((p, idx) => {
              const isToday = idx === todayIdx;
              const isSel = idx === selectedDay;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(idx)}
                  className={`relative flex-shrink-0 w-36 snap-center p-4 rounded-2xl text-left transition-all border ${isSel
                      ? "bg-zinc-800/80 border-zinc-600 shadow-md"
                      : "bg-zinc-900/30 border-zinc-800/60 opacity-80"
                    }`}
                >
                  {isToday && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                  <div className={`text-[10px] uppercase tracking-widest font-bold ${isSel ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {p.day}
                  </div>
                  <div className={`mt-2 w-8 h-8 rounded-full flex items-center justify-center ${p.bg} ${p.color}`}>
                    {p.icon}
                  </div>
                  <div className="mt-2 font-medium text-sm text-zinc-200 leading-tight">
                    {p.title.replace("Foco: ", "")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ruta del Día Seleccionado */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 mb-6">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Secuencias de hoy
          </div>
          <div className="flex flex-wrap gap-2">
            {activeProtocol.seqs.map((seqKey, i) => {
              const seq = KEGEL_LIBRARY[seqKey];
              const isActiveSeq = current.seqIndex === i && current.kind !== "done" && running;
              return (
                <div key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${isActiveSeq
                    ? "bg-zinc-200 text-zinc-900 border-zinc-200 font-bold"
                    : "bg-zinc-950/80 border-zinc-800 text-zinc-400"
                  }`}>
                  <span className="opacity-40">{i + 1}.</span> {seq.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips para Móvil (Listado apilado) */}
        <div className="space-y-3 mb-6">
          <div className="rounded-xl bg-zinc-900/20 border border-zinc-800/40 p-3.5 flex items-start gap-3">
            <div className="p-2 bg-amber-400/10 rounded-lg text-amber-400 mt-0.5"><ShieldCheck className="w-4 h-4" /></div>
            <div>
              <div className="text-zinc-200 font-medium text-sm">No aprietes el abdomen</div>
              <p className="text-xs text-zinc-500 mt-1">El movimiento es interno. Relaja glúteos y muslos.</p>
            </div>
          </div>
          <div className="rounded-xl bg-zinc-900/20 border border-zinc-800/40 p-3.5 flex items-start gap-3">
            <div className="p-2 bg-emerald-400/10 rounded-lg text-emerald-400 mt-0.5"><Wind className="w-4 h-4" /></div>
            <div>
              <div className="text-zinc-200 font-medium text-sm">Respira fluido</div>
              <p className="text-xs text-zinc-500 mt-1">Exhala al contraer. Inhala inflando el vientre al relajar.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Action Bar (Fijado al inferior, ideal para usar con el pulgar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/80 p-4 pb-safe flex items-center justify-between gap-3 z-50">

        {/* Barra de Progreso en el bottom bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-rose-500 to-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          onClick={resetAll}
          className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900 text-zinc-400 active:bg-zinc-800 transition-colors border border-zinc-800"
          aria-label="Reiniciar sesión"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        <button
          onClick={toggleRun}
          className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-full text-lg font-bold transition-all active:scale-95 ${running
              ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
              : "bg-zinc-100 text-zinc-950 shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            }`}
        >
          {running ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
          {running ? "Pausar" : current.kind === "done" ? "Repetir" : "Empezar"}
        </button>
      </div>

    </div>
  );
}
