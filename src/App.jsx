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
  ShieldCheck,
  Flame,
  Smartphone
} from "lucide-react";

/**
 * Mini Kegel Coach - Master Session Edition
 * 10 fases exactas, basadas en el protocolo clínico avanzado.
 */

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// --- MOTOR DE SESIÓN MAESTRA ---
function buildMasterSession() {
  const steps = [];
  let seqIndex = 0;

  // Función helper para añadir pasos con su locución de voz específica
  const add = (kind, label, seconds, sName, voiceText = "") => {
    if (seconds >= 0) steps.push({ kind, label, seconds, seqIndex, seqName: sName, voiceText });
  };
  
  const rest = () => {
    add("rest", "Descanso", 6, "Descanso", "Descansa 6 segundos");
    seqIndex++;
  };

  // 0. PREPARACIÓN
  add("prep", "Postura cómoda", 5, "Preparación", "Preparando. Encuentra una postura cómoda.");

  // 1. ESCALERAS (32s)
  const n1 = "1. Escaleras Progresivas";
  add("A", "Tensión leve (1s)", 1, n1, "Sube");
  add("B", "Relaja (2s)", 2, n1, "Relaja");
  add("A", "Apretón moderado (3s)", 3, n1, "Sube moderado");
  add("B", "Relaja (2s)", 2, n1, "Relaja");
  add("A", "Mayor activación (5s)", 5, n1, "Sube más");
  add("B", "Relaja (2s)", 2, n1, "Relaja");
  add("A", "Apretón fuerte (6s)", 6, n1, "Fuerte");
  add("B", "Relaja (2s)", 2, n1, "Relaja");
  add("A", "Activación profunda (7s)", 7, n1, "Profundo y mantén");
  add("B", "Relaja (2s)", 2, n1, "Relaja");
  rest();

  // 2. ESCALERA LENTA (38s)
  const n2 = "2. Escalera Lenta";
  for(let i=0; i<2; i++) {
    add("A_25", "Contrae 25%", 3, n2, i===0 ? "Veinticinco por ciento" : "Veinticinco");
    add("A_50", "Contrae 50%", 3, n2, "Cincuenta");
    add("A_75", "Contrae 75%", 3, n2, "Setenta y cinco");
    add("A_100", "Contrae 100%", 3, n2, "Cien por ciento");
    add("B", "Relaja gradual", 3, n2, "Relaja despacio");
  }
  // Resto de los 38s (faltan 8s)
  add("A_25", "Contrae 25%", 3, n2, "Veinticinco");
  add("A_50", "Contrae 50%", 3, n2, "Cincuenta");
  add("A_75", "Contrae 75%", 2, n2, "Setenta y cinco");
  rest();

  // 3. PATADA (48s) - 6 ciclos
  const n3 = "3. Patada";
  for(let i=0; i<6; i++) {
    add("A_fast", "Tensión repentina", 1, n3, "Patada");
    add("B_fast", "Suelta rápido", 1, n3, "Suelta");
    add("A", "Contrae y mantiene", 3, n3, "Mantén");
    add("B", "Relaja", 3, n3, "Relaja");
  }
  rest();

  // 4. ESCALERA CORTA (32s) - 10 ciclos
  const n4 = "4. Escalera Corta";
  for(let i=0; i<10; i++) {
    add("A_50", "Contrae 50%", 1, n4, "Medio");
    add("A_100", "Contrae 100%", 1, n4, "Tope");
    add("B", "Relaja", 1, n4, "Baja");
  }
  add("A_50", "Contrae 50%", 1, n4, "Medio");
  add("A_100", "Contrae 100%", 1, n4, "Tope");
  rest();

  // 5. AGARRE LENTO (48s) - 6 ciclos
  const n5 = "5. Agarre Lento";
  for(let i=0; i<6; i++) {
    add("A", "Sube lentamente", 3, n5, "Sube lento");
    add("B", "Baja lentamente", 3, n5, "Baja lento");
    add("B_rest", "Descansa", 2, n5, "Descansa");
  }
  rest();

  // 6. MÁXIMAS ONDAS (40s) - 13 ciclos
  const n6 = "6. Máximas Ondas";
  for(let i=0; i<13; i++) {
    add("A_100", "Contrae al máximo", 2, n6, i===0 ? "Máximo" : "Sube");
    add("B", "Relaja", 1, n6, "Suelta");
  }
  add("A_100", "Contrae al máximo", 1, n6, "Sube");
  rest();

  // 7. AGARRE (52s) - 13 ciclos
  const n7 = "7. Agarre Constante";
  for(let i=0; i<13; i++) {
    add("A", "Elevación gradual", 3, n7, i===0 ? "Eleva suave" : "Eleva");
    add("B_fast", "Relaja rápido", 1, n7, "Suelta");
  }
  rest();

  // 8. AGARRE INVERTIDO (48s) - 12 ciclos
  const n8 = "8. Agarre Invertido";
  for(let i=0; i<12; i++) {
    add("A_fast", "Contrae rápido", 1, n8, "Fuerte");
    add("B", "Relaja gradual", 3, n8, "Baja suave");
  }
  rest();

  // 9. PARPADEO (34s) - 17 ciclos
  const n9 = "9. Parpadeo";
  for(let i=0; i<17; i++) {
    add("A_fast", "Contrae", 1, n9, i===0 ? "Pulso" : "");
    add("B_fast", "Suelta", 1, n9, "");
  }
  rest();

  // 10. APRETAR (30s)
  const n10 = "10. Apretar y Mantener";
  add("A_80", "Flexiona 70-80%", 30, n10, "Apreta y mantén firme treinta segundos. Respira.");

  add("done", "¡Sesión Completada!", 0, "Fin", "Sesión maestra completada. Eres increíble.");

  return steps;
}

const SESSION_PHASES = [
  { name: "Escaleras Progresivas", duration: 32 },
  { name: "Escalera Lenta", duration: 38 },
  { name: "Patada", duration: 48 },
  { name: "Escalera Corta", duration: 32 },
  { name: "Agarre Lento", duration: 48 },
  { name: "Máximas Ondas", duration: 40 },
  { name: "Agarre Constante", duration: 52 },
  { name: "Agarre Invertido", duration: 48 },
  { name: "Parpadeo", duration: 34 },
  { name: "Apretar y Mantener", duration: 30 }
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
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 1.1; 
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch {}
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LS_DONE = "kegelMaster_doneDays";

function loadDoneMap() {
  try { return JSON.parse(localStorage.getItem(LS_DONE)) || {}; } 
  catch { return {}; }
}

function saveDoneMap(map) {
  try { localStorage.setItem(LS_DONE, JSON.stringify(map)); } 
  catch {}
}

// --- VISUALIZADOR RESPONSIVO AVANZADO ---
function PhaseVisualizer({ current, stepRemaining, phaseRemaining, phaseTotalDuration, running }) {
  const isA = current.kind.startsWith('A');
  const isB = current.kind.startsWith('B');
  const isRest = current.kind === 'rest' || current.kind === 'prep';
  const isDone = current.kind === 'done';

  // Configuración de escalas progresivas
  let circleClass = "scale-100 bg-zinc-800 shadow-none border-zinc-700";
  let textClass = "text-zinc-400";
  let ringColor = "stroke-zinc-800";
  let animationDuration = current.seconds ? `${current.seconds}s` : '1s';

  if (running && isA) {
    let scale = "scale-[0.75]";
    if (current.kind === 'A_25') scale = "scale-[0.90]";
    else if (current.kind === 'A_50') scale = "scale-[0.80]";
    else if (current.kind === 'A_75' || current.kind === 'A_80') scale = "scale-[0.70]";
    else if (current.kind === 'A_100') scale = "scale-[0.60]";
    
    if (current.kind === 'A_fast') animationDuration = '0.3s'; 

    circleClass = `${scale} bg-rose-500/20 border-rose-500 shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)]`;
    textClass = "text-rose-400";
    ringColor = "stroke-rose-500";
  } else if (running && isB) {
    if (current.kind === 'B_fast') animationDuration = '0.3s';
    circleClass = "scale-[1.10] bg-emerald-500/10 border-emerald-400 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]";
    textClass = "text-emerald-400";
    ringColor = "stroke-emerald-500";
  } else if (running && isRest) {
    circleClass = "scale-100 bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_-10px_rgba(59,130,246,0.2)]";
    textClass = "text-blue-400";
    ringColor = "stroke-blue-500";
  }

  const viewBoxSize = 300;
  const radius = 135; 
  const circumference = 2 * Math.PI * radius;
  const progress = phaseTotalDuration > 0 ? (phaseRemaining / phaseTotalDuration) : 0;
  const strokeDashoffset = circumference - (progress * circumference);

  // Verificamos si la fase se acaba de recargar para anular la animación de "llenado"
  const isResetting = phaseRemaining === phaseTotalDuration;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[320px] mx-auto py-4">
      <div className="relative flex items-center justify-center w-full aspect-square">
        {/* Anillo de progreso */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <circle cx={viewBoxSize/2} cy={viewBoxSize/2} r={radius} className="stroke-zinc-800/80 fill-none" strokeWidth="8" />
          <circle
            cx={viewBoxSize/2} cy={viewBoxSize/2} r={radius}
            className={`${ringColor} fill-none ease-linear`}
            style={{ 
              transitionProperty: 'stroke-dashoffset, stroke',
              // Si acaba de recargar, corta la transición para que no se vea el "llenado inverso". Si no, transiciona fluido en 1s.
              transitionDuration: isResetting ? '0s' : '1s' 
            }}
            strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Orbe dinámico central */}
        <div 
          className="absolute w-[75%] h-[75%] rounded-full border-[3px] flex items-center justify-center backdrop-blur-md transition-all ease-out"
          style={{ transitionDuration: animationDuration }}
        >
          <div className={`w-full h-full rounded-full border-[1.5px] ${circleClass} transition-all ease-out`}
               style={{ transitionDuration: animationDuration }}
          ></div>
        </div>
        
        {/* Textos Centrales */}
        <div className="z-10 flex flex-col items-center text-center px-4 w-full">
          {isDone ? (
            <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-emerald-500 mb-2 drop-shadow-lg" />
          ) : (
            <div className="text-6xl sm:text-7xl font-light tracking-tighter text-zinc-100 tabular-nums drop-shadow-md">
              {phaseRemaining}
            </div>
          )}
          <div className={`mt-1 text-base sm:text-lg font-bold tracking-wide transition-colors duration-500 drop-shadow-md px-2 leading-tight ${textClass}`}>
            {current.label || "Listo para empezar"}
          </div>
          
          {/* Pequeña píldora con el tiempo */}
          {(isA || isB) && (
            <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 shadow-sm ${textClass}`}>
              Paso: {stepRemaining}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const todayIdx = useMemo(() => getTodayIndexLocal(), []);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true); // Estado para vibración

  const steps = useMemo(() => buildMasterSession(), []);
  const totalSeconds = useMemo(() => steps.reduce((acc, st) => acc + (st.seconds || 0), 0), [steps]);

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepRemaining, setStepRemaining] = useState(steps[0]?.seconds ?? 0);

  const doneMapRef = useRef(loadDoneMap());
  const [doneMap, setDoneMap] = useState(doneMapRef.current);

  const current = steps[stepIndex] || { label: "", seconds: 0, kind: "", seqIndex: -1, seqName: "", voiceText: "" };

  // Tiempo transcurrido total
  const elapsed = useMemo(() => {
    let e = 0;
    for (let i = 0; i < stepIndex; i++) e += steps[i]?.seconds || 0;
    e += (steps[stepIndex]?.seconds || 0) - (stepRemaining || 0);
    return clamp(e, 0, totalSeconds);
  }, [stepIndex, stepRemaining, steps, totalSeconds]);

  const pct = totalSeconds > 0 ? Math.round((elapsed / totalSeconds) * 100) : 0;

  // Duración total de la fase actual
  const phaseTotalDuration = useMemo(() => {
    if (!current || current.kind === "done") return 0;
    if (current.kind === "prep" || current.kind === "rest") return current.seconds;
    return steps.filter(s => s.seqIndex === current.seqIndex && s.kind !== "rest")
                .reduce((acc, s) => acc + s.seconds, 0);
  }, [current, steps]);

  // Tiempo restante de la fase
  const phaseRemaining = useMemo(() => {
    if (!current || current.kind === "done") return 0;
    if (current.kind === "prep" || current.kind === "rest") return stepRemaining;
    
    let remaining = stepRemaining || 0;
    for (let i = stepIndex + 1; i < steps.length; i++) {
      const st = steps[i];
      if (st.seqIndex !== current.seqIndex || st.kind === "rest") break;
      remaining += st.seconds || 0;
    }
    return remaining;
  }, [current, stepIndex, stepRemaining, steps]);

  // Función para disparar la vibración del teléfono
  const triggerHaptics = (kind) => {
    if (!hapticsOn || !("vibrate" in navigator)) return;
    try {
      if (kind.startsWith('A')) {
        navigator.vibrate(200); // Vibración fuerte al contraer
      } else if (kind.startsWith('B')) {
        navigator.vibrate(50);  // Vibración muy leve al relajar
      }
    } catch(e) { /* Silencia errores de la API */ }
  };

  // Cronómetro
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setStepRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Cambio de paso
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
      if (voiceOn) speak(cur.voiceText);
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

      // Disparar voz y vibración
      if (voiceOn && next.voiceText) {
        speak(next.voiceText);
      }
      triggerHaptics(next.kind);
    }
  }, [running, stepRemaining, stepIndex, steps, voiceOn, hapticsOn]);

  const todayDone = !!doneMap[todayKey()];

  function toggleRun() {
    if (running) {
      setRunning(false);
      if (voiceOn) speak("Pausa");
      return;
    }
    if (current.kind === "done") {
      setStepIndex(0);
      setStepRemaining(steps[0]?.seconds ?? 0);
    }
    setRunning(true);
    // Si acaba de empezar un nuevo bloque al quitar pausa, vibrar y hablar
    if (stepRemaining === current.seconds) {
      if (voiceOn && current.voiceText) speak(current.voiceText);
      triggerHaptics(current.kind);
    }
  }

  function resetAll() {
    setRunning(false);
    setStepIndex(0);
    setStepRemaining(steps[0]?.seconds ?? 0);
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0c] text-zinc-100 font-sans select-none pb-28">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-md px-4 py-6 sm:max-w-xl sm:py-8">
        
        {/* Cabecera */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">
              <Flame className="w-3 h-3" />
              Sesión Maestra
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              Kegel Pro
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHapticsOn((v) => !v)}
              className={`p-3 rounded-full transition-all ${
                hapticsOn ? "bg-zinc-800 text-zinc-200" : "bg-zinc-950 text-zinc-600 border border-zinc-800"
              }`}
              title="Vibración"
            >
              <Smartphone className={`h-6 w-6 ${!hapticsOn && "opacity-50"}`} />
            </button>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              className={`p-3 rounded-full transition-all ${
                voiceOn ? "bg-zinc-800 text-zinc-200" : "bg-zinc-950 text-zinc-600 border border-zinc-800"
              }`}
              title="Voz de asistencia"
            >
              {voiceOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Info Fase */}
        <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex-1">
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400`}>
              <Activity className="w-4 h-4" />
              10 Fases Pro
            </div>
            <div className="mt-1 text-zinc-200 text-sm font-semibold line-clamp-1">
              {current.seqName || "Sesión Completa"}
            </div>
          </div>
          <div className="text-right pl-4 border-l border-zinc-800">
             <div className="text-2xl font-light tabular-nums tracking-tight text-white">{formatTime(elapsed)}</div>
             <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">/ {formatTime(totalSeconds)}</div>
          </div>
        </div>

        {/* Visualizador Dinámico */}
        <div className="relative mb-8">
          <PhaseVisualizer 
            current={current} 
            stepRemaining={stepRemaining} 
            phaseRemaining={phaseRemaining}
            phaseTotalDuration={phaseTotalDuration}
            running={running} 
          />
        </div>

        {/* Tu semana */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-semibold text-zinc-300 mb-3 px-1">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Tu semana</span>
            <span className="text-xs text-zinc-500 font-normal">Sigue tu racha</span>
          </div>
          <div className="flex justify-between bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/60">
            {DAY_NAMES.map((day, idx) => {
              const d = new Date();
              const diff = idx - todayIdx;
              d.setDate(d.getDate() + diff);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const isCompleted = !!doneMap[key];
              const isToday = idx === todayIdx;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className={`text-[10px] font-bold ${isToday ? 'text-rose-400' : 'text-zinc-500'}`}>
                    {day.slice(0, 1)}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                    isToday ? 'bg-zinc-800 border border-zinc-600 text-zinc-300' : 'bg-zinc-950 border border-zinc-800 text-zinc-700'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{d.getDate()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estructura de la sesión */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
            <ShieldCheck className="w-4 h-4" />
            Estructura de la sesión
          </div>
          <div className="space-y-2">
            {SESSION_PHASES.map((phase, i) => {
              const isActive = current.seqIndex === i && running;
              const isPast = current.seqIndex > i;

              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  isActive ? "bg-zinc-200 text-zinc-900 shadow-md scale-[1.02]" : 
                  isPast ? "opacity-40 bg-zinc-950/50 text-zinc-500" : "bg-zinc-950/80 border border-zinc-800/60 text-zinc-300"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>{i + 1}.</span>
                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{phase.name}</span>
                  </div>
                  <div className={`text-xs font-mono ${isActive ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {formatTime(phase.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 p-4 pb-safe flex items-center justify-between gap-3 z-50">
        
        {/* Barra de progreso */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500"}`}
            style={{ width: `${pct}%` }} 
          />
        </div>

        <button
          onClick={resetAll}
          className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900 text-zinc-400 active:bg-zinc-800 transition-colors border border-zinc-800"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        <button
          onClick={toggleRun}
          className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-full text-lg font-bold transition-all active:scale-95 ${
            running 
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
