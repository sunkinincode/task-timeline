import { useState, useEffect, useCallback, useRef } from "react";

// ─── TEAM COLOR CONFIG ────────────────────────────────────────────────────────
const TEAMS = {
  "สำนักแผนงานฯ":  { light:{pill:"#dbeafe",text:"#1e40af",border:"#93c5fd",node:"#3b82f6",line:"#3b82f6"},
                     dark: {pill:"#1e3a5c",text:"#93c5fd",border:"#2563eb",node:"#60a5fa",line:"#60a5fa"}},
  "สำนักกลยุทธ์ฯ": { light:{pill:"#ffedd5",text:"#9a3412",border:"#fb923c",node:"#f97316",line:"#f97316"},
                     dark: {pill:"#431407",text:"#fdba74",border:"#ea580c",node:"#fb923c",line:"#fb923c"}},
  "สำนักสื่อสารฯ":  { light:{pill:"#dcfce7",text:"#14532d",border:"#4ade80",node:"#16a34a",line:"#16a34a"},
                     dark: {pill:"#052e16",text:"#86efac",border:"#16a34a",node:"#4ade80",line:"#4ade80"}},
  "สำนักประธาน":    { light:{pill:"#f3e8ff",text:"#581c87",border:"#c084fc",node:"#9333ea",line:"#9333ea"},
                     dark: {pill:"#2e1065",text:"#d8b4fe",border:"#9333ea",node:"#c084fc",line:"#c084fc"}},
  "CYC Yala City":  { light:{pill:"#fce7f3",text:"#831843",border:"#f472b6",node:"#db2777",line:"#db2777"},
                     dark: {pill:"#500724",text:"#f9a8d4",border:"#db2777",node:"#f472b6",line:"#f472b6"}},
  "ทุกสำนัก":       { light:{pill:"#e0f2fe",text:"#075985",border:"#38bdf8",node:"#0284c7",line:"#0284c7"},
                     dark: {pill:"#082f49",text:"#7dd3fc",border:"#0284c7",node:"#38bdf8",line:"#38bdf8"}},
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
const fmtShort  = d => { const dt = parseDate(d); return `${dt.getDate()} ${MONTH_TH[dt.getMonth()]}`; };
const teamColor = (team, isDark) => (TEAMS[team] || TEAMS["ทุกสำนัก"])[isDark ? "dark" : "light"];

// ─── LAYOUT CONSTANTS ─────────────────────────────────────────────────────────
const W      = 1100;
const LABEL  = 220;
const CHART  = W - LABEL;
const ROW    = 54;
const HEAD   = 76;   // header height — two-zone: month strip + day strip
const LPAD   = 24;
const NODE_R = 10;

export default function App() {
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dark,        setDark]        = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [hovered,     setHovered]     = useState(null);

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

  // ── theme ──────────────────────────────────────────────────────
  const T = dark
    ? { bg:"#0f172a", surface:"#1e293b", border:"#334155", text:"#f1f5f9",
        sub:"#94a3b8", divider:"#1e293b", header:"#0f172a",
        rowEven:"#111827", rowOdd:"#0f172a", weekBand:"#1a2035",
        depLine:"#475569", monthLabel:"#818cf8" }
    : { bg:"#f8fafc", surface:"#ffffff", border:"#e2e8f0", text:"#0f172a",
        sub:"#64748b", divider:"#f1f5f9", header:"#ffffff",
        rowEven:"#f8fafc", rowOdd:"#ffffff", weekBand:"#f0f4ff",
        depLine:"#cbd5e1", monthLabel:"#6366f1" };

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
  const flatTasks = projects.flatMap(p => tasks.filter(t => t.project === p));
  const idxMap    = {};
  flatTasks.forEach((t, i) => { idxMap[t.id] = i; });
  const SVG_H = HEAD + flatTasks.length * ROW + 32;

  // date range
  const allDates = flatTasks.map(t => parseDate(t.date));
  const minD = allDates.length
    ? new Date(Math.min(...allDates) - 2 * 86400000)
    : new Date();
  const maxD = allDates.length
    ? new Date(Math.max(...allDates) + 3 * 86400000)
    : new Date(Date.now() + 30 * 86400000);
  const span = maxD - minD || 1;

  const getX = d => LABEL + LPAD + ((parseDate(d) - minD) / span) * (CHART - LPAD * 2);
  const getY = i => HEAD + i * ROW + ROW / 2;

  // date ticks — show every day but only label some
  const ticks = [];
  const cur = new Date(minD);
  while (cur <= maxD) { ticks.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

  // month change positions
  const monthMarkers = [];
  ticks.forEach((tick, i) => {
    if (tick.getDate() === 1 || i === 0) {
      monthMarkers.push({ x: getX(tick), label: `${MONTH_TH[tick.getMonth()]} ${String(tick.getFullYear() + 543).slice(-2)}` });
    }
  });

  // ── loading / error ────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Sarabun,sans-serif" }}>
      <div style={{ textAlign:"center", color: T.sub }}>
        <div style={{ fontSize:40, marginBottom:12, animation:"spin 1s linear infinite" }}>⏳</div>
        <div style={{ fontSize:14 }}>กำลังโหลดข้อมูลจาก Notion...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Sarabun,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:13, color:"#ef4444", marginBottom:12 }}>{error}</div>
        <button onClick={fetchTasks} style={{ padding:"8px 20px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>
          ลองใหม่
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Sarabun',sans-serif", background:T.bg, minHeight:"100vh", transition:"background .25s,color .25s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{
        background: T.header, borderBottom:`1px solid ${T.border}`,
        padding:"12px 20px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:10,
        position:"sticky", top:0, zIndex:20,
        boxShadow: dark ? "0 2px 12px #00000060" : "0 2px 12px #00000010",
      }}>
        {/* title */}
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:8 }}>
            <span>📋</span> Task Timeline · ประธานสภาเด็กฯ ยะลา
          </div>
          <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>
            {lastUpdated
              ? `อัพเดต ${new Date(lastUpdated).toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit" })}`
              : "—"} · {flatTasks.length} tasks
          </div>
        </div>

        {/* legend */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {Object.entries(TEAMS).map(([k, v]) => {
            const c = dark ? v.dark : v.light;
            return (
              <div key={k} style={{
                display:"flex", alignItems:"center", gap:4,
                background:c.pill, border:`1px solid ${c.border}`,
                borderRadius:20, padding:"2px 10px", cursor:"default",
              }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:c.node }}/>
                <span style={{ fontSize:10, fontWeight:600, color:c.text, whiteSpace:"nowrap" }}>{k}</span>
              </div>
            );
          })}
        </div>

        {/* controls */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={fetchTasks} title="Refresh" style={{
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
            padding:"6px 12px", cursor:"pointer", fontSize:12, color:T.sub,
            display:"flex", alignItems:"center", gap:4,
          }}>🔄 Refresh</button>
          <button onClick={() => setDark(d => !d)} style={{
            background: dark ? "#334155" : "#f1f5f9",
            border:`1px solid ${T.border}`, borderRadius:20,
            padding:"6px 14px", cursor:"pointer", fontSize:12,
            fontWeight:600, color:T.text,
          }}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {/* ── SVG TIMELINE ──────────────────────────────────────────── */}
      <div style={{ overflowX:"auto", padding:"12px 12px 0" }}>
        <svg width={W} height={SVG_H} style={{ display:"block", fontFamily:"'Sarabun',sans-serif" }}>
          <defs>
            {/* arrow for dim deps */}
            <marker id="arr-dim" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill={T.depLine}/>
            </marker>
            {/* arrow for lit deps — amber */}
            <marker id="arr-lit" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b"/>
            </marker>
            {/* per-team arrows */}
            {Object.entries(TEAMS).map(([k, v]) => {
              const c = dark ? v.dark : v.light;
              return (
                <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill={c.node}/>
                </marker>
              );
            })}
            {/* drop shadow for nodes */}
            <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5"
                floodColor={dark?"#000":"#00000025"} floodOpacity="1"/>
            </filter>
          </defs>

          {/* ── GRID background ── */}
          {ticks.map((tick, i) => {
            const x = getX(tick);
            const isWknd = tick.getDay() === 0 || tick.getDay() === 6;
            const isFirst = tick.getDate() === 1;
            return (
              <g key={i}>
                {isWknd && (
                  <rect x={x - 11} y={HEAD} width={22} height={SVG_H - HEAD}
                    fill={T.weekBand} opacity={0.7}/>
                )}
                <line x1={x} y1={HEAD} x2={x} y2={SVG_H}
                  stroke={isFirst ? (dark?"#475569":"#cbd5e1") : T.divider}
                  strokeWidth={isFirst ? 1.5 : 0.5}/>
              </g>
            );
          })}

          {/* ── ROW backgrounds ── */}
          {flatTasks.map((task, i) => (
            <rect key={`row-${task.id}`}
              x={LABEL} y={HEAD + i * ROW} width={CHART} height={ROW - 1}
              fill={i % 2 === 0 ? T.rowEven : T.rowOdd}
              opacity={isDimmed(task.id) ? 0.3 : 1}/>
          ))}

          {/* ── PROJECT bands (left panel) ── */}
          {projects.map((proj, pi) => {
            const rows = tasks.filter(t => t.project === proj);
            if (!rows.length) return null;
            const y0 = HEAD + idxMap[rows[0].id] * ROW;
            const y1 = HEAD + (idxMap[rows[rows.length - 1].id] + 1) * ROW;
            const bgs = [
              dark ? "#1e2d45" : "#eff6ff",
              dark ? "#1c1035" : "#f5f3ff",
              dark ? "#0f2a1e" : "#f0fdf4",
            ];
            const txts = [
              dark ? "#93c5fd" : "#1d4ed8",
              dark ? "#c084fc" : "#7c3aed",
              dark ? "#86efac" : "#15803d",
            ];
            return (
              <g key={proj}>
                <rect x={0} y={y0} width={LABEL} height={y1 - y0} fill={bgs[pi % 3]}/>
                {/* project separator on chart side */}
                {pi > 0 && (
                  <line x1={LABEL} y1={y0} x2={W} y2={y0}
                    stroke={txts[pi % 3]} strokeWidth={1.5}
                    opacity={0.4}/>
                )}
                {/* project label rotated */}
                <text
                  x={10} y={(y0 + y1) / 2}
                  dominantBaseline="middle" fontSize={10} fontWeight={700}
                  fill={txts[pi % 3]}
                  transform={`rotate(-90, 10, ${(y0 + y1) / 2})`}
                  style={{ userSelect:"none" }}>
                  {proj}
                </text>
              </g>
            );
          })}

          {/* ── DEPENDENCY CURVES — only visible on hover/select ── */}
          {active && flatTasks.map(task => {
            if (!hlSet.has(task.id)) return null;
            const x1 = getX(task.date);
            const y1 = getY(idxMap[task.id]);
            const col = teamColor(task.team, dark);

            return (task.blocks || []).map(bid => {
              const target = flatTasks.find(t => t.id === bid);
              if (!target) return null;

              const x2 = getX(target.date);
              const y2 = getY(idxMap[target.id]);
              const lit = isLit(task.id, bid);

              const cp1x = x1 + Math.max(20, (x2 - x1) * 0.4);
              const cp2x = x2 - Math.max(20, (x2 - x1) * 0.4);

              return (
                <path key={`${task.id}->${bid}`}
                  d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                  stroke={lit ? "#f59e0b" : col.line}
                  strokeWidth={lit ? 2.5 : 2}
                  fill="none"
                  opacity={lit ? 1 : 0.8}
                  markerEnd={lit ? "url(#arr-lit)" : `url(#arr-${task.team})`}
                />
              );
            });
          })}

          {/* ── TASK NODES ── */}
          {flatTasks.map((task, i) => {
            const x   = getX(task.date);
            const y   = getY(i);
            const col = teamColor(task.team, dark);
            const sel = selected?.id === task.id;
            const hov = hovered?.id  === task.id;
            const dim = isDimmed(task.id);
            const r   = sel ? NODE_R + 3 : NODE_R;
            const toRight = x < W - 240;

            return (
              <g key={task.id}
                opacity={dim ? 0.2 : 1}
                style={{ cursor:"pointer", transition:"opacity .15s" }}
                onClick={() => setSelected(sel ? null : task)}
                onMouseEnter={() => setHovered(task)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* selection ring */}
                {(sel || hov) && (
                  <circle cx={x} cy={y} r={r + 5}
                    fill="none" stroke={col.node}
                    strokeWidth={sel ? 2 : 1} opacity={0.35}/>
                )}

                {/* node */}
                <circle cx={x} cy={y} r={r}
                  fill={sel || hov ? col.node : (dark ? col.pill : "#fff")}
                  stroke={col.node} strokeWidth={sel ? 2.5 : 1.8}
                  filter="url(#node-shadow)"/>

                {/* done check */}
                {task.done && (
                  <text x={x} y={y + 1} textAnchor="middle"
                    dominantBaseline="middle" fontSize={9}
                    fill={sel || hov ? "#fff" : col.node} fontWeight={700}>✓</text>
                )}

                {/* date label — above node */}
                <text x={x} y={y - r - 5} textAnchor="middle"
                  fontSize={9} fontWeight={600}
                  fill={col.text} opacity={dim ? 0.4 : 0.9}>
                  {fmtShort(task.date)}
                </text>

                {/* task name — inline, right or left of node */}
                {(() => {
                  const px     = toRight ? x + r + 7  : x - r - 7;
                  const anchor = toRight ? "start"     : "end";
                  const maxPx  = toRight ? W - x - r - 12 : x - LABEL - r - 12;
                  const chars  = Math.max(8, Math.floor(maxPx / 6.3));
                  const label  = task.name.length > chars
                    ? task.name.slice(0, chars - 1) + "…"
                    : task.name;
                  return (
                    <text x={px} y={y + 1} textAnchor={anchor}
                      dominantBaseline="middle"
                      fontSize={11} fontWeight={sel || hov ? 700 : 500}
                      fill={sel || hov ? col.text : (dark ? "#e2e8f0" : "#1e293b")}>
                      {label}
                    </text>
                  );
                })()}

                {/* team badge — below name */}
                <text
                  x={toRight ? x + r + 7 : x - r - 7}
                  y={y + 14}
                  textAnchor={toRight ? "start" : "end"}
                  fontSize={9} fill={col.text} opacity={0.6}>
                  {task.team}
                </text>
              </g>
            );
          })}

          {/* ── LEFT TASK LABELS ── */}
          {flatTasks.map((task, i) => {
            const y   = getY(i);
            const col = teamColor(task.team, dark);
            const sel = selected?.id === task.id;
            const dim = isDimmed(task.id);
            return (
              <g key={`lbl-${task.id}`}
                opacity={dim ? 0.2 : 1}
                style={{ cursor:"pointer" }}
                onClick={() => setSelected(sel ? null : task)}
                onMouseEnter={() => setHovered(task)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* highlight bg */}
                {sel && (
                  <rect x={14} y={HEAD + i * ROW + 5}
                    width={LABEL - 20} height={ROW - 10}
                    fill={col.pill} stroke={col.border}
                    strokeWidth={1} rx={6}/>
                )}
                {/* color bar */}
                <rect x={14} y={HEAD + i * ROW + 10}
                  width={3} height={ROW - 20}
                  fill={col.node} rx={2}/>
                {/* task name */}
                <text x={24} y={y - 4}
                  fontSize={10.5} fontWeight={sel ? 700 : 500}
                  fill={sel ? col.text : T.text}
                  dominantBaseline="middle">
                  {task.name.length > 22 ? task.name.slice(0, 20) + "…" : task.name}
                </text>
                {/* team name */}
                <text x={24} y={y + 9}
                  fontSize={9} fill={col.text} opacity={0.65}>
                  {task.team}
                </text>
              </g>
            );
          })}

          {/* ── HEADER BAR ── */}
          <rect x={0} y={0} width={W} height={HEAD} fill={T.header}/>
          <line x1={0} y1={HEAD} x2={W} y2={HEAD} stroke={T.border} strokeWidth={1}/>
          <line x1={LABEL} y1={0} x2={LABEL} y2={SVG_H} stroke={T.border} strokeWidth={1}/>

          {/* month labels — top strip of header */}
          {monthMarkers.map(({ x, label }, mi) => (
            <g key={label}>
              {mi > 0 && (
                <line x1={x} y1={34} x2={x} y2={HEAD}
                  stroke={T.monthLabel} strokeWidth={1} opacity={0.25}/>
              )}
              <text x={mi === 0 ? Math.max(x, LABEL + 4) : x + 5} y={18}
                fontSize={12} fontWeight={700}
                fill={T.monthLabel} dominantBaseline="middle">
                {label}
              </text>
            </g>
          ))}

          {/* separator between month zone and day zone */}
          <line x1={LABEL} y1={34} x2={W} y2={34}
            stroke={T.border} strokeWidth={0.5} opacity={0.6}/>

          {/* date numbers — lower part of header, every 5 days */}
          {ticks.map((tick, i) => {
            const x = getX(tick);
            const d = tick.getDate();
            if (d !== 1 && d % 5 !== 0) return null;
            return (
              <g key={i}>
                <text x={x} y={HEAD - 23} textAnchor="middle"
                  fontSize={11} fontWeight={700}
                  fill={dark?"#e2e8f0":"#1e293b"}
                  dominantBaseline="middle">{d}</text>
                <text x={x} y={HEAD - 10} textAnchor="middle"
                  fontSize={9} fontWeight={600}
                  fill={T.monthLabel} dominantBaseline="middle">
                  {MONTH_TH[tick.getMonth()]}
                </text>
              </g>
            );
          })}

          {/* today line */}
          {(() => {
            const today = new Date();
            if (today < minD || today > maxD) return null;
            const tx = getX(today);
            return (
              <g>
                <line x1={tx} y1={HEAD} x2={tx} y2={SVG_H}
                  stroke="#ef4444" strokeWidth={2}
                  opacity={0.7}/>
                <rect x={tx - 14} y={HEAD - 18} width={28} height={16}
                  fill="#ef4444" rx={4}/>
                <text x={tx} y={HEAD - 10} textAnchor="middle"
                  fontSize={9} fontWeight={700} fill="#fff" dominantBaseline="middle">
                  วันนี้
                </text>
              </g>
            );
          })()}

          {/* header label */}
          <rect x={0} y={0} width={LABEL} height={HEAD} fill={T.header}/>
          <text x={18} y={HEAD / 2 + 1} dominantBaseline="middle"
            fontSize={11} fontWeight={700} fill={T.sub}>Task</text>
        </svg>
      </div>

      {/* ── DETAIL PANEL ──────────────────────────────────────────── */}
      {selected && (() => {
        const col   = teamColor(selected.team, dark);
        const blkBy = (selected.blockedBy || []).map(id => tasks.find(t => t.id === id)).filter(Boolean);
        const blks  = (selected.blocks    || []).map(id => tasks.find(t => t.id === id)).filter(Boolean);
        return (
          <div style={{
            margin:"10px 14px 0",
            background: col.pill, border:`2px solid ${col.border}`,
            borderRadius:12, padding:"14px 18px",
            display:"flex", gap:18, flexWrap:"wrap",
            boxShadow: dark ? "0 4px 20px #00000050" : "0 4px 20px #00000012",
          }}>
            {/* main info */}
            <div style={{ flex:"1 1 220px" }}>
              <div style={{ fontSize:9, color:col.text, fontWeight:700, letterSpacing:"0.12em", opacity:.6, marginBottom:5 }}>
                TASK DETAIL
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:col.text, marginBottom:9, lineHeight:1.3 }}>
                {selected.name}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  { icon:"📅", val: fmtShort(selected.date) },
                  { icon:"🏢", val: TEAM_FULL[selected.team] || selected.team },
                  { icon:"📁", val: selected.project },
                  { icon:"🔘", val: selected.done ? "✅ Done" : selected.status || "Not started" },
                ].map(({ icon, val }) => (
                  <span key={val} style={{
                    fontSize:10.5, padding:"3px 10px", borderRadius:20,
                    background: dark ? "#00000030" : "#ffffff90",
                    color:col.text, border:`1px solid ${col.border}40`,
                  }}>{icon} {val}</span>
                ))}
              </div>
            </div>

            {/* blocked by */}
            {blkBy.length > 0 && (
              <div style={{ flex:"1 1 180px" }}>
                <div style={{ fontSize:9, color:col.text, fontWeight:700, opacity:.6, marginBottom:6, letterSpacing:"0.1em" }}>
                  ⬅ ต้องรอจาก ({blkBy.length})
                </div>
                {blkBy.map(t => {
                  const c2 = teamColor(t.team, dark);
                  return (
                    <div key={t.id}
                      onClick={e => { e.stopPropagation(); setSelected(t); }}
                      style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0",
                        borderBottom:`1px solid ${col.border}25`, cursor:"pointer" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:c2.node, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:col.text }}>{t.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* blocks */}
            {blks.length > 0 && (
              <div style={{ flex:"1 1 180px" }}>
                <div style={{ fontSize:9, color:col.text, fontWeight:700, opacity:.6, marginBottom:6, letterSpacing:"0.1em" }}>
                  ➡ ปลดบล็อคให้ ({blks.length})
                </div>
                {blks.map(t => {
                  const c2 = teamColor(t.team, dark);
                  return (
                    <div key={t.id}
                      onClick={e => { e.stopPropagation(); setSelected(t); }}
                      style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0",
                        borderBottom:`1px solid ${col.border}25`, cursor:"pointer" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:c2.node, flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:col.text }}>{t.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {blkBy.length === 0 && blks.length === 0 && (
              <div style={{ flex:"1 1 160px", display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:11, color:col.text, opacity:.5 }}>ไม่มี dependencies</span>
              </div>
            )}

            <button onClick={() => setSelected(null)} style={{
              alignSelf:"flex-start", background:"transparent", border:"none",
              cursor:"pointer", fontSize:16, color:col.text, opacity:.4, padding:0,
            }}>✕</button>
          </div>
        );
      })()}

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, padding:"12px 14px 20px", flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"Tasks ทั้งหมด", val:tasks.length,                                                      col:"#3b82f6" },
          { label:"เสร็จแล้ว",     val:tasks.filter(t => t.done).length,                                  col:"#16a34a" },
          { label:"ยังไม่เริ่ม",   val:tasks.filter(t => !t.done).length,                                 col:"#f97316" },
          { label:"มี dependency", val:tasks.filter(t => (t.blocks?.length||0)+(t.blockedBy?.length||0)>0).length, col:"#f59e0b" },
        ].map(({ label, val, col }) => (
          <div key={label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"7px 14px",
            display:"flex", flexDirection:"column", alignItems:"center", minWidth:76,
          }}>
            <span style={{ fontSize:20, fontWeight:700, color:col, lineHeight:1 }}>{val}</span>
            <span style={{ fontSize:9.5, color:T.sub, marginTop:3 }}>{label}</span>
          </div>
        ))}

        <div style={{ marginLeft:"auto", fontSize:10.5, color:T.sub, textAlign:"right", lineHeight:1.6 }}>
          🖱 คลิก node เพื่อดู dependency<br/>
          🟥 เส้นแดง = วันนี้ · 🌫 พื้นหลังเข้ม = วันหยุด
        </div>
      </div>
    </div>
  );
}