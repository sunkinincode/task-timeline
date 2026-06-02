import { useState, useEffect, useCallback, useRef } from "react";

// ─── TEAM COLOR CONFIG ────────────────────────────────────────────────────────
const TEAMS = {
  "สำนักแผนงานฯ":  { light:{pill:"#eef2ff",text:"#3730a3",border:"#a5b4fc",node:"#4f46e5",line:"#4f46e5"},
                     dark: {pill:"#1e1b4b",text:"#a5b4fc",border:"#4338ca",node:"#818cf8",line:"#818cf8"}},
  "สำนักกลยุทธ์ฯ": { light:{pill:"#fff7ed",text:"#c2410c",border:"#fdba74",node:"#f97316",line:"#f97316"},
                     dark: {pill:"#431407",text:"#fed7aa",border:"#c2410c",node:"#fb923c",line:"#fb923c"}},
  "สำนักสื่อสารฯ":  { light:{pill:"#f0fdf4",text:"#15803d",border:"#86efac",node:"#22c55e",line:"#22c55e"},
                     dark: {pill:"#052e16",text:"#86efac",border:"#16a34a",node:"#4ade80",line:"#4ade80"}},
  "สำนักประธาน":    { light:{pill:"#faf5ff",text:"#6d28d9",border:"#c4b5fd",node:"#7c3aed",line:"#7c3aed"},
                     dark: {pill:"#2e1065",text:"#c4b5fd",border:"#7c3aed",node:"#a78bfa",line:"#a78bfa"}},
  "CYC Yala City":  { light:{pill:"#fff1f2",text:"#be123c",border:"#fda4af",node:"#f43f5e",line:"#f43f5e"},
                     dark: {pill:"#4c0519",text:"#fda4af",border:"#e11d48",node:"#fb7185",line:"#fb7185"}},
  "ทุกสำนัก":       { light:{pill:"#ecfeff",text:"#0e7490",border:"#67e8f9",node:"#06b6d4",line:"#06b6d4"},
                     dark: {pill:"#083344",text:"#67e8f9",border:"#0891b2",node:"#22d3ee",line:"#22d3ee"}},
};

const TEAM_FULL = {
  "สำนักแผนงานฯ":  "สำนักแผนงานและงบประมาณ",
  "สำนักกลยุทธ์ฯ": "สำนักกลยุทธ์และกิจกรรม",
  "สำนักสื่อสารฯ":  "สำนักสื่อสารและภาพลักษณ์องค์กร",
  "สำนักประธาน":    "สำนักประธาน",
  "CYC Yala City":  "CYC Yala City",
  "ทุกสำนัก":       "ทุกสำนัก",
};

const MONTH_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const parseDate = d => new Date(d);

const fmtShort = d => {
  const dt = parseDate(d);
  return `${dt.getDate()} ${MONTH_TH[dt.getMonth()]}`;
};

const fmtRange = (start, end) => {
  if (!end || start === end) return fmtShort(start);
  const s = parseDate(start), e = parseDate(end);
  if (s.getMonth() === e.getMonth())
    return `${s.getDate()}–${e.getDate()} ${MONTH_TH[e.getMonth()]}`;
  return `${fmtShort(start)} – ${fmtShort(end)}`;
};

const fmtTime = ds => {
  if (!ds || !String(ds).includes("T")) return null; // date-only ISO → no time
  const d = new Date(ds);
  if (isNaN(d.getTime())) return null;
  const h = d.getHours(), m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return `${h}:${String(m).padStart(2, "0")}`;
};

const teamColor = (team, isDark) => (TEAMS[team] || TEAMS["ทุกสำนัก"])[isDark ? "dark" : "light"];

// ─── ANIMATED SVG ICONS ───────────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes ic-spin  { to{transform:rotate(360deg)} }
  @keyframes ic-pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
  @keyframes ic-rays  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ic-slideR{ 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }
  @keyframes ic-slideL{ 0%,100%{transform:translateX(0)} 50%{transform:translateX(-2px)} }
`;
const SS = { display:"inline-block", verticalAlign:"middle" };

const IcSpinner  = ({ s=24, c="#6366f1" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{display:"block",margin:"0 auto"}}>
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2.5" strokeOpacity="0.18"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke={c} strokeWidth="2.5" strokeLinecap="round"
      style={{animation:"ic-spin .8s linear infinite",transformOrigin:"12px 12px"}}/>
  </svg>
);
const IcWarning  = ({ s=40 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{display:"block",margin:"0 auto"}}>
    <path d="M12 2.5 2 21.5h20L12 2.5z" stroke="#ef4444" strokeWidth="1.8"
      strokeLinejoin="round" fill="#ef444420"
      style={{animation:"ic-pulse 1.8s ease-in-out infinite"}}/>
    <rect x="11" y="9" width="2" height="6" rx="1" fill="#ef4444"/>
    <circle cx="12" cy="18" r="1.1" fill="#ef4444"/>
  </svg>
);
const IcClipboard = ({ s=15, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={SS}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
  </svg>
);
const IcRefresh  = ({ s=14, c="currentColor", spin=false }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={SS}>
    <g style={spin ? {animation:"ic-spin .7s linear infinite",transformOrigin:"12px 12px"} : {}}>
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </g>
  </svg>
);
const IcMoon     = ({ s=14, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" style={SS}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      style={{animation:"ic-pulse 3s ease-in-out infinite"}}/>
  </svg>
);
const IcSun      = ({ s=14, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" style={SS}>
    <circle cx="12" cy="12" r="4"/>
    <g style={{animation:"ic-rays 8s linear infinite",transformOrigin:"12px 12px"}}>
      {[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;
        return <line key={a} x1={(12+7*Math.sin(r)).toFixed(1)} y1={(12-7*Math.cos(r)).toFixed(1)}
          x2={(12+9.5*Math.sin(r)).toFixed(1)} y2={(12-9.5*Math.cos(r)).toFixed(1)}/>;
      })}
    </g>
  </svg>
);
const IcClock    = ({ s=12, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" style={SS}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcCalendar = ({ s=12, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={SS}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcBuilding = ({ s=12, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={SS}>
    <path d="M2 22V3h14v19"/><path d="M16 8h4v14"/>
    <path d="M6 9h2"/><path d="M6 13h2"/><path d="M6 17h2"/>
    <path d="M10 9h2"/><path d="M10 13h2"/><path d="M10 17h2"/>
  </svg>
);
const IcFolder   = ({ s=12, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={SS}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcCheck    = ({ s=12, c="currentColor", done=false }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" style={SS}>
    {done ? <><circle cx="12" cy="12" r="10" fill={c} fillOpacity="0.15"/>
      <polyline points="8 12 11 15 16 9"/></> : <circle cx="12" cy="12" r="10"/>}
  </svg>
);
const IcArrowR   = ({ s=11, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{...SS, animation:"ic-slideR 1.2s ease-in-out infinite"}}>
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcArrowL   = ({ s=11, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{...SS, animation:"ic-slideL 1.2s ease-in-out infinite"}}>
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IcClose    = ({ s=16, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"
    strokeLinecap="round" style={SS}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcMouse    = ({ s=12, c="currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"
    strokeLinecap="round" style={SS}>
    <rect x="7" y="2" width="10" height="18" rx="5"/>
    <line x1="12" y1="7" x2="12" y2="10"/>
  </svg>
);

// ─── LAYOUT CONSTANTS (non-responsive) ───────────────────────────────────────
const SIDEBAR = 130;   // left sidebar width
const ROW     = 54;
const HEAD    = 76;
const LPAD    = 20;
const BAR_H   = 28;

export default function App() {
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dark,        setDark]        = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [hovered,     setHovered]     = useState(null);
  const [filterTeam,  setFilterTeam]  = useState(null);

  // ── responsive width ────────────────────────────────────────────
  const [winW, setWinW] = useState(document.documentElement.clientWidth);
  useEffect(() => {
    const h = () => setWinW(document.documentElement.clientWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const W     = winW - 16;
  const CHART = W - SIDEBAR;

  // ── data fetching ──────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res  = await fetch(import.meta.env.VITE_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setTasks(json.tasks ?? []);
      setLastUpdated(json.updatedAt);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, 60_000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  // ── zoom tracking ──────────────────────────────────────────────
  const baseDprRef = useRef(null);
  const [zoomFactor, setZoomFactor] = useState(1);
  useEffect(() => {
    baseDprRef.current = window.devicePixelRatio || 1;
    const h = () => setZoomFactor((window.devicePixelRatio || 1) / (baseDprRef.current || 1));
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── theme — light/soft modern + CI accent ─────────────────────
  const T = dark
    ? { bg:"#0f172a", surface:"#1e293b", border:"#334155", text:"#f1f5f9",
        sub:"#94a3b8", divider:"#1e293b", header:"#1e293b",
        rowEven:"#111827", rowOdd:"#0f172a", weekBand:"#1a2035",
        sidebar:"#141e2e", monthLabel:"#818cf8",
        hdrBg:"linear-gradient(135deg,#0e2a6e 0%,#1e293b 100%)" }
    : { bg:"#f8f9fb", surface:"#ffffff", border:"#e4e7ec", text:"#111827",
        sub:"#6b7280", divider:"#f3f4f6", header:"#ffffff",
        rowEven:"#f8f9fb", rowOdd:"#ffffff", weekBand:"#eef2ff",
        sidebar:"#f3f4f6", monthLabel:"#1d4ed8",
        hdrBg:"linear-gradient(135deg,#0e2a6e 0%,#1a3a8f 50%,#b45309 100%)" };

  // ── highlight ──────────────────────────────────────────────────
  const active = selected || hovered;
  const hlSet  = new Set();
  if (active) {
    hlSet.add(active.id);
    (active.blocks    || []).forEach(id => hlSet.add(id));
    (active.blockedBy || []).forEach(id => hlSet.add(id));
  }
  const isDimmed = id => hlSet.size > 0 && !hlSet.has(id);
  const isLit    = (a, b) => hlSet.has(a) && hlSet.has(b);

  // ── layout ─────────────────────────────────────────────────────
  const projects  = [...new Set(tasks.map(t => t.project))].filter(Boolean);
  const allFlat   = projects.flatMap(p => tasks.filter(t => t.project === p));
  const flatTasks = filterTeam ? allFlat.filter(t => t.team === filterTeam) : allFlat;
  const idxMap    = {};
  flatTasks.forEach((t, i) => { idxMap[t.id] = i; });
  const SVG_H = HEAD + flatTasks.length * ROW + 32;

  const allDates = flatTasks.flatMap(t => [
    parseDate(t.start || t.date),
    parseDate(t.end   || t.date),
  ]);
  const minD  = allDates.length ? new Date(Math.min(...allDates) - 2 * 86400000) : new Date();
  const maxD  = allDates.length ? new Date(Math.max(...allDates) + 3 * 86400000) : new Date(Date.now() + 30 * 86400000);
  const span  = maxD - minD || 1;
  const dayPx = (CHART - LPAD * 2) * 86400000 / span;

  const getX = d => SIDEBAR + LPAD + ((parseDate(d) - minD) / span) * (CHART - LPAD * 2);
  const getY = i => HEAD + i * ROW + ROW / 2;

  // precompute bar bounds
  const barMap = {};
  flatTasks.forEach(task => {
    const sd  = task.start || task.date;
    const ed  = task.end   || task.date;
    const bx1 = getX(sd);
    const bx2 = Math.max(getX(ed), bx1 + Math.max(dayPx * 1.5, 14));
    barMap[task.id] = { bx1, bx2, by: getY(idxMap[task.id]) };
  });

  // ticks
  const ticks = [];
  { const c = new Date(minD); while (c <= maxD) { ticks.push(new Date(c)); c.setDate(c.getDate() + 1); } }

  // adaptive tick density — based on pixel-per-day × zoom
  const effectiveDayPx = dayPx * Math.max(zoomFactor, 1);
  const tickStep = effectiveDayPx >= 30 ? 1 :
                   effectiveDayPx >= 15 ? 2 :
                   effectiveDayPx >= 8  ? 5 : 7;

  const monthMarkers = [];
  ticks.forEach((tick, i) => {
    if (tick.getDate() === 1 || i === 0) {
      monthMarkers.push({
        x: getX(tick),
        label: `${MONTH_TH[tick.getMonth()]} ${String(tick.getFullYear() + 543).slice(-2)}`,
      });
    }
  });

  // ── loading / error ────────────────────────────────────────────
  if (loading) return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'IBM Plex Sans Thai',sans-serif" }}>
      <style>{ANIM_CSS}</style>
      <div style={{ textAlign:"center", color:T.sub }}>
        <IcSpinner s={48} c="#6366f1"/>
        <div style={{ fontSize:14, marginTop:16 }}>กำลังโหลดข้อมูลจาก Notion...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'IBM Plex Sans Thai',sans-serif" }}>
      <style>{ANIM_CSS}</style>
      <div style={{ textAlign:"center" }}>
        <IcWarning s={48}/>
        <div style={{ fontSize:13, color:"#ef4444", margin:"12px 0" }}>{error}</div>
        <button onClick={fetchTasks} style={{ padding:"8px 20px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>
          ลองใหม่
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily:"'IBM Plex Sans Thai',sans-serif", background:T.bg,
      minHeight:"100vh", transition:"background .25s,color .25s",
      paddingBottom: selected ? 280 : 0,
    }}>
      <style>{ANIM_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* ── TOP HEADER ──────────────────────────────────────────── */}
      <div style={{
        background: T.hdrBg,
        padding:"13px 20px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:10,
        position:"sticky", top:0, zIndex:20,
        boxShadow: dark ? "0 2px 20px #00000080" : "0 4px 24px #4f46e540",
      }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:8, letterSpacing:"-0.2px" }}>
            <IcClipboard s={16} c="#fff"/> Task Timeline · ประธานสภาเด็กฯ ยะลา
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>
            {lastUpdated ? `อัพเดต ${new Date(lastUpdated).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}` : "—"}
            {" · "}{flatTasks.length} tasks
          </div>
        </div>

        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {Object.entries(TEAMS).filter(([k]) => tasks.some(t => t.team === k)).map(([k, v]) => {
            const c       = dark ? v.dark : v.light;
            const isActive = filterTeam === k;
            const isDim    = filterTeam && !isActive;
            const count    = tasks.filter(t => t.team === k).length;
            return (
              <div key={k}
                onClick={() => { setFilterTeam(f => f === k ? null : k); setSelected(null); }}
                title={`${TEAM_FULL[k] || k} (${count} tasks) — คลิกเพื่อกรอง`}
                style={{
                  display:"flex", alignItems:"center", gap:5,
                  background: isActive ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)",
                  border:`1.5px solid ${isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)"}`,
                  borderRadius:20, padding:"4px 12px",
                  cursor:"pointer", userSelect:"none",
                  opacity: isDim ? 0.35 : 1,
                  transition:"all .15s",
                  backdropFilter:"blur(8px)",
                }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: isActive ? "#fff" : c.node,
                  boxShadow: isActive ? `0 0 6px ${c.node}` : "none" }}/>
                <span style={{ fontSize:10, fontWeight:600, color:"#fff", whiteSpace:"nowrap", letterSpacing:"0.02em" }}>
                  {k}{isActive && <span style={{ marginLeft:5, opacity:.7 }}>✕</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={fetchTasks} style={{
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)",
            borderRadius:10, padding:"7px 14px", cursor:"pointer", fontSize:12, color:"#fff",
            display:"flex", alignItems:"center", gap:6, fontFamily:"inherit",
            transition:"background .15s",
          }}>
            <IcRefresh s={13} c="#fff"/> Refresh
          </button>
          <button onClick={() => setDark(d => !d)} style={{
            background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)",
            borderRadius:20, padding:"7px 16px", cursor:"pointer", fontSize:12,
            fontWeight:600, color:"#fff", display:"flex", alignItems:"center", gap:6,
            fontFamily:"inherit", transition:"background .15s",
          }}>
            {dark ? <><IcSun s={14} c="#fff"/> Light</> : <><IcMoon s={14} c="#fff"/> Dark</>}
          </button>
        </div>
      </div>

      {/* ── SVG TIMELINE ──────────────────────────────────────────── */}
      <div style={{ overflow:"hidden", padding:"8px 8px 0" }}>
        <svg width={W} height={SVG_H} style={{ display:"block", fontFamily:"'IBM Plex Sans Thai',sans-serif" }}>
          <defs>
            {/* CI header gradient — navy → blue → gold */}
            <linearGradient id="hdr-grad" x1={0} y1={0} x2={W} y2={0} gradientUnits="userSpaceOnUse">
              {dark ? (<>
                <stop offset="0%"   stopColor="#050a14"/>
                <stop offset="100%" stopColor="#0e1a3a"/>
              </>) : (<>
                <stop offset="0%"   stopColor="#0e2a6e"/>
                <stop offset="52%"  stopColor="#1a3a8f"/>
                <stop offset="100%" stopColor="#b45309"/>
              </>)}
            </linearGradient>
            {/* sidebar gradient */}
            <linearGradient id="sb-grad" x1={0} y1={0} x2={0} y2={SVG_H} gradientUnits="userSpaceOnUse">
              {dark ? (<>
                <stop offset="0%"   stopColor="#141e2e"/>
                <stop offset="100%" stopColor="#0f172a"/>
              </>) : (<>
                <stop offset="0%"   stopColor="#f3f4f6"/>
                <stop offset="100%" stopColor="#eef0f3"/>
              </>)}
            </linearGradient>
            {/* gold accent gradient for bars */}
            <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
            {/* bar shadow */}
            <filter id="bar-shadow" x="-4%" y="-25%" width="108%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2"
                floodColor={dark?"#000":"#0000002a"} floodOpacity="1"/>
            </filter>
            <marker id="arr-lit" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b"/>
            </marker>
            {Object.entries(TEAMS).map(([k, v]) => {
              const c = dark ? v.dark : v.light;
              return (
                <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill={c.node}/>
                </marker>
              );
            })}
          </defs>

          {/* ── GRID ── */}
          {ticks.map((tick, i) => {
            const x      = getX(tick);
            const isWknd = tick.getDay() === 0 || tick.getDay() === 6;
            const isFirst = tick.getDate() === 1;
            return (
              <g key={i}>
                {isWknd && (
                  <rect x={x - Math.max(dayPx/2, 6)} y={HEAD}
                    width={Math.max(dayPx, 12)} height={SVG_H - HEAD}
                    fill={T.weekBand} opacity={0.6}/>
                )}
                <line x1={x} y1={HEAD} x2={x} y2={SVG_H}
                  stroke={isFirst ? (dark?"#475569":"#cbd5e1") : T.divider}
                  strokeWidth={isFirst ? 1.5 : 0.5}/>
              </g>
            );
          })}

          {/* sidebar column background (drawn before rows so text stays on top) */}
          <rect x={0} y={HEAD} width={SIDEBAR} height={SVG_H - HEAD} fill={T.sidebar}/>

          {/* ── ROW backgrounds (chart area only) ── */}
          {flatTasks.map((task, i) => (
            <rect key={`row-${task.id}`}
              x={SIDEBAR} y={HEAD + i * ROW} width={CHART} height={ROW - 1}
              fill={i % 2 === 0 ? T.rowEven : T.rowOdd}
              opacity={isDimmed(task.id) ? 0.28 : 1}/>
          ))}

          {/* ── SIDEBAR content ── */}
          {flatTasks.map((task, i) => {
            const y   = HEAD + i * ROW;
            const col = teamColor(task.team, dark);
            const sel = selected?.id === task.id;
            const hov = hovered?.id  === task.id;
            const dim = isDimmed(task.id);

            const t1 = fmtTime(task.start || task.date);
            const t2 = fmtTime(task.end   || task.date);
            const timeLabel = t1 && t2 && t1 !== t2 ? `${t1}–${t2}` : t1;

            return (
              <g key={`sb-${task.id}`}
                opacity={dim ? 0.25 : 1}
                style={{ cursor:"pointer" }}
                onClick={() => setSelected(sel ? null : task)}
                onMouseEnter={() => setHovered(task)}
                onMouseLeave={() => setHovered(null)}
              >
                {(sel || hov) && (
                  <rect x={2} y={y + 2} width={SIDEBAR - 4} height={ROW - 4}
                    fill={col.pill} stroke={col.border} strokeWidth={1} rx={6}/>
                )}
                {/* color accent bar */}
                <rect x={4} y={y + 9} width={4} height={ROW - 18}
                  fill={col.node} rx={2}/>
                {/* time label */}
                <text x={15} y={y + ROW / 2 - 6}
                  dominantBaseline="middle" fontSize={12} fontWeight={700}
                  fontStyle={timeLabel ? "normal" : "italic"}
                  fill={sel ? col.text : (timeLabel ? col.node : T.sub)}>
                  {timeLabel || "ทั้งวัน"}
                </text>
                {/* short task name */}
                <text x={15} y={y + ROW / 2 + 9}
                  dominantBaseline="middle" fontSize={8.5}
                  fill={sel ? col.text : T.sub}>
                  {task.name.length > 14 ? task.name.slice(0, 12) + "…" : task.name}
                </text>
              </g>
            );
          })}

          {/* ── PROJECT separators ── */}
          {projects.map((proj, pi) => {
            const rows = tasks.filter(t => t.project === proj);
            if (!rows.length) return null;
            const y0   = HEAD + idxMap[rows[0].id] * ROW;
            const txts = [
              dark ? "#93c5fd" : "#1d4ed8",
              dark ? "#c084fc" : "#7c3aed",
              dark ? "#86efac" : "#15803d",
            ];
            return (
              <g key={proj}>
                {pi > 0 && (
                  <line x1={0} y1={y0} x2={W} y2={y0}
                    stroke={txts[pi % 3]} strokeWidth={1.5} opacity={0.35}/>
                )}
                <text x={SIDEBAR + 8} y={y0 + 11}
                  fontSize={9} fontWeight={700}
                  fill={txts[pi % 3]} opacity={0.6}
                  style={{ userSelect:"none" }}>
                  {proj}
                </text>
              </g>
            );
          })}

          {/* ── DEPENDENCY CURVES — visible only on hover/select ── */}
          {active && flatTasks.map(task => {
            if (!hlSet.has(task.id)) return null;
            const src = barMap[task.id];
            if (!src) return null;
            const col = teamColor(task.team, dark);
            return (task.blocks || []).map(bid => {
              const tgt = barMap[bid];
              if (!tgt) return null;
              const lit  = isLit(task.id, bid);
              const cp1x = src.bx2 + Math.max(20, (tgt.bx1 - src.bx2) * 0.4);
              const cp2x = tgt.bx1 - Math.max(20, (tgt.bx1 - src.bx2) * 0.4);
              return (
                <path key={`${task.id}->${bid}`}
                  d={`M ${src.bx2} ${src.by} C ${cp1x} ${src.by}, ${cp2x} ${tgt.by}, ${tgt.bx1} ${tgt.by}`}
                  stroke={lit ? "#f59e0b" : col.line}
                  strokeWidth={lit ? 2.5 : 2}
                  fill="none" opacity={lit ? 1 : 0.85}
                  markerEnd={lit ? "url(#arr-lit)" : `url(#arr-${task.team})`}
                />
              );
            });
          })}

          {/* ── GANTT BARS ── */}
          {flatTasks.map((task, i) => {
            const col = teamColor(task.team, dark);
            const sel = selected?.id === task.id;
            const hov = hovered?.id  === task.id;
            const dim = isDimmed(task.id);
            const bar = barMap[task.id];
            if (!bar) return null;

            const { bx1, bx2 } = bar;
            const bw  = bx2 - bx1;
            const barY = HEAD + i * ROW + Math.floor((ROW - BAR_H) / 2);
            const sd = task.start || task.date;
            const ed = task.end   || task.date;

            const t1 = fmtTime(sd);
            const t2 = fmtTime(ed);
            const timeLabel = t1 && t2 && t1 !== t2 ? `${t1}–${t2}` : t1;

            return (
              <g key={task.id}
                opacity={dim ? 0.22 : 1}
                style={{ cursor:"pointer", transition:"opacity .15s" }}
                onClick={() => setSelected(sel ? null : task)}
                onMouseEnter={() => setHovered(task)}
                onMouseLeave={() => setHovered(null)}
              >
                {(sel || hov) && (
                  <rect x={bx1 - 3} y={barY - 3} width={bw + 6} height={BAR_H + 6}
                    rx={7} fill="none"
                    stroke={col.node} strokeWidth={sel ? 2.5 : 1.5} opacity={0.5}/>
                )}
                <rect x={bx1} y={barY} width={bw} height={BAR_H}
                  rx={5}
                  fill={sel || hov ? col.node : col.pill}
                  stroke={col.node} strokeWidth={sel ? 2 : 1}
                  filter="url(#bar-shadow)"/>
                {task.done && (
                  <rect x={bx1} y={barY} width={bw} height={BAR_H}
                    rx={5} fill={col.node} opacity={0.22}/>
                )}
                {/* time label inside bar (only if wide enough) */}
                {timeLabel && bw > 45 && (
                  <text x={bx1 + 8} y={barY + BAR_H / 2 + 1}
                    dominantBaseline="middle" fontSize={10}
                    fontWeight={sel || hov ? 700 : 500}
                    fill={sel || hov ? "#fff" : col.text}
                    style={{ pointerEvents:"none" }}>
                    {timeLabel}
                  </text>
                )}
                {/* full task name — always shown outside/right of bar */}
                <text x={bx2 + 7} y={barY + BAR_H / 2 + 1}
                  dominantBaseline="middle" fontSize={10.5}
                  fontWeight={sel || hov ? 700 : 400}
                  fill={dark ? "#e2e8f0" : "#1e293b"}
                  style={{ pointerEvents:"none" }}>
                  {task.name}
                </text>
                {/* date badge above bar — with gap */}
                <text x={bx1} y={barY - 10}
                  fontSize={9} fontWeight={600}
                  fill={col.node} opacity={0.9}
                  style={{ pointerEvents:"none" }}>
                  {fmtRange(sd, ed !== sd ? ed : null)}
                </text>
                {/* team badge inside right (wide bars only) */}
                {bw > 100 && !timeLabel && (
                  <text x={bx2 - 7} y={barY + BAR_H - 7}
                    textAnchor="end" fontSize={8}
                    fill={sel || hov ? "#ffffff90" : col.text} opacity={0.5}
                    style={{ pointerEvents:"none" }}>
                    {task.team}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── HEADER overlay (drawn last so it's on top) ── */}
          {/* chart header — white for date readability */}
          <rect x={SIDEBAR} y={0} width={CHART} height={HEAD} fill={T.header}/>
          {/* sidebar header — same color as sidebar column */}
          <rect x={0} y={0} width={SIDEBAR} height={HEAD} fill={T.sidebar}/>
          {/* gold bottom border */}
          <line x1={0} y1={HEAD} x2={W} y2={HEAD}
            stroke={dark?"#334155":"#D4AF37"} strokeWidth={dark?1:2}/>
          {/* sidebar / chart divider */}
          <line x1={SIDEBAR} y1={0} x2={SIDEBAR} y2={SVG_H}
            stroke={dark?"#334155":"#D4AF37"} strokeWidth={1} opacity={0.5}/>

          {/* sidebar header — clock + label */}
          <circle cx={10} cy={HEAD/2} r={6.5} fill="none" stroke={T.sub} strokeWidth="1.5"/>
          <line x1={10} y1={HEAD/2-4} x2={10} y2={HEAD/2} stroke={T.sub} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1={10} y1={HEAD/2} x2={13} y2={HEAD/2+2} stroke={T.sub} strokeWidth="1.5" strokeLinecap="round"/>
          <text x={20} y={HEAD / 2 + 1} dominantBaseline="middle"
            fontSize={10} fontWeight={700} fill={T.sub}>
            เวลา / Task
          </text>

          {/* month labels */}
          {monthMarkers.map(({ x, label }, mi) => (
            <g key={label}>
              {mi > 0 && (
                <line x1={x} y1={34} x2={x} y2={HEAD}
                  stroke={dark?"#475569":"#c7d2fe"} strokeWidth={1} opacity={0.5}/>
              )}
              <text
                x={mi === 0 ? Math.max(x, SIDEBAR + 6) : x + 5}
                y={18}
                fontSize={13} fontWeight={700}
                fill={dark ? "#818cf8" : "#1d4ed8"} dominantBaseline="middle">
                {label}
              </text>
            </g>
          ))}

          {/* separator: month zone / day zone */}
          <line x1={SIDEBAR} y1={34} x2={W} y2={34}
            stroke={T.border} strokeWidth={0.5} opacity={0.6}/>

          {/* date labels — horizontal on desktop, italic-rotated on mobile/high-zoom */}
          {(() => {
            // rotate only on mobile (<768px) or browser zoom >125%
            const rotated = winW < 768 || zoomFactor > 1.25;
            const minGap  = rotated ? 20 : 38;
            const step    = rotated
              ? (dayPx >= 10 ? 3 : dayPx >= 5 ? 5 : dayPx >= 2 ? 7 : 14)
              : (effectiveDayPx >= 30 ? 1 : effectiveDayPx >= 15 ? 2 : effectiveDayPx >= 8 ? 5 : 7);
            let lastX = -Infinity;
            const vis = [];
            ticks.forEach((tick, i) => {
              const x = getX(tick);
              const d = tick.getDate();
              if (d !== 1 && d % step !== 0) return;
              if (x - lastX < minGap) return;
              vis.push({ tick, i, x, d });
              lastX = x;
            });
            return vis.map(({ tick, i, x, d }) => {
              const mo = MONTH_TH[tick.getMonth()];
              const isFirst = d === 1;
              if (rotated) {
                const ry = HEAD - 3;
                return (
                  <text key={i} x={x} y={ry}
                    textAnchor="end" fontSize={9} fontWeight={isFirst ? 700 : 500}
                    fontStyle="italic" dominantBaseline="auto"
                    fill={isFirst ? T.monthLabel : (dark ? "#cbd5e1" : "#475569")}
                    transform={`rotate(-48 ${x} ${ry})`}
                    style={{ pointerEvents:"none" }}>
                    {d} {mo}
                  </text>
                );
              }
              return (
                <g key={i}>
                  <text x={x} y={HEAD - 24} textAnchor="middle"
                    fontSize={12} fontWeight={700}
                    fill={dark ? "#e2e8f0" : "#1e293b"} dominantBaseline="middle">{d}</text>
                  <text x={x} y={HEAD - 10} textAnchor="middle"
                    fontSize={9} fontWeight={600}
                    fill={dark ? "#818cf8" : "#3b5bdb"} dominantBaseline="middle">{mo}</text>
                </g>
              );
            });
          })()}

          {/* today line */}
          {(() => {
            const today = new Date();
            if (today < minD || today > maxD) return null;
            const tx = getX(today);
            return (
              <g>
                <line x1={tx} y1={HEAD} x2={tx} y2={SVG_H}
                  stroke="#ef4444" strokeWidth={2} opacity={0.7}/>
                <rect x={tx - 14} y={HEAD - 18} width={28} height={16}
                  fill="#ef4444" rx={4}/>
                <text x={tx} y={HEAD - 10} textAnchor="middle"
                  fontSize={9} fontWeight={700} fill="#fff" dominantBaseline="middle">
                  วันนี้
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, padding:"10px 14px 14px", flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"Tasks ทั้งหมด", val:tasks.length,                                                               col:"#1a3a8f" },
          { label:"เสร็จแล้ว",     val:tasks.filter(t => t.done).length,                                           col:"#166534" },
          { label:"ยังไม่เริ่ม",   val:tasks.filter(t => !t.done).length,                                          col:"#b45309" },
          { label:"มี dependency", val:tasks.filter(t => (t.blocks?.length||0)+(t.blockedBy?.length||0)>0).length, col:"#D4AF37" },
        ].map(({ label, val, col }) => (
          <div key={label} style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderTop: `3px solid ${col}`,
            borderRadius: "0 0 10px 10px",
            padding: "8px 16px",
            display:"flex", flexDirection:"column", alignItems:"center", minWidth:80,
            boxShadow: dark ? "0 2px 8px #00000040" : `0 2px 12px ${col}18`,
          }}>
            <span style={{ fontSize:22, fontWeight:700, color:col, lineHeight:1 }}>{val}</span>
            <span style={{ fontSize:9.5, color:T.sub, marginTop:4, letterSpacing:"0.02em" }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft:"auto", fontSize:10.5, color:T.sub, textAlign:"right", lineHeight:2 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
            <IcMouse s={12} c={T.sub}/> hover/คลิก แถบเพื่อดู dependency
          </span><br/>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
            <svg width={10} height={10} viewBox="0 0 10 10" style={SS}>
              <rect width="10" height="10" rx="2" fill="#ef4444" opacity="0.8"/>
            </svg> เส้นแดง = วันนี้
            &nbsp;·&nbsp;
            <svg width={10} height={10} viewBox="0 0 10 10" style={SS}>
              <rect width="10" height="10" rx="2" fill={dark?"#1a2035":"#e8eeff"} stroke={T.border} strokeWidth="1"/>
            </svg> พื้นหลัง = วันหยุด
          </span>
        </div>
      </div>

      {/* ── DETAIL PANEL — fixed at bottom of viewport ────────────── */}
      {selected && (() => {
        const col   = teamColor(selected.team, dark);
        const blkBy = (selected.blockedBy || []).map(id => tasks.find(t => t.id === id)).filter(Boolean);
        const blks  = (selected.blocks    || []).map(id => tasks.find(t => t.id === id)).filter(Boolean);
        const t1    = fmtTime(selected.start || selected.date);
        const t2    = fmtTime(selected.end   || selected.date);
        const selTimeLabel = t1 && t2 && t1 !== t2 ? `${t1} – ${t2}` : t1;
        return (
          <div style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:300,
            background: dark ? T.surface : "#fff",
            borderTop: `3px solid ${col.border}`,
            borderRadius:"16px 16px 0 0",
            padding:"14px 20px 20px",
            maxHeight:"42vh", overflowY:"auto",
            boxShadow:"0 -8px 32px #00000025",
          }}>
            {/* drag handle */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:36, height:4, borderRadius:2, background:col.border, opacity:0.5 }}/>
                <span style={{ fontSize:9, color:col.text, fontWeight:700, letterSpacing:"0.1em", opacity:.5 }}>TASK DETAIL</span>
              </div>
              <button onClick={() => setSelected(null)} style={{
                background:"transparent", border:"none", cursor:"pointer",
                color:T.sub, lineHeight:1, padding:"0 4px", display:"flex",
              }}>
                <IcClose s={16} c={T.sub}/>
              </button>
            </div>

            <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
              {/* main info */}
              <div style={{ flex:"1 1 200px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:col.text, marginBottom:8, lineHeight:1.3 }}>
                  {selected.name}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {[
                    { ic: <IcCalendar s={11} c={col.text}/>, val: fmtRange(selected.start || selected.date, selected.end) },
                    selTimeLabel && { ic: <IcClock s={11} c={col.text}/>, val: selTimeLabel },
                    { ic: <IcBuilding s={11} c={col.text}/>, val: TEAM_FULL[selected.team] || selected.team },
                    { ic: <IcFolder s={11} c={col.text}/>, val: selected.project },
                    { ic: <IcCheck s={11} c={col.text} done={selected.done}/>, val: selected.done ? "เสร็จแล้ว" : selected.status || "Not started" },
                  ].filter(Boolean).map(({ ic, val }, idx) => (
                    <span key={idx} style={{
                      fontSize:10.5, padding:"3px 10px", borderRadius:20,
                      background: dark ? "#ffffff10" : col.pill,
                      color:col.text, border:`1px solid ${col.border}40`,
                      display:"inline-flex", alignItems:"center", gap:5,
                    }}>{ic} {val}</span>
                  ))}
                </div>
              </div>

              {/* blocked by */}
              {blkBy.length > 0 && (
                <div style={{ flex:"1 1 160px" }}>
                  <div style={{ fontSize:9, color:col.text, fontWeight:700, opacity:.6, marginBottom:6, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                    <IcArrowL s={10} c={col.text}/> ต้องรอจาก ({blkBy.length})
                  </div>
                  {blkBy.map(t => {
                    const c2 = teamColor(t.team, dark);
                    return (
                      <div key={t.id}
                        onClick={e => { e.stopPropagation(); setSelected(t); }}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"3px 0",
                          borderBottom:`1px solid ${col.border}20`, cursor:"pointer" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:c2.node, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:col.text }}>{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* blocks */}
              {blks.length > 0 && (
                <div style={{ flex:"1 1 160px" }}>
                  <div style={{ fontSize:9, color:col.text, fontWeight:700, opacity:.6, marginBottom:6, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                    <IcArrowR s={10} c={col.text}/> ปลดบล็อคให้ ({blks.length})
                  </div>
                  {blks.map(t => {
                    const c2 = teamColor(t.team, dark);
                    return (
                      <div key={t.id}
                        onClick={e => { e.stopPropagation(); setSelected(t); }}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"3px 0",
                          borderBottom:`1px solid ${col.border}20`, cursor:"pointer" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:c2.node, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:col.text }}>{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {blkBy.length === 0 && blks.length === 0 && (
                <div style={{ display:"flex", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:T.sub, opacity:.6 }}>ไม่มี dependencies</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
