
import { useState, useEffect, useCallback, useMemo } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const APPLIANCES = [
  { id:"ac1",      name:"AC (Bedroom)",     icon:"❄️",  watts:1500, category:"comfort",   priority:3, canDefer:true  },
  { id:"ac2",      name:"AC (Living Room)", icon:"❄️",  watts:1800, category:"comfort",   priority:3, canDefer:true  },
  { id:"geyser",   name:"Geyser",           icon:"🚿",  watts:2000, category:"hygiene",   priority:2, canDefer:true  },
  { id:"pump",     name:"Water Pump",       icon:"💧",  watts:750,  category:"essential", priority:1, canDefer:false },
  { id:"fridge",   name:"Refrigerator",     icon:"🧊",  watts:150,  category:"essential", priority:1, canDefer:false },
  { id:"washing",  name:"Washing Machine",  icon:"👕",  watts:500,  category:"chores",    priority:4, canDefer:true  },
  { id:"micro",    name:"Microwave",        icon:"📡",  watts:1200, category:"kitchen",   priority:2, canDefer:true  },
  { id:"tv",       name:"TV",              icon:"📺",  watts:120,  category:"leisure",   priority:5, canDefer:true  },
  { id:"lights",   name:"Lights (All)",    icon:"💡",  watts:200,  category:"essential", priority:1, canDefer:false },
  { id:"fan",      name:"Ceiling Fans",    icon:"🌀",  watts:210,  category:"comfort",   priority:2, canDefer:false },
  { id:"computer", name:"Computer/Laptop", icon:"💻",  watts:300,  category:"work",      priority:2, canDefer:true  },
  { id:"iron",     name:"Clothes Iron",    icon:"👔",  watts:1000, category:"chores",    priority:4, canDefer:true  },
];

const PRIORITY_LABELS = { 1:"Critical", 2:"High", 3:"Medium", 4:"Low", 5:"Optional" };
const PRIORITY_COLORS = { 1:"#E63946", 2:"#F4A261", 3:"#00A896", 4:"#60A5FA", 5:"#8BA0B4" };

const DEFAULT_BEHAVIOUR = {
  ac1:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  ac2:[0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0],
  geyser:[0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  pump:[0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  fridge:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  washing:[0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
  micro:[0,0,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0],
  tv:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
  lights:[0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0],
  fan:[1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  computer:[0,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0],
  iron:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};

const LIMIT_W = 5000;

const CAT_COLORS = {
  essential:"#00A896", comfort:"#A78BFA", hygiene:"#F4A261",
  kitchen:"#F4D261", chores:"#60A5FA", leisure:"#F472B6", work:"#34D399",
};

const HOURS_LABEL = [
  "12 AM","1 AM","2 AM","3 AM","4 AM","5 AM","6 AM","7 AM",
  "8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM",
  "4 PM","5 PM","6 PM","7 PM","8 PM","9 PM","10 PM","11 PM",
];

// ─── PRIORITY SCHEDULING ALGORITHM ──────────────────────────────────────────
// Greedy bin-packing by priority, with defer tracking
function runPrioritySchedule(requestedOn, limitW = LIMIT_W) {
  // Sort: lower priority number = higher importance, schedule first
  const sorted = [...APPLIANCES].sort((a, b) => a.priority - b.priority);
  let remaining = limitW;
  const result = {};
  const deferred = [];

  for (const a of sorted) {
    if (!requestedOn[a.id]) {
      result[a.id] = { status: "off", watts: 0, reason: "Not requested" };
      continue;
    }
    if (remaining >= a.watts) {
      remaining -= a.watts;
      result[a.id] = { status: "on", watts: a.watts, reason: `Priority ${a.priority} — ${PRIORITY_LABELS[a.priority]}` };
    } else {
      if (!a.canDefer) {
        // Non-deferrable critical: force on, flag overload
        result[a.id] = { status: "forced", watts: a.watts, reason: "Non-deferrable — forced ON" };
        remaining -= a.watts;
      } else {
        result[a.id] = { status: "deferred", watts: 0, reason: `Load full — deferred (P${a.priority})` };
        deferred.push(a.id);
      }
    }
  }

  const totalW = Object.values(result).reduce((s, r) => s + r.watts, 0);
  return { result, totalW, deferred, headroom: limitW - totalW };
}

// Suggest which to turn off to stay within limit
function getSuggestions(requestedOn, limitW = LIMIT_W) {
  const { deferred, headroom } = runPrioritySchedule(requestedOn, limitW);
  if (deferred.length === 0) return [];
  // Find lowest-priority ON appliances that could free enough headroom
  const onAppliances = APPLIANCES
    .filter(a => requestedOn[a.id] && a.canDefer)
    .sort((a, b) => b.priority - a.priority); // highest number = lowest priority first
  const suggestions = [];
  let freed = 0;
  for (const a of onAppliances) {
    if (deferred.every(id => {
      const need = APPLIANCES.find(x => x.id === id)?.watts || 0;
      return freed >= need;
    })) break;
    suggestions.push(a);
    freed += a.watts;
    if (freed >= Math.abs(headroom) + deferred.reduce((s, id) => s + (APPLIANCES.find(x => x.id === id)?.watts || 0), 0)) break;
  }
  return suggestions;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function defaultManualSchedule() {
  const s = {};
  APPLIANCES.forEach(a => { s[a.id] = DEFAULT_BEHAVIOUR[a.id].map(v => v === 1); });
  return s;
}
function fmtKwh(v) { return v >= 10 ? v.toFixed(1) : v.toFixed(2); }

// ─── STORAGE ─────────────────────────────────────────────────────────────────
async function loadHistory() { try { const r = await window.storage.get("energy:history"); return r ? JSON.parse(r.value) : {}; } catch { return {}; } }
async function saveHistory(h) { try { await window.storage.set("energy:history", JSON.stringify(h)); } catch {} }
async function loadRetention() { try { const r = await window.storage.get("energy:retention"); return r ? parseInt(r.value) : 14; } catch { return 14; } }
async function saveRetention(d) { try { await window.storage.set("energy:retention", String(d)); } catch {} }
async function loadManualSchedule() { try { const r = await window.storage.get("energy:manualSchedule"); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function saveManualSchedule(s) { try { await window.storage.set("energy:manualSchedule", JSON.stringify(s)); } catch {} }

// ─── SEED DEMO DATA (30 days of realistic fake history) ──────────────────────
function generateDemoHistory() {
  const history = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const dow = d.getDay(); // 0=Sun
    const isWeekend = dow === 0 || dow === 6;
    const snap = {};
    APPLIANCES.forEach(a => {
      const base = [...DEFAULT_BEHAVIOUR[a.id]];
      // Add some weekend variation
      if (isWeekend) {
        if (a.id === "tv") base[14]=1, base[15]=1, base[16]=1;
        if (a.id === "washing") base[10]=1, base[11]=1;
        if (a.id === "computer") base[10]=0, base[11]=0, base[13]=0;
      }
      // Random daily noise (±1-2 hours)
      snap[a.id] = base.map(v => v === 1 ? (Math.random() > 0.15 ? 1 : 0) : (Math.random() > 0.92 ? 1 : 0));
    });
    history[key] = snap;
  }
  return history;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function WattBar({ used, limit }) {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct > 95 ? "#E63946" : pct > 75 ? "#F4A261" : "#00A896";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, color:"#8BA0B4", letterSpacing:1, textTransform:"uppercase" }}>Live Load</span>
        <span style={{ fontSize:15, fontWeight:800, color, fontFamily:"monospace" }}>
          {(used/1000).toFixed(2)} kW <span style={{color:"#3D5166",fontWeight:400}}>/ {(limit/1000).toFixed(1)} kW</span>
        </span>
      </div>
      <div style={{ background:"#060D14", borderRadius:8, height:14, position:"relative", border:"1px solid #1B2A3B" }}>
        <div style={{ height:14, borderRadius:8, width:`${pct}%`, background:`linear-gradient(90deg,#00A896,${color})`,
          transition:"width 0.5s ease", boxShadow:`0 0 12px ${color}50` }}/>
        {/* Priority zone markers */}
        {[50,75,90].map(p => (
          <div key={p} style={{ position:"absolute", left:`${p}%`, top:0, height:14, width:1,
            background:"#ffffff15", pointerEvents:"none" }}/>
        ))}
        <div style={{ position:"absolute", right:0, top:-3, height:20, width:2, background:"#E63946", borderRadius:2 }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
        <span style={{ fontSize:9, color:"#3D5166" }}>0 kW</span>
        <span style={{ fontSize:9, color:pct>90?"#E63946":pct>75?"#F4A261":"#3D5166" }}>
          {pct>90?"⚠ ":""}{pct.toFixed(0)}% used
        </span>
        <span style={{ fontSize:9, color:"#E63946" }}>Limit {(limit/1000).toFixed(0)}kW</span>
      </div>
    </div>
  );
}

function Toggle({ on, onToggle, size = "normal" }) {
  const w = size === "sm" ? 36 : 44, h = size === "sm" ? 20 : 24;
  const knob = size === "sm" ? 12 : 16, top = size === "sm" ? 4 : 4;
  const offLeft = size === "sm" ? 4 : 4, onLeft = size === "sm" ? 18 : 22;
  return (
    <div onClick={onToggle} style={{ width:w, height:h, borderRadius:h/2, cursor:"pointer",
      background: on?"#00A896":"#1B2A3B", border:`1px solid ${on?"#00A896":"#2D4056"}`,
      position:"relative", transition:"all 0.2s", boxShadow: on?"0 0 10px #00A89650":"none", flexShrink:0 }}>
      <div style={{ position:"absolute", top, left: on ? onLeft : offLeft,
        width:knob, height:knob, borderRadius:"50%",
        background: on?"#fff":"#3D5166", transition:"left 0.2s, background 0.2s", boxShadow:"0 1px 4px #0008" }}/>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span style={{ fontSize:8, fontWeight:800, color, background:`${color}18`,
      border:`1px solid ${color}35`, borderRadius:4, padding:"1px 5px", letterSpacing:0.5, textTransform:"uppercase" }}>
      P{priority} {PRIORITY_LABELS[priority]}
    </span>
  );
}

function ApplianceRow({ item, isOn, scheduleStatus, onToggle }) {
  const catColor = CAT_COLORS[item.category] || "#8BA0B4";
  const sched = scheduleStatus || { status: isOn ? "on" : "off", watts: isOn ? item.watts : 0, reason: "" };
  const isDeferred = sched.status === "deferred";
  const isForced = sched.status === "forced";
  const borderColor = isDeferred ? "#F4A26140" : isForced ? "#E6394640" : isOn ? `${catColor}35` : "#1B2A3B";
  const bg = isDeferred ? "rgba(244,162,97,0.06)" : isForced ? "rgba(230,57,70,0.06)" : isOn ? `${catColor}0A` : "rgba(10,21,32,0.5)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 14px", borderRadius:13,
      marginBottom:6, background:bg, border:`1px solid ${borderColor}`,
      transition:"all 0.22s", boxShadow: isOn && !isDeferred ? `0 0 16px ${catColor}0D` : "none" }}>
      <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
        background: isOn ? `${catColor}16` : "#0A1520",
        border:`1px solid ${isOn ? catColor+"35":"#1B2A3B"}`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
        filter: !isOn || isDeferred ? "grayscale(1) opacity(0.4)" : "none", transition:"all 0.22s" }}>
        {item.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color: (isOn&&!isDeferred)?"#fff":"#4A6478",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:3 }}>
          {item.name}
        </div>
        <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
          <PriorityBadge priority={item.priority} />
          {isDeferred && <span style={{ fontSize:8, color:"#F4A261" }}>⏰ deferred</span>}
          {isForced  && <span style={{ fontSize:8, color:"#E63946" }}>⚡ forced</span>}
          {sched.reason && !isDeferred && !isForced &&
            <span style={{ fontSize:8, color:"#3D5166" }}>{sched.reason}</span>}
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0, marginRight:8 }}>
        <div style={{ fontSize:12, fontWeight:800, fontFamily:"monospace",
          color: (isOn&&!isDeferred)?"#fff":"#3D5166" }}>
          {(isOn&&!isDeferred) ? `${item.watts}W` : "0 W"}
        </div>
      </div>
      <Toggle on={isOn && !isDeferred} onToggle={onToggle} />
    </div>
  );
}

function TimelineBar({ applianceId, schedule, onToggleHour, currentHour }) {
  const a = APPLIANCES.find(x => x.id === applianceId);
  const catColor = CAT_COLORS[a?.category] || "#00A896";
  const [dragging, setDragging] = useState(null);
  return (
    <div style={{ display:"flex", gap:1.5, height:20, userSelect:"none" }}
      onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}>
      {Array.from({ length:24 }, (_, h) => {
        const on = !!schedule[h];
        return (
          <div key={h} title={`${HOURS_LABEL[h]}: ${on?"ON":"OFF"}`}
            onMouseDown={e => { e.preventDefault(); const v=!schedule[h]; setDragging(v?"on":"off"); onToggleHour(h,v); }}
            onMouseEnter={() => dragging && onToggleHour(h, dragging==="on")}
            style={{ flex:1, borderRadius:3, cursor:"pointer",
              background: on ? catColor : "#0D1B2A",
              opacity: on ? 0.88 : 0.3,
              outline: h===currentHour ? "2px solid #ffffff70" : "none",
              outlineOffset:"-1px", transition:"background 0.07s" }}/>
        );
      })}
    </div>
  );
}

function TimeWindowEditor({ schedule, onSet }) {
  let start = 0, end = 0;
  for (let h=0;h<24;h++) { if(schedule[h]){start=h;break;} }
  for (let h=23;h>=0;h--) { if(schedule[h]){end=h+1;break;} }
  const apply = (s,e) => { const a=Array(24).fill(false); for(let h=s;h<Math.min(e,24);h++) a[h]=true; onSet(a); };
  const selStyle = { background:"#060D14", border:"1px solid #1B2A3B", color:"#8BA0B4",
    borderRadius:6, padding:"2px 5px", fontSize:9 };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, flexWrap:"wrap" }}>
      <span style={{ fontSize:9, color:"#3D5166" }}>ON from</span>
      <select value={start} onChange={e=>apply(+e.target.value,end)} style={selStyle}>
        {Array.from({length:24},(_,h)=><option key={h} value={h}>{HOURS_LABEL[h]}</option>)}
      </select>
      <span style={{ fontSize:9, color:"#3D5166" }}>to</span>
      <select value={end} onChange={e=>apply(start,+e.target.value)} style={selStyle}>
        {Array.from({length:25},(_,h)=><option key={h} value={h}>{h===24?"12AM+1":HOURS_LABEL[h]}</option>)}
      </select>
      <div onClick={()=>onSet(Array(24).fill(false))}
        style={{ fontSize:9, color:"#E63946", cursor:"pointer", padding:"2px 6px",
          borderRadius:5, border:"1px solid #E6394640", background:"rgba(230,57,70,0.06)" }}>✕</div>
    </div>
  );
}

// ─── HISTORY CHARTS ───────────────────────────────────────────────────────────

// SVG line + bar combo chart for history
function ConsumptionChart({ data, height = 160 }) {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;

  const maxKwh = Math.max(...data.map(d => d.kwh), 1);
  const W = 100; // percent-based via flex
  const padT = 24, padB = 28, padL = 36, padR = 8;
  const chartH = height - padT - padB;

  // SVG line path (normalized to 0-100 range)
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = chartH - (d.kwh / maxKwh) * chartH;
    return [x, y];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length-1][0]} ${chartH} L ${pts[0][0]} ${chartH} Z`
    : "";

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: maxKwh * f, y: chartH - f * chartH }));

  const avg = data.reduce((s, d) => s + d.kwh, 0) / data.length;

  return (
    <div style={{ position:"relative", userSelect:"none" }}>
      {/* Y-axis */}
      <svg width="100%" height={height} style={{ overflow:"visible", display:"block" }}
        viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1="0" y1={t.y + padT} x2="100" y2={t.y + padT}
            stroke="#1B2A3B" strokeWidth="0.3" strokeDasharray={i === 0 ? "0" : "2,2"}/>
        ))}
        {/* Average line */}
        <line x1="0" y1={chartH - (avg / maxKwh) * chartH + padT}
          x2="100" y2={chartH - (avg / maxKwh) * chartH + padT}
          stroke="#F4A26170" strokeWidth="0.6" strokeDasharray="3,3"/>
        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00A896" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#00A896" stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <path d={areaPath.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (m, x, y) => `${x} ${parseFloat(y)+padT}`)}
          fill="url(#areaGrad)"/>
        {/* Line */}
        <path d={linePath.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (m, x, y) => `${x} ${parseFloat(y)+padT}`)}
          fill="none" stroke="#00A896" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]+padT} r={hovered===i?2.5:1.5}
            fill={data[i].kwh > avg * 1.2 ? "#F4A261" : "#00A896"}
            stroke="#060D14" strokeWidth="0.8"
            style={{ cursor:"pointer", transition:"r 0.1s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}/>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hovered !== null && (
        <div style={{
          position:"absolute",
          left:`${pts[hovered][0]}%`,
          top: pts[hovered][1] + padT - 32,
          transform:"translateX(-50%)",
          background:"#0D1B2A", border:"1px solid #1B2A3B", borderRadius:7,
          padding:"4px 9px", pointerEvents:"none", whiteSpace:"nowrap", zIndex:10,
        }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#00A896", fontFamily:"monospace" }}>
            {fmtKwh(data[hovered].kwh)} kWh
          </div>
          <div style={{ fontSize:9, color:"#8BA0B4" }}>{data[hovered].label}</div>
        </div>
      )}

      {/* X-axis labels */}
      <div style={{ display:"flex", marginTop:4, paddingLeft:0 }}>
        {data.map((d, i) => {
          const show = data.length <= 10 || i % Math.ceil(data.length / 10) === 0 || i === data.length-1;
          return (
            <div key={i} style={{ flex:1, fontSize:7, color: hovered===i?"#00A896":"#3D5166",
              textAlign:"center", overflow:"hidden", fontWeight: hovered===i?700:400 }}>
              {show ? d.label : ""}
            </div>
          );
        })}
      </div>

      {/* Y-axis labels (absolute overlay) */}
      <div style={{ position:"absolute", left:0, top:padT, height:chartH, pointerEvents:"none" }}>
        {yTicks.slice(1).map((t, i) => (
          <div key={i} style={{ position:"absolute", top:t.y-7, right:0, fontSize:7, color:"#3D5166",
            fontFamily:"monospace", whiteSpace:"nowrap" }}>
            {t.val.toFixed(1)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stacked category bar chart for month view
function StackedBarChart({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data.length) return null;

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const cats = Object.keys(CAT_COLORS);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:130 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end",
            height:"100%", cursor:"pointer", position:"relative" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {/* Stacked segments */}
            <div style={{ display:"flex", flexDirection:"column-reverse", borderRadius:"3px 3px 0 0",
              overflow:"hidden", height:`${Math.max((d.total/maxTotal)*100,d.total>0?3:0)}%`,
              minHeight: d.total > 0 ? 3 : 0, transition:"height 0.4s ease",
              boxShadow: hovered===i ? "0 0 8px #ffffff20" : "none" }}>
              {cats.map(cat => {
                const kwh = d.cats?.[cat] || 0;
                const pct = d.total > 0 ? (kwh / d.total) * 100 : 0;
                if (pct < 1) return null;
                return <div key={cat} style={{ height:`${pct}%`, background:CAT_COLORS[cat], minHeight:2 }}/>;
              })}
            </div>

            {/* Tooltip */}
            {hovered === i && d.total > 0 && (
              <div style={{ position:"absolute", bottom:"108%", left:"50%", transform:"translateX(-50%)",
                background:"#0D1B2A", border:"1px solid #1B2A3B", borderRadius:8, padding:"7px 10px",
                zIndex:20, whiteSpace:"nowrap", minWidth:110 }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#fff", marginBottom:4 }}>{d.label}</div>
                <div style={{ fontSize:10, fontWeight:800, color:"#00A896", fontFamily:"monospace", marginBottom:5 }}>
                  {fmtKwh(d.total)} kWh total
                </div>
                {cats.filter(c => (d.cats?.[c]||0) > 0).map(c => (
                  <div key={c} style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:6, height:6, borderRadius:2, background:CAT_COLORS[c], flexShrink:0 }}/>
                      <span style={{ fontSize:8, color:"#8BA0B4", textTransform:"capitalize" }}>{c}</span>
                    </div>
                    <span style={{ fontSize:8, color:"#fff", fontFamily:"monospace" }}>
                      {fmtKwh(d.cats[c])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:2, borderTop:"1px solid #1B2A3B", paddingTop:5 }}>
        {data.map((d, i) => {
          const show = data.length <= 8 || i % Math.ceil(data.length / 8) === 0 || i === data.length-1;
          return (
            <div key={i} style={{ flex:1, fontSize:7, color:hovered===i?"#00A896":"#3D5166",
              textAlign:"center", overflow:"hidden" }}>
              {show ? d.label : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function App() {
  const [time, setTime] = useState(new Date());
  const [hour, setHour] = useState(new Date().getHours());
  const [tab, setTab] = useState("monitor");
  const [historyRange, setHistoryRange] = useState("7");
  const [priorityMode, setPriorityMode] = useState(true);

  const [requested, setRequested] = useState(() => {
    const s = {}; APPLIANCES.forEach(a => { s[a.id] = DEFAULT_BEHAVIOUR[a.id][new Date().getHours()] === 1; });
    return s;
  });
  const [manualSchedule, setManualSchedule] = useState(defaultManualSchedule);
  const [history, setHistory] = useState({});
  const [retentionDays, setRetentionDays] = useState(14);
  const [demoLoaded, setDemoLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [h, r, ms] = await Promise.all([loadHistory(), loadRetention(), loadManualSchedule()]);
      // Auto-seed demo data if no history yet
      if (Object.keys(h).length === 0) {
        const demo = generateDemoHistory();
        setHistory(demo);
        await saveHistory(demo);
        setDemoLoaded(true);
      } else {
        setHistory(h);
      }
      setRetentionDays(r);
      if (ms) setManualSchedule(ms);
    })();
  }, []);

  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    setRequested(() => {
      const s = {}; APPLIANCES.forEach(a => { s[a.id] = !!manualSchedule[a.id]?.[hour]; }); return s;
    });
  }, [hour, manualSchedule]);

  const { result: schedResult, totalW, deferred } = useMemo(
    () => priorityMode ? runPrioritySchedule(requested) : {
      result: Object.fromEntries(APPLIANCES.map(a => [a.id, { status: requested[a.id]?"on":"off", watts: requested[a.id]?a.watts:0, reason:"" }])),
      totalW: APPLIANCES.reduce((s,a) => s+(requested[a.id]?a.watts:0),0),
      deferred: [], headroom: 0,
    },
    [requested, priorityMode]
  );

  const suggestions = useMemo(() => priorityMode ? getSuggestions(requested) : [], [requested, priorityMode]);

  const recordToHistory = useCallback(async (newReq, targetHour) => {
    const key = todayKey();
    setHistory(prev => {
      const today = { ...(prev[key] || {}) };
      APPLIANCES.forEach(a => {
        const arr = today[a.id] ? [...today[a.id]] : Array(24).fill(0);
        arr[targetHour] = newReq[a.id] ? 1 : 0;
        today[a.id] = arr;
      });
      const updated = { ...prev, [key]: today };
      const keys = Object.keys(updated).sort();
      if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => delete updated[k]);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const toggleAppliance = useCallback((id) => {
    setRequested(prev => { const next = { ...prev, [id]: !prev[id] }; recordToHistory(next, hour); return next; });
  }, [hour, recordToHistory]);

  const toggleScheduleHour = useCallback((id, h, v) => {
    setManualSchedule(prev => {
      const arr = [...(prev[id] || Array(24).fill(false))]; arr[h] = v;
      const next = { ...prev, [id]: arr }; saveManualSchedule(next); return next;
    });
  }, []);

  const setScheduleArray = useCallback((id, arr) => {
    setManualSchedule(prev => { const next = { ...prev, [id]: arr }; saveManualSchedule(next); return next; });
  }, []);

  // ── chart data ──
  const padDays = useCallback((n) => {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const dow = ["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()];
      const mon = d.getMonth()+1, day = d.getDate();
      const label = n <= 7 ? `${dow}\n${mon}/${day}` : `${mon}/${day}`;
      const snap = history[key] || {};
      const cats = {};
      let total = 0;
      APPLIANCES.forEach(a => {
        const hrs = (snap[a.id] || []).filter(Boolean).length;
        const kwh = parseFloat(((hrs * a.watts) / 1000).toFixed(3));
        cats[a.category] = (cats[a.category] || 0) + kwh;
        total += kwh;
      });
      return { label, total: parseFloat(total.toFixed(2)), cats, day: key };
    });
  }, [history]);

  const chart7  = useMemo(() => padDays(7),  [padDays]);
  const chart30 = useMemo(() => padDays(30), [padDays]);
  const chartData = historyRange === "7" ? chart7 : chart30;

  const activeDays = chartData.filter(d => d.total > 0);
  const totalKwh = chartData.reduce((s, d) => s + d.total, 0);
  const avgKwh = activeDays.length ? totalKwh / activeDays.length : 0;
  const peakDay = activeDays.reduce((best, d) => d.total > (best?.total||0) ? d : best, null);

  // Appliance breakdown
  const allDays = Object.keys(history).sort();
  const rangeKeys = historyRange === "7" ? allDays.slice(-7) : allDays.slice(-30);
  const breakdown = useMemo(() => APPLIANCES.map(a => {
    const kwh = rangeKeys.reduce((s, day) => {
      const hrs = (history[day]?.[a.id] || []).filter(Boolean).length;
      return s + (hrs * a.watts) / 1000;
    }, 0);
    return { ...a, kwh: parseFloat(kwh.toFixed(2)) };
  }).sort((a, b) => b.kwh - a.kwh), [rangeKeys, history]);

  const maxBreakdown = breakdown[0]?.kwh || 1;

  const pctLoad = Math.min(100, (totalW / LIMIT_W) * 100);
  const loadColor = pctLoad > 90 ? "#E63946" : pctLoad > 70 ? "#F4A261" : "#00A896";
  const onCount = Object.values(schedResult).filter(r => r.status === "on" || r.status === "forced").length;
  const sorted = [...APPLIANCES].sort((a, b) => {
    const aOn = schedResult[a.id]?.status === "on" || schedResult[a.id]?.status === "forced";
    const bOn = schedResult[b.id]?.status === "on" || schedResult[b.id]?.status === "forced";
    if (aOn !== bOn) return bOn ? 1 : -1;
    return a.priority - b.priority;
  });

  const TABS = [
    { id:"monitor",  label:"⚡ Monitor" },
    { id:"timeline", label:"📅 Timeline" },
    { id:"history",  label:"📊 History" },
    { id:"settings", label:"⚙️ Settings" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#060D14", fontFamily:"'Segoe UI',system-ui,sans-serif", color:"#fff" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#0A1520}
        ::-webkit-scrollbar-thumb{background:#1B2A3B;border-radius:3px}
        input[type=range]{accent-color:#00A896}
        select{outline:none} select option{background:#0D1B2A;color:#fff}
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 22px", borderBottom:"1px solid #1B2A3B",
        background:"#060D14", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <div>
            <div style={{ fontSize:14, fontWeight:800, letterSpacing:0.3 }}>HomeLoad</div>
            <div style={{ fontSize:8, color:"#3D5166", letterSpacing:1.5, textTransform:"uppercase" }}>Smart Energy Monitor</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {deferred.length > 0 && (
            <div style={{ fontSize:9, color:"#F4A261", background:"rgba(244,162,97,0.12)",
              border:"1px solid #F4A26140", borderRadius:6, padding:"3px 8px", fontWeight:700 }}>
              {deferred.length} deferred
            </div>
          )}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:15, fontWeight:800, color:loadColor, fontFamily:"monospace" }}>
              {(totalW/1000).toFixed(2)} kW
            </div>
            <div style={{ fontSize:8, color:"#3D5166" }}>LIVE LOAD</div>
          </div>
          <div style={{ fontSize:11, color:"#8BA0B4", fontFamily:"monospace" }}>{time.toLocaleTimeString()}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:2, padding:"8px 22px 0",
        background:"#060D14", borderBottom:"1px solid #1B2A3B", overflowX:"auto" }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"8px 15px", borderRadius:"9px 9px 0 0", cursor:"pointer",
            fontSize:11, fontWeight:600, whiteSpace:"nowrap",
            background: tab===t.id ? "#0A1520" : "transparent",
            color: tab===t.id ? "#00A896" : "#4A6478",
            borderTop: tab===t.id ? "2px solid #00A896" : "2px solid transparent",
            transition:"all 0.12s" }}>{t.label}</div>
        ))}
      </div>

      <div style={{ padding:"18px 22px", maxWidth:920, margin:"0 auto" }}>

        {/* ════ MONITOR ════ */}
        {tab === "monitor" && (<>
          {demoLoaded && (
            <div style={{ padding:"9px 14px", borderRadius:10, marginBottom:14,
              background:"rgba(0,168,150,0.07)", border:"1px solid #00A89630",
              fontSize:10, color:"#8BA0B4", display:"flex", gap:8, alignItems:"center" }}>
              <span>✨</span> Demo data loaded (30 days) — toggle appliances to record real usage.
            </div>
          )}

          {/* Priority mode toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:13, padding:"12px 16px", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color: priorityMode?"#00A896":"#fff", marginBottom:2 }}>
                {priorityMode ? "🧠 Priority Scheduling ON" : "🔧 Manual Mode"}
              </div>
              <div style={{ fontSize:10, color:"#3D5166" }}>
                {priorityMode
                  ? "Critical appliances run first; low-priority ones defer when limit is reached"
                  : "All toggled appliances run regardless of load limit"}
              </div>
            </div>
            <Toggle on={priorityMode} onToggle={() => setPriorityMode(p => !p)} />
          </div>

          {/* Hour slider */}
          <div style={{ background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:13, padding:"14px 18px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:10, color:"#8BA0B4" }}>Simulating hour:</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15, fontWeight:800, color:"#00A896" }}>{HOURS_LABEL[hour]}</span>
                <div onClick={() => setHour(new Date().getHours())} style={{ fontSize:8, padding:"2px 7px",
                  borderRadius:5, cursor:"pointer", background:"rgba(0,168,150,0.15)",
                  color:"#00A896", border:"1px solid #00A89630", fontWeight:700 }}>NOW</div>
              </div>
            </div>
            <input type="range" min={0} max={23} value={hour} onChange={e=>setHour(+e.target.value)} style={{width:"100%",marginBottom:5}}/>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              {["12a","2a","4a","6a","8a","10a","12p","2p","4p","6p","8p","11p"].map(t=>(
                <span key={t} style={{fontSize:7,color:"#3D5166"}}>{t}</span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {[
              { label:"Running", val:onCount, color:"#00A896", icon:"✅" },
              { label:"Deferred", val:deferred.length, color:"#F4A261", icon:"⏰" },
              { label:"Load %", val:`${pctLoad.toFixed(0)}%`, color:loadColor, icon:"⚡" },
              { label:"Now kWh", val:`${(totalW/1000).toFixed(2)}`, color:"#A78BFA", icon:"🔋" },
            ].map(s => (
              <div key={s.label} style={{ flex:1, minWidth:75, padding:"11px 12px", borderRadius:11,
                background:"#0A1520", border:`1px solid ${s.color}20`, textAlign:"center" }}>
                <div style={{fontSize:17,marginBottom:3}}>{s.icon}</div>
                <div style={{fontSize:17,fontWeight:800,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
                <div style={{fontSize:8,color:"#8BA0B4",marginTop:2,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Load bar */}
          <div style={{ background:"#0A1520", border:`1px solid ${loadColor}25`, borderRadius:13,
            padding:"14px 18px", marginBottom:14 }}>
            <WattBar used={totalW} limit={LIMIT_W} />
          </div>

          {/* Suggestions */}
          {priorityMode && suggestions.length > 0 && (
            <div style={{ padding:"12px 14px", borderRadius:11, marginBottom:14,
              background:"rgba(244,162,97,0.07)", border:"1px solid #F4A26135" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#F4A261", marginBottom:8 }}>
                💡 To unblock deferred appliances, consider turning off:
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {suggestions.map(a => (
                  <div key={a.id} onClick={() => toggleAppliance(a.id)} style={{
                    display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:8, cursor:"pointer",
                    background:"rgba(244,162,97,0.1)", border:"1px solid #F4A26140",
                    fontSize:10, color:"#F4A261", transition:"all 0.15s" }}>
                    <span>{a.icon}</span> {a.name}
                    <span style={{fontSize:9,color:"#F4A26180"}}>{a.watts}W</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority legend */}
          {priorityMode && (
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {Object.entries(PRIORITY_LABELS).map(([p, lbl]) => (
                <div key={p} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 9px",
                  borderRadius:7, background:"#0A1520", border:`1px solid ${PRIORITY_COLORS[p]}25` }}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:PRIORITY_COLORS[p]}}/>
                  <span style={{fontSize:8,color:"#8BA0B4"}}>P{p} {lbl}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize:10, color:"#3D5166", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
            Appliances
          </div>
          {sorted.map(a => (
            <ApplianceRow key={a.id} item={a} isOn={!!requested[a.id]}
              scheduleStatus={schedResult[a.id]} onToggle={() => toggleAppliance(a.id)} />
          ))}
        </>)}

        {/* ════ TIMELINE ════ */}
        {tab === "timeline" && (
          <div style={{ background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:14, padding:"20px" }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>24-Hour Appliance Schedule</div>
            <div style={{ fontSize:10, color:"#8BA0B4", marginBottom:18 }}>
              Click/drag bars to toggle hours · Use time pickers for quick range setting · Outline = current hour
            </div>
            <div style={{ display:"flex", gap:1.5, marginBottom:5, paddingLeft:192 }}>
              {["12a","","","","4a","","","","8a","","","","12p","","","","4p","","","","8p","","","11p"].map((t,i)=>(
                <div key={i} style={{flex:1,fontSize:7,color:"#3D5166",textAlign:"center"}}>{t}</div>
              ))}
            </div>
            {APPLIANCES.map(a => (
              <div key={a.id} style={{ padding:"11px 0", borderBottom:"1px solid rgba(27,42,59,0.5)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                  <div style={{width:24,textAlign:"center",fontSize:16,flexShrink:0}}>{a.icon}</div>
                  <div style={{width:158,flexShrink:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#fff"}}>{a.name}</div>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginTop:2}}>
                      <PriorityBadge priority={a.priority}/>
                      <span style={{fontSize:8,color:"#3D5166"}}>{(manualSchedule[a.id]||[]).filter(Boolean).length}h</span>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <TimelineBar applianceId={a.id}
                      schedule={manualSchedule[a.id]||Array(24).fill(false)}
                      onToggleHour={(h,v)=>toggleScheduleHour(a.id,h,v)} currentHour={hour}/>
                  </div>
                </div>
                <div style={{paddingLeft:193}}>
                  <TimeWindowEditor schedule={manualSchedule[a.id]||Array(24).fill(false)}
                    onSet={arr=>setScheduleArray(a.id,arr)}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:16,display:"flex",gap:12,flexWrap:"wrap"}}>
              {Object.entries(CAT_COLORS).map(([cat,color])=>(
                <div key={cat} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:color}}/>
                  <span style={{fontSize:8,color:"#8BA0B4",textTransform:"capitalize"}}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {tab === "history" && (<>
          {/* Range toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {[["7","Last 7 Days"],["30","Last 30 Days"]].map(([val,lbl])=>(
              <div key={val} onClick={()=>setHistoryRange(val)} style={{
                padding:"8px 20px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700,
                background: historyRange===val?"rgba(0,168,150,0.12)":"#0A1520",
                border:`2px solid ${historyRange===val?"#00A896":"#1B2A3B"}`,
                color: historyRange===val?"#00A896":"#4A6478", transition:"all 0.13s" }}>{lbl}</div>
            ))}
          </div>

          {/* Summary stats */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {[
              { label:"Total",    val:`${fmtKwh(totalKwh)} kWh`, color:"#00A896", icon:"🔋" },
              { label:"Daily avg", val:`${fmtKwh(avgKwh)} kWh`, color:"#A78BFA", icon:"📊" },
              { label:"Peak day", val: peakDay ? `${fmtKwh(peakDay.total)} kWh` : "—", color:"#F4A261", icon:"⚡" },
              { label:"Days recorded", val:activeDays.length, color:"#60A5FA", icon:"📅" },
            ].map(s=>(
              <div key={s.label} style={{flex:1,minWidth:90,padding:"11px 13px",borderRadius:11,
                background:"#0A1520",border:`1px solid ${s.color}20`,textAlign:"center"}}>
                <div style={{fontSize:17,marginBottom:3}}>{s.icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
                <div style={{fontSize:8,color:"#8BA0B4",marginTop:2,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main chart */}
          <div style={{ background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:14, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>
                  {historyRange==="7" ? "Daily Consumption — Last 7 Days" : "Daily Consumption — Last 30 Days"}
                </div>
                <div style={{fontSize:10,color:"#3D5166",marginTop:2}}>
                  Stacked by category · Hover any bar for full breakdown · Taller = more energy used
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(CAT_COLORS).map(([cat,color])=>(
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:7,height:7,borderRadius:2,background:color}}/>
                    <span style={{fontSize:8,color:"#8BA0B4",textTransform:"capitalize"}}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
            <StackedBarChart data={historyRange === "7" ? chart7 : chart30}/>
          </div>

          {/* Category breakdown */}
          {(
            <div style={{ background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:14, padding:"18px 20px", marginBottom:14 }}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Consumption by Category — {historyRange==="7"?"7 Days":"30 Days"}</div>
              <div style={{fontSize:10,color:"#3D5166",marginBottom:14}}>Total kWh per category</div>
              {(() => {
                const catTotals = {};
                chartData.forEach(d => { Object.entries(d.cats||{}).forEach(([c,v])=>{ catTotals[c]=(catTotals[c]||0)+v; }); });
                const sorted = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
                const max = sorted[0]?.[1] || 1;
                return sorted.map(([cat,kwh])=>(
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                    <div style={{width:8,height:8,borderRadius:2,background:CAT_COLORS[cat],flexShrink:0}}/>
                    <div style={{width:80,fontSize:10,fontWeight:600,color:"#8BA0B4",textTransform:"capitalize",flexShrink:0}}>{cat}</div>
                    <div style={{flex:1,background:"#060D14",borderRadius:5,height:8,overflow:"hidden"}}>
                      <div style={{height:8,borderRadius:5,width:`${(kwh/max)*100}%`,
                        background:`linear-gradient(90deg,${CAT_COLORS[cat]}80,${CAT_COLORS[cat]})`,
                        transition:"width 0.4s",minWidth:kwh>0?3:0}}/>
                    </div>
                    <div style={{width:60,textAlign:"right",fontSize:10,fontFamily:"monospace",
                      fontWeight:700,color:CAT_COLORS[cat],flexShrink:0}}>{fmtKwh(kwh)} kWh</div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Per-appliance breakdown */}
          <div style={{ background:"#0A1520", border:"1px solid #1B2A3B", borderRadius:14, padding:"18px 20px" }}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>
              By Appliance — {historyRange==="7"?"7 Days":"30 Days"}
            </div>
            <div style={{fontSize:10,color:"#3D5166",marginBottom:14}}>Sorted by total consumption · Priority shown</div>
            {breakdown.map(a => {
              const pct = maxBreakdown > 0 ? (a.kwh / maxBreakdown) * 100 : 0;
              const catColor = CAT_COLORS[a.category];
              return (
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
                  <div style={{fontSize:14,width:20,textAlign:"center",flexShrink:0}}>{a.icon}</div>
                  <div style={{width:118,flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:600,color:a.kwh>0?"#fff":"#3D5166"}}>{a.name}</div>
                    <PriorityBadge priority={a.priority}/>
                  </div>
                  <div style={{flex:1,background:"#060D14",borderRadius:5,height:9,overflow:"hidden"}}>
                    <div style={{height:9,borderRadius:5,width:`${pct}%`,
                      background:`linear-gradient(90deg,${catColor}80,${catColor})`,
                      transition:"width 0.4s",minWidth:a.kwh>0?3:0}}/>
                  </div>
                  <div style={{width:58,textAlign:"right",fontSize:10,fontFamily:"monospace",
                    fontWeight:700,color:a.kwh>0?catColor:"#3D5166",flexShrink:0}}>
                    {a.kwh.toFixed(1)} kWh
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(history).length > 0 && (
            <div style={{marginTop:14,textAlign:"right"}}>
              <div onClick={async()=>{ if(confirm("Clear all history?")){ setHistory({}); await saveHistory({}); }}}
                style={{display:"inline-block",fontSize:10,color:"#E63946",cursor:"pointer",
                  padding:"5px 13px",borderRadius:7,border:"1px solid #E6394630",background:"rgba(230,57,70,0.05)"}}>
                🗑 Clear history
              </div>
            </div>
          )}
        </>)}

        {/* ════ SETTINGS ════ */}
        {/* {tab === "settings" && (<>
          <div style={{background:"#0A1520",border:"1px solid #1B2A3B",borderRadius:13,padding:"18px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>Priority Scheduling</div>
            <div style={{fontSize:10,color:"#8BA0B4",marginBottom:14}}>
              When ON, appliances are scheduled in priority order. Critical ones always run first; optional ones defer.
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {APPLIANCES.map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 9px",borderRadius:8,
                  background:"#060D14",border:`1px solid ${PRIORITY_COLORS[a.priority]}25`}}>
                  <span style={{fontSize:13}}>{a.icon}</span>
                  <span style={{fontSize:9,color:"#8BA0B4"}}>{a.name.split("(")[0].trim()}</span>
                  <PriorityBadge priority={a.priority}/>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"#0A1520",border:"1px solid #1B2A3B",borderRadius:13,padding:"18px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>History Retention</div>
            <div style={{fontSize:10,color:"#8BA0B4",marginBottom:14}}>Days used for smart schedule predictions.</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,color:"#8BA0B4"}}>Window</span>
              <span style={{fontSize:14,fontWeight:800,color:"#00A896",fontFamily:"monospace"}}>{retentionDays} days</span>
            </div>
            <input type="range" min={7} max={30} value={retentionDays}
              onChange={e=>{const v=+e.target.value;setRetentionDays(v);saveRetention(v);}} style={{width:"100%",marginBottom:6}}/>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:8,color:"#3D5166"}}>7 days (reactive)</span>
              <span style={{fontSize:8,color:"#3D5166"}}>30 days (stable)</span>
            </div>
          </div>

          <div style={{background:"#0A1520",border:"1px solid #1B2A3B",borderRadius:13,padding:"18px"}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>Storage</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
              {[
                {label:"Days stored",val:Object.keys(history).length},
                {label:"Max days",val:"30"},
                {label:"Appliances",val:APPLIANCES.length},
                {label:"Limit",val:`${LIMIT_W/1000}kW`},
              ].map(s=>(
                <div key={s.label} style={{flex:1,minWidth:80,padding:"10px",borderRadius:9,
                  background:"#060D14",border:"1px solid #1B2A3B",textAlign:"center"}}>
                  <div style={{fontSize:15,fontWeight:800,fontFamily:"monospace",color:"#00A896"}}>{s.val}</div>
                  <div style={{fontSize:8,color:"#8BA0B4",marginTop:2,textTransform:"uppercase",letterSpacing:0.8}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>)} */}

      </div>
    </div>
  );
}