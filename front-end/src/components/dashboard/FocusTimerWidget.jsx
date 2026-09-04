import { memo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
} from "@/components/icons";

const MODES = [
  { label: "Focus",       minutes: 25, color: "#1a3884" },
  { label: "Short Break", minutes: 5,  color: "#10b981" },
  { label: "Long Break",  minutes: 15, color: "#8b5cf6" },
];

const SOUNDS = [
  { id: "off",    label: "Silent", icon: "🔇" },
  { id: "lofi",   label: "Lo-Fi",  icon: "🎵" },
  { id: "rain",   label: "Rain",   icon: "🌧️" },
  { id: "forest", label: "Forest", icon: "🌲" },
];

// ── Web Audio generators (no external streams needed) ─────────────────────────
function makeAudio(type, ctx) {
  const master = ctx.createGain();
  master.gain.value = 1.0;
  master.connect(ctx.destination);
  const osc_list = [];
  let timer = null;

  if (type === "rain") {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * w) / 1.02;
      last = d[i];
      d[i] *= 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 150;
    const rg = ctx.createGain(); rg.gain.value = 2.5;
    src.connect(bp); bp.connect(hp); hp.connect(rg); rg.connect(master);
    src.start();
    osc_list.push(src);

  } else if (type === "forest") {
    // Pink noise base
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)/7; b6=w*0.115926;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
    const ng = ctx.createGain(); ng.gain.value = 1.8;
    src.connect(lp); lp.connect(ng); ng.connect(master); src.start(); osc_list.push(src);

    // Bird chirps
    const chirp = () => {
      if (ctx.state === "closed") return;
      const f = 1800 + Math.random() * 2000;
      const dur = 0.08 + Math.random() * 0.15;
      const o = ctx.createOscillator(); o.type = "sine";
      const now = ctx.currentTime;
      o.frequency.setValueAtTime(f, now);
      o.frequency.linearRampToValueAtTime(f * 1.4, now + dur * 0.5);
      o.frequency.linearRampToValueAtTime(f, now + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.4, now + dur * 0.3);
      g.gain.linearRampToValueAtTime(0, now + dur);
      o.connect(g); g.connect(master); o.start(now); o.stop(now + dur + 0.05);
      timer = setTimeout(chirp, 1200 + Math.random() * 3500);
    };
    chirp();

  } else if (type === "lofi") {
    // Drone pad
    [130.81, 196.00, 261.63].forEach(f => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.12;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
      o.connect(lp); lp.connect(g); g.connect(master); o.start(); osc_list.push(o);
    });

    // Melody
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const seq   = [0,2,4,5,3,1,4,2,0,3,5,2];
    let idx = 0;
    const note = () => {
      if (ctx.state === "closed") return;
      const freq = scale[seq[idx++ % seq.length]];
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
      const now = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.35, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
      o.connect(lp); lp.connect(g); g.connect(master); o.start(now); o.stop(now + 0.7);
      timer = setTimeout(note, 580 + Math.random() * 100);
    };
    note();
  }

  return {
    setVolume: (v) => { master.gain.value = v; },
    stop: () => {
      clearTimeout(timer);
      osc_list.forEach(o => { try { o.stop(); } catch(_) {} });
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
const FocusTimerWidget = memo(() => {
  const [modeIdx,  setModeIdx]  = useState(0);
  const [seconds,  setSeconds]  = useState(MODES[0].minutes * 60);
  const [running,  setRunning]  = useState(false);
  const [sound,    setSound]    = useState("off");
  const [muted,    setMuted]    = useState(false);
  const [sessions, setSessions] = useState(0);

  const intervalRef = useRef(null);
  const engineRef   = useRef(null);
  const ctxRef      = useRef(null);

  const mode        = MODES[modeIdx];
  const total       = mode.minutes * 60;
  const circleR     = 54;
  const circumference = 2 * Math.PI * circleR;
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const stopSound = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    if (ctxRef.current) { try { ctxRef.current.close(); } catch(_) {} }
    ctxRef.current = null;
  };

  const playSound = (id) => {
    stopSound();
    if (id === "off") return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      // Chrome requires explicit resume after user gesture
      if (ctx.state === "suspended") ctx.resume();
      const eng = makeAudio(id, ctx);
      eng.setVolume(muted ? 0 : 0.8);
      engineRef.current = eng;
    } catch (e) { console.warn("AudioContext error", e); }
  };

  // Sound select — independent of timer
  const handleSound = (id) => {
    setSound(id);
    id === "off" ? stopSound() : playSound(id);
  };

  // Mute
  useEffect(() => {
    if (engineRef.current) engineRef.current.setVolume(muted ? 0 : 0.8);
  }, [muted]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (modeIdx === 0) setSessions(n => n + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx]);

  // Cleanup
  useEffect(() => () => { stopSound(); clearInterval(intervalRef.current); }, []);

  const switchMode = (i) => { setRunning(false); setModeIdx(i); setSeconds(MODES[i].minutes * 60); };
  const reset = () => { setRunning(false); setSeconds(mode.minutes * 60); };
  const toggle = () => { if (seconds === 0) return reset(); setRunning(r => !r); };
  const progress = 1 - seconds / total;

  return (
    <div className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/20 shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-[#1a3884]/20">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#1a3884] dark:bg-blue-400 rounded-full" />
          <Timer className="w-3.5 h-3.5 text-[#0E2136] dark:text-blue-400" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">Focus Timer</span>
          {sessions > 0 && (
            <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-500/20">
              🔥 {sessions} session{sessions > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Mode tabs */}
        <div className="flex bg-slate-50 dark:bg-[#002A5C]/60 rounded-xl p-1 gap-1">
          {MODES.map((m, i) => (
            <button key={m.label} onClick={() => switchMode(i)}
              className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-200 ${
                modeIdx === i
                  ? "bg-white dark:bg-[#002147] shadow-sm text-[#1a3884] dark:text-blue-400 border border-slate-200 dark:border-[#1a3884]/30"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={circleR} fill="none" stroke="currentColor"
                strokeWidth="8" className="text-slate-100 dark:text-[#002A5C]" />
              <circle cx="64" cy="64" r={circleR} fill="none"
                stroke={mode.color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{ transition:"stroke-dashoffset 1s linear", filter:`drop-shadow(0 0 6px ${mode.color}55)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white tabular-nums" style={{letterSpacing:"-0.03em"}}>{fmt(seconds)}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">{mode.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={reset} className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-[#002A5C] border border-slate-200 dark:border-[#1a3884]/30 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={toggle}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{background:`linear-gradient(135deg,${mode.color}cc,${mode.color})`}}>
              {running ? <Pause className="w-6 h-6 text-white"/> : <Play className="w-6 h-6 text-white ml-0.5"/>}
            </motion.button>
            <button onClick={() => setMuted(m => !m)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-[#002A5C] border border-slate-200 dark:border-[#1a3884]/30 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 transition-all">
              {muted ? <VolumeX className="w-3.5 h-3.5"/> : <Volume2 className="w-3.5 h-3.5"/>}
            </button>
          </div>
        </div>

        {/* Ambient Sound */}
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
            <Music className="w-3 h-3"/> Ambient Sound
            {sound !== "off" && !muted && (
              <span className="ml-auto flex items-center gap-1 text-emerald-500 font-bold normal-case tracking-normal text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>Playing
              </span>
            )}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {SOUNDS.map(s => (
              <button key={s.id} onClick={() => handleSound(s.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all duration-200 active:scale-95 ${
                  sound === s.id
                    ? "bg-[#f0f4ff] dark:bg-[#1a3884]/25 border-[#1a3884]/40 shadow-sm scale-[1.03]"
                    : "bg-slate-50 dark:bg-[#002A5C]/40 border-slate-200 dark:border-[#1a3884]/15 hover:bg-slate-100 dark:hover:bg-[#002A5C] hover:scale-105"}`}>
                <span className="text-lg leading-none">{s.icon}</span>
                <span className={`text-[9px] font-bold mt-0.5 ${sound === s.id ? "text-[#1a3884] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>{s.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-2 text-center">Click any sound — plays instantly, no internet needed</p>
        </div>
      </div>
    </div>
  );
});

FocusTimerWidget.displayName = "FocusTimerWidget";
export default FocusTimerWidget;
