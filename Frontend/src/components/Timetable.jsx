// import { useState, useEffect } from "react";
// import { BEHAVIOUR } from "./Live";
// import { APPLIANCES } from "./Live";
// import { CAT_COLORS, HOURS_LABEL } from "./Live";

// // const APPLIANCES = [
// //     { id: "ac1", name: "AC (Bedroom)", icon: "❄️", watts: 1500, category: "comfort", canDefer: true },
// //     { id: "ac2", name: "AC (Living Room)", icon: "❄️", watts: 1800, category: "comfort", canDefer: true },
// //     { id: "geyser", name: "Geyser", icon: "🚿", watts: 2000, category: "hygiene", canDefer: true },
// //     { id: "pump", name: "Water Pump Motor", icon: "💧", watts: 750, category: "essential", canDefer: false },
// //     { id: "fridge", name: "Refrigerator", icon: "🧊", watts: 150, category: "essential", canDefer: false },
// //     { id: "washing", name: "Washing Machine", icon: "👕", watts: 500, category: "chores", canDefer: true },
// //     { id: "micro", name: "Microwave", icon: "📡", watts: 1200, category: "kitchen", canDefer: true },
// //     { id: "tv", name: "TV", icon: "📺", watts: 120, category: "leisure", canDefer: true },
// //     { id: "lights", name: "Lights (All)", icon: "💡", watts: 200, category: "essential", canDefer: false },
// //     { id: "fan", name: "Ceiling Fans (3)", icon: "🌀", watts: 210, category: "comfort", canDefer: false },
// //     { id: "computer", name: "Computer/Laptop", icon: "💻", watts: 300, category: "work", canDefer: true },
// //     { id: "iron", name: "Clothes Iron", icon: "👔", watts: 1000, category: "chores", canDefer: true },
// // ];

// // Human behaviour — which appliances are typically ON at each hour
// // const BEHAVIOUR = {
// //     ac1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
// //     ac2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
// //     geyser: [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
// //     pump: [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
// //     fridge: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
// //     washing: [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
// //     micro: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
// //     tv: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
// //     lights: [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
// //     fan: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
// //     computer: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
// //     iron: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
// // };

// const LIMIT_W = 5000; // 5000W = 5kW house limit (realistic for Indian home)

// // const CAT_COLORS = {
// //     essential: "#00A896",
// //     comfort: "#A78BFA",
// //     hygiene: "#F4A261",
// //     kitchen: "#F4D261",
// //     chores: "#60A5FA",
// //     leisure: "#F472B6",
// //     work: "#34D399",
// // };

// // const HOURS_LABEL = [
// //     "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM",
// //     "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM",
// //     "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
// // ];

// function getScheduleForHour(hour, customWindows, mode) {
//     const result = [];
//     let totalW = 0;

//     // Essential first (fridge, pump, lights, fan)
//     const essentials = APPLIANCES.filter(a => !a.canDefer);
//     const deferrable = APPLIANCES.filter(a => a.canDefer);

//     for (const a of essentials) {
//         const on = BEHAVIOUR[a.id][hour] === 1;
//         if (on) totalW += a.watts;
//         result.push({ ...a, status: on ? "ON" : "STANDBY", watt: on ? a.watts : 0, reason: on ? "Essential — always on" : "Not needed this hour" });
//     }

//     for (const a of deferrable) {
//         let shouldRun = false;
//         let reason = "";

//         if (mode === "behaviour") {
//             shouldRun = BEHAVIOUR[a.id][hour] === 1;
//             reason = shouldRun ? "Matches your daily routine" : "Outside routine hours";
//         } else if (mode === "timetable") {
//             const win = customWindows[a.id];
//             shouldRun = win ? (hour >= win.start && hour < win.end) : false;
//             reason = win
//                 ? (shouldRun ? `Scheduled ${win.start}:00–${win.end}:00` : `Outside schedule (${win.start}:00–${win.end}:00)`)
//                 : "No schedule set";
//         }

//         if (shouldRun) {
//             if (totalW + a.watts <= LIMIT_W) {
//                 totalW += a.watts;
//                 result.push({ ...a, status: "ON", watt: a.watts, reason });
//             } else {
//                 // Find next safe hour
//                 let deferTo = hour;
//                 for (let h = hour + 1; h < 24; h++) {
//                     const futureLoad = result.filter(r => r.status === "ON").reduce((s, r) => s + r.watt, 0);
//                     if (futureLoad + a.watts <= LIMIT_W) { deferTo = h; break; }
//                 }
//                 result.push({ ...a, status: "DEFERRED", watt: 0, reason: `Limit reached — deferred to ${HOURS_LABEL[deferTo] || "off-peak"}` });
//             }
//         } else {
//             result.push({ ...a, status: "OFF", watt: 0, reason });
//         }
//     }
//     return { items: result, totalW };
// }

// // Live Lode Bar
// function WattBar({ used, limit }) {
//     const pct = Math.min(100, (used / limit) * 100);
//     const color = pct > 90 ? "#E63946" : pct > 70 ? "#F4A261" : "#00A896";
//     return (
//         <div>
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                 <span style={{ fontSize: 11, color: "#8BA0B4" }}>Live Load</span>
//                 <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "monospace" }}>
//                     {(used / 1000).toFixed(2)} kW / {(limit / 1000).toFixed(1)} kW
//                 </span>
//             </div>
//             <div style={{ background: "#132030", borderRadius: 8, height: 12, position: "relative" }}>
//                 <div style={{
//                     height: 12, borderRadius: 8,
//                     width: `${pct}%`,
//                     background: `linear-gradient(90deg, #00A896, ${color})`,
//                     transition: "width 0.6s ease",
//                     boxShadow: `0 0 12px ${color}80`
//                 }} />
//                 {/* Limit marker */}
//                 <div style={{
//                     position: "absolute", right: 0, top: -4,
//                     height: 20, width: 2, background: "#E63946",
//                     borderRadius: 2
//                 }} />
//             </div>
//             <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
//                 <span style={{ fontSize: 10, color: "#3D5166" }}>0 kW</span>
//                 <span style={{ fontSize: 10, color: "#E63946" }}>⚠ Limit: {(limit / 1000).toFixed(1)} kW</span>
//             </div>
//         </div>
//     );
// }

// // Time line bar of application schedule
// function Timeline({ applianceId, mode, customWindows }) {
//     return (
//         <div style={{ display: "flex", gap: 1.5, height: 18 }}>
//             {Array.from({ length: 24 }, (_, h) => {
//                 const on = mode === "behaviour"
//                     ? BEHAVIOUR[applianceId][h] === 1
//                     : customWindows[applianceId]
//                         ? h >= customWindows[applianceId].start && h < customWindows[applianceId].end
//                         : false;
//                 const a = APPLIANCES.find(a => a.id === applianceId);
//                 const catColor = CAT_COLORS[a?.category] || "#00A896";
//                 return (
//                     <div key={h} style={{
//                         flex: 1, borderRadius: 3,
//                         background: on ? catColor : "#132030",
//                         opacity: on ? 0.85 : 0.4
//                     }} title={`${HOURS_LABEL[h]}: ${on ? "ON" : "OFF"}`} />
//                 );
//             })}
//         </div>
//     );
// }
// // time editor of application schedule
// function TimeWindowEditor({ applianceId, customWindows, setCustomWindows }) {
//     const win = customWindows[applianceId] || { start: 6, end: 8 };
//     return (
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//             <select value={win.start}
//                 onChange={e => setCustomWindows(w => ({ ...w, [applianceId]: { ...win, start: +e.target.value } }))}
//                 style={{ background: "#132030", border: "1px solid #1B2A3B", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10 }}>
//                 {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{HOURS_LABEL[h]}</option>)}
//             </select>
//             <span style={{ fontSize: 10, color: "#3D5166" }}>→</span>
//             <select value={win.end}
//                 onChange={e => setCustomWindows(w => ({ ...w, [applianceId]: { ...win, end: +e.target.value } }))}
//                 style={{ background: "#132030", border: "1px solid #1B2A3B", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10 }}>
//                 {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{HOURS_LABEL[h]}</option>)}
//             </select>
//         </div>
//     );
// }

// function Timetable() {
//     const [time, setTime] = useState(new Date());
//     const [mode, setMode] = useState("behaviour");
//     const [hour, setHour] = useState(new Date().getHours());
//     const [customWindows, setCustomWindows] = useState({
//         ac1: { start: 22, end: 6 },
//         ac2: { start: 19, end: 23 },
//         geyser: { start: 5, end: 8 },
//         pump: { start: 6, end: 8 },
//         washing: { start: 7, end: 9 },
//         micro: { start: 7, end: 8 },
//         tv: { start: 18, end: 23 },
//         computer: { start: 9, end: 17 },
//         iron: { start: 7, end: 8 },
//     });
//     const { items, totalW } = getScheduleForHour(hour, customWindows, mode);
//     const modeOptions = [
//         { id: "behaviour", label: "🧠 Smart (Behaviour)", desc: "System learns your daily routine and auto-schedules" },
//         { id: "timetable", label: "🕐 Manual Timetable", desc: "You set exact ON/OFF times for each appliance" },
//     ];

//     useEffect(() => {
//         const interval = setInterval(() => setTime(new Date()), 1000);
//         return () => clearInterval(interval);
//     }, []);

//     return (
//         <>
//             <div className="nav" style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid" }}>
//                 <div className="head" style={{ height: "5vh", fontWeight: "bold", fontSize: "20px", marginTop: "10px", cursor: "none" }}>
//                     🕐 Manual Timetable
//                 </div>
//                 <div className="time" style={{ height: "5vh", display: "flex", alignItems: "center", marginTop: "10px", cursor: "none" }}>
//                     {time.toLocaleTimeString()}
//                 </div>

//             </div>
//             <div style={{ minHeight: "100vh", background: "#060D14", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff" }}>
//                 <style>{`
//                  * { box-sizing: border-box; margin: 0; padding: 0; }
//                  ::-webkit-scrollbar { width: 5px; }
//                  ::-webkit-scrollbar-track { background: #0D1B2A; }
//                  ::-webkit-scrollbar-thumb { background: #1B2A3B; border-radius: 3px; }
//                  select { cursor: pointer; outline: none; }
//                  select option { background: #0D1B2A; color: #fff; }
//                  input[type=range] { accent-color: #00A896; }
//                 `}</style>

//                 <div style={{ padding: "20px 24px", maxWidth: 1080, margin: "0 auto" }}>

//                     {/* ── Mode Selector ── */}
//                     <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
//                         {modeOptions.map(m => (
//                             <div key={m.id} onClick={() => setMode(m.id)} style={{
//                                 flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: 14, cursor: "pointer",
//                                 background: mode === m.id ? "rgba(0,168,150,0.1)" : "#0A1520",
//                                 border: `2px solid ${mode === m.id ? "#00A896" : "#1B2A3B"}`,
//                                 transition: "all 0.2s",
//                                 boxShadow: mode === m.id ? "0 0 24px rgba(0,168,150,0.2)" : "none"
//                             }}>
//                                 <div style={{ fontSize: 14, fontWeight: 700, color: mode === m.id ? "#00A896" : "#fff", marginBottom: 6 }}>{m.label}</div>
//                                 <div style={{ fontSize: 11, color: "#8BA0B4" }}>{m.desc}</div>
//                             </div>
//                         ))}
//                     </div>
//                     {/* ── Hour Selector ── */}
//                     <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "18px 22px", marginBottom: 20 }}>
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                             <span style={{ fontSize: 12, color: "#8BA0B4" }}>Viewing schedule for:</span>
//                             <span style={{ fontSize: 18, fontWeight: 800, color: "#00A896" }}>{HOURS_LABEL[hour]}</span>
//                         </div>
//                         <input type="range" min={0} max={23} value={hour}
//                             onChange={e => setHour(+e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
//                         Hour markers
//                         <div style={{ display: "flex", justifyContent: "space-between" }}>
//                             {["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "11p"].map(t => (
//                                 <span key={t} style={{ fontSize: 9, color: "#3D5166" }}>{t}</span>
//                             ))}
//                         </div>
//                     </div>
//                     {/* ── Live Load Bar ── */}
//                     <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "18px 22px", marginBottom: 20 }}>
//                         <WattBar used={totalW} limit={LIMIT_W} />
//                     </div>
//                     {/* ── TIMELINE TAB ── */}
//                     <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "22px" }}>
//                         <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>24-Hour Appliance Schedule</div>
//                         <div style={{ fontSize: 11, color: "#8BA0B4", marginBottom: 20 }}>
//                             {mode === "timetable"
//                                 ? "Set start/end time for each appliance. Coloured bar shows active window."
//                                 : "Based on your daily behaviour pattern. Coloured = ON, Dark = OFF."}
//                         </div>

//                         {/* Hour labels */}
//                         <div style={{ display: "flex", gap: 1.5, marginBottom: 6, paddingLeft: 180 }}>
//                             {["12a", "", "", "", "4a", "", "", "", "8a", "", "", "", "12p", "", "", "", "4p", "", "", "", "8p", "", "", "11p"].map((t, i) => (
//                                 <div key={i} style={{ flex: 1, fontSize: 8, color: "#3D5166", textAlign: "center" }}>{t}</div>
//                             ))}
//                         </div>

//                         {APPLIANCES.map(a => (
//                             <div key={a.id} style={{
//                                 display: "flex", alignItems: "center", gap: 12,
//                                 padding: "10px 0", borderBottom: "1px solid rgba(27,42,59,0.5)"
//                             }}>
//                                 <div style={{ width: 28, textAlign: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
//                                 <div style={{ width: 140, flexShrink: 0 }}>
//                                     <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{a.name}</div>
//                                     <div style={{ fontSize: 10, color: "#3D5166" }}>{a.watts}W</div>
//                                 </div>
//                                 <div style={{ flex: 1 }}>
//                                     <Timeline applianceId={a.id} mode={mode} customWindows={customWindows} />
//                                 </div>
//                                 {mode === "timetable" && a.canDefer && (
//                                     <div style={{ flexShrink: 0, marginLeft: 12 }}>
//                                         <TimeWindowEditor applianceId={a.id} customWindows={customWindows} setCustomWindows={setCustomWindows} />
//                                     </div>
//                                 )}
//                                 {(!a.canDefer || mode === "behaviour") && (
//                                     <div style={{ flexShrink: 0, marginLeft: 12, fontSize: 10, color: "#3D5166", width: 120, textAlign: "right" }}>
//                                         {!a.canDefer ? "Always on schedule" : "Auto from behaviour"}
//                                     </div>
//                                 )}
//                             </div>
//                         ))}

//                         <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
//                             {Object.entries(CAT_COLORS).map(([cat, color]) => (
//                                 <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                                     <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
//                                     <span style={{ fontSize: 10, color: "#8BA0B4", textTransform: "capitalize" }}>{cat}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>


//                 </div>
//             </div>
//         </>
//     )
// }
// export default Timetable;