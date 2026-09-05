
import { useState, useEffect } from "react";

export const APPLIANCES = [
    { id: "ac1", name: "AC (Bedroom)", icon: "❄️", watts: 1500, category: "comfort", canDefer: true },
    { id: "ac2", name: "AC (Living Room)", icon: "❄️", watts: 1800, category: "comfort", canDefer: true },
    { id: "geyser", name: "Geyser", icon: "🚿", watts: 2000, category: "hygiene", canDefer: true },
    { id: "pump", name: "Water Pump Motor", icon: "💧", watts: 750, category: "essential", canDefer: false },
    { id: "fridge", name: "Refrigerator", icon: "🧊", watts: 150, category: "essential", canDefer: false },
    { id: "washing", name: "Washing Machine", icon: "👕", watts: 500, category: "chores", canDefer: true },
    { id: "micro", name: "Microwave", icon: "📡", watts: 1200, category: "kitchen", canDefer: true },
    { id: "tv", name: "TV", icon: "📺", watts: 120, category: "leisure", canDefer: true },
    { id: "lights", name: "Lights (All)", icon: "💡", watts: 200, category: "essential", canDefer: false },
    { id: "fan", name: "Ceiling Fans (3)", icon: "🌀", watts: 210, category: "comfort", canDefer: false },
    { id: "computer", name: "Computer/Laptop", icon: "💻", watts: 300, category: "work", canDefer: true },
    { id: "iron", name: "Clothes Iron", icon: "👔", watts: 1000, category: "chores", canDefer: true },
];

// Human behaviour — which appliances are typically ON at each hour
export const BEHAVIOUR = {
    //   a[   12, 1, 2, 3 ,4, 5, 6, 7, 8, 9,10,11, 12,1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11] 
    ac1:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    ac2:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    geyser:   [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pump:     [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    fridge:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    washing:  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    micro:    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    tv:       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    lights:   [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
    fan:      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    computer: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    iron:     [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const LIMIT_W = 5000; // 5000W = 5kW house limit (realistic for Indian home)

 export const CAT_COLORS = {
    essential: "#00A896",
    comfort: "#A78BFA",
    hygiene: "#F4A261",
    kitchen: "#F4D261",
    chores: "#60A5FA",
    leisure: "#F472B6",
    work: "#34D399",
};

 export const HOURS_LABEL = [
    "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM",
    "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM",
    "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
];

function getScheduleForHour(hour, customWindows, mode) {
    const result = [];
    let totalW = 0;

    // Essential first (fridge, pump, lights, fan)
    const essentials = APPLIANCES.filter(a => !a.canDefer);
    const deferrable = APPLIANCES.filter(a => a.canDefer);

    for (const a of essentials) {
        const on = BEHAVIOUR[a.id][hour] === 1;
        if (on) totalW += a.watts;
        result.push({ ...a, status: on ? "ON" : "STANDBY", watt: on ? a.watts : 0, reason: on ? "Essential — always on" : "Not needed this hour" });
    }

    for (const a of deferrable) {
        let shouldRun = false;
        let reason = "";

        if (mode === "behaviour") {
            shouldRun = BEHAVIOUR[a.id][hour] === 1;
            reason = shouldRun ? "Matches your daily routine" : "Outside routine hours";
        } else if (mode === "timetable") {
            const win = customWindows[a.id];
            shouldRun = win ? (hour >= win.start && hour < win.end) : false;
            reason = win
                ? (shouldRun ? `Scheduled ${win.start}:00–${win.end}:00` : `Outside schedule (${win.start}:00–${win.end}:00)`)
                : "No schedule set";
        }

        if (shouldRun) {
            if (totalW + a.watts <= LIMIT_W) {
                totalW += a.watts;
                result.push({ ...a, status: "ON", watt: a.watts, reason });
            } else {
                // Find next safe hour
                let deferTo = hour;
                for (let h = hour + 1; h < 24; h++) {
                    const futureLoad = result.filter(r => r.status === "ON").reduce((s, r) => s + r.watt, 0);
                    if (futureLoad + a.watts <= LIMIT_W) { deferTo = h; break; }
                }
                result.push({ ...a, status: "DEFERRED", watt: 0, reason: `Limit reached — deferred to ${HOURS_LABEL[deferTo] || "off-peak"}` });
            }
        } else {
            result.push({ ...a, status: "OFF", watt: 0, reason });
        }
    }
    return { items: result, totalW };
}

// Live Lode bar
function WattBar({ used, limit }) {
    const pct = Math.min(100, (used / limit) * 100);
    const color = pct > 90 ? "#E63946" : pct > 70 ? "#F4A261" : "#00A896";
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#8BA0B4" }}>Live Load</span>
                <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "monospace" }}>
                    {(used / 1000).toFixed(2)} kW / {(limit / 1000).toFixed(1)} kW
                </span>
            </div>
            <div style={{ background: "#132030", borderRadius: 8, height: 12, position: "relative" }}>
                <div style={{
                    height: 12, borderRadius: 8,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, #00A896, ${color})`,
                    transition: "width 0.6s ease",
                    boxShadow: `0 0 12px ${color}80`
                }} />
                {/* Limit marker */}
                <div style={{
                    position: "absolute", right: 0, top: -4,
                    height: 20, width: 2, background: "#E63946",
                    borderRadius: 2
                }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#3D5166" }}>0 kW</span>
                <span style={{ fontSize: 10, color: "#E63946" }}>⚠ Limit: {(limit / 1000).toFixed(1)} kW</span>
            </div>
        </div>
    );
}


// Time line bar of application schedule
function Timeline({ applianceId, mode, customWindows }) {
    return (
        <div style={{ display: "flex", gap: 1.5, height: 18 }}>
            {Array.from({ length: 24 }, (_, h) => {
                const on = mode === "behaviour"
                    ? BEHAVIOUR[applianceId][h] === 1
                    : customWindows[applianceId]
                        ? h >= customWindows[applianceId].start && h < customWindows[applianceId].end
                        : false;
                const a = APPLIANCES.find(a => a.id === applianceId);
                const catColor = CAT_COLORS[a?.category] || "#00A896";
                return (
                    <div key={h} style={{
                        flex: 1, borderRadius: 3,
                        background: on ? catColor : "#132030",
                        opacity: on ? 0.85 : 0.4
                    }} title={`${HOURS_LABEL[h]}: ${on ? "ON" : "OFF"}`} />
                );
            })}
        </div>
    );
}
// time editor of application schedule
function TimeWindowEditor({ applianceId, customWindows, setCustomWindows }) {
    const win = customWindows[applianceId] || { start: 6, end: 8 };
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select value={win.start}
                onChange={e => setCustomWindows(w => ({ ...w, [applianceId]: { ...win, start: +e.target.value } }))}
                style={{ background: "#132030", border: "1px solid #1B2A3B", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10 }}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{HOURS_LABEL[h]}</option>)}
            </select>
            <span style={{ fontSize: 10, color: "#3D5166" }}>→</span>
            <select value={win.end}
                onChange={e => setCustomWindows(w => ({ ...w, [applianceId]: { ...win, end: +e.target.value } }))}
                style={{ background: "#132030", border: "1px solid #1B2A3B", color: "#fff", borderRadius: 6, padding: "3px 6px", fontSize: 10 }}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{HOURS_LABEL[h]}</option>)}
            </select>
        </div>
    );
}
// Application Status
function ApplianceCard({ item }) {
    const isOn = item.status === "ON";
    const isDefer = item.status === "DEFERRED";
    const isStby = item.status === "STANDBY";
    const isOff = item.status === "OFF";

    const color = isOn ? "#00A896" : isDefer ? "#F4A261" : "#3D5166";
    const bg = isOn ? "rgba(0,168,150,0.07)" : isDefer ? "rgba(244,162,97,0.07)" : "rgba(27,42,59,0.4)";
    const badge = isOn ? "● ON" : isDefer ? "⏰ DEFER" : isStby ? "◌ STBY" : "○ OFF";
    const catColor = CAT_COLORS[item.category] || "#8BA0B4";

    return (
        <div style={{
            padding: "14px 16px", borderRadius: 14, marginBottom: 8,
            background: bg, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.3s",
            boxShadow: isOn ? `0 0 16px ${color}15` : "none",
        }}>
            <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: isOn ? `${catColor}20` : "#132030",
                border: `1px solid ${isOn ? catColor + "40" : "#1B2A3B"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, filter: isOff || isStby ? "grayscale(1) opacity(0.4)" : "none"
            }}>
                {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isOff || isStby ? "#3D5166" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                </div>
                <div style={{ fontSize: 10, color: "#3D5166", marginTop: 2, lineHeight: 1.4 }}>{item.reason}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                    fontSize: 10, fontWeight: 700, color,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    borderRadius: 6, padding: "3px 9px", marginBottom: 5, whiteSpace: "nowrap"
                }}>{badge}</div>
                  
                <div style={{ fontSize: 11, fontFamily: "monospace", color: isOn ? "#fff" : "#3D5166" }}>
                    {isOn ? `${item.watts}W` : "0 W"}
                </div>
            </div>
        </div> 
    );
}

function Live() {

    const [time, setTime] = useState(new Date());
    const [mode, setMode] = useState("behaviour");
    const [hour, setHour] = useState(new Date().getHours());
    const [tab, setTab] = useState("schedule");
    const [customWindows, setCustomWindows] = useState({
        ac1: { start: 22, end: 6 },
        ac2: { start: 19, end: 23 },
        geyser: { start: 5, end: 8 },
        pump: { start: 6, end: 8 },
        washing: { start: 7, end: 9 },
        micro: { start: 7, end: 8 },
        tv: { start: 18, end: 23 },
        computer: { start: 9, end: 17 },
        iron: { start: 7, end: 8 },
    });

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const { items, totalW } = getScheduleForHour(hour, customWindows, mode);
    const onCount = items.filter(i => i.status === "ON").length;
    const deferCount = items.filter(i => i.status === "DEFERRED").length;
    const offCount = items.filter(i => i.status === "OFF" || i.status === "STANDBY").length;
    const unitsPerDay = APPLIANCES.reduce((sum, a) => sum + (a.watts * BEHAVIOUR[a.id].filter(Boolean).length) / 1000, 0);

    return (
        <>
            <div className="nav" style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid" }}>
                <div className="head" style={{ height: "5vh", fontWeight: "bold", fontSize: "20px", marginTop: "10px", cursor: "none" }}>
                    ⚡ Live Monitor
                </div>
                <div className="time" style={{ height: "5vh", display: "flex", alignItems: "center", marginTop: "10px", cursor: "none" }}>
                    {time.toLocaleTimeString()}
                </div>

            </div>
            <div style={{ minHeight: "100vh", background: "#060D14", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff" }}>
                <div style={{ padding: "20px 24px", maxWidth: 1080, margin: "0 auto" }}>

                    {/* ── Tabs ── */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 20, background: "#0A1520", borderRadius: 12, padding: 4, width: "fit-content" }}>
                        {[
                            { id: "schedule", label: "📋 Schedule" },
                            { id: "timeline", label: "📅 Timeline" },
                            // { id: "savings", label: "💰 Savings" },
                        ].map(t => (
                            <div key={t.id} onClick={() => setTab(t.id)} style={{
                                padding: "8px 18px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600,
                                background: tab === t.id ? "#00A896" : "transparent",
                                color: tab === t.id ? "#fff" : "#8BA0B4",
                                transition: "all 0.15s",

                            }}>{t.label}</div>
                        ))}
                    </div>

                    {/* ── Hour Selector ── */}
                    <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "18px 22px", marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 12, color: "#8BA0B4" }}>Viewing schedule for:</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#00A896" }}>{HOURS_LABEL[hour]}</span>
                        </div>
                        <input type="range" min={0} max={23} value={hour}
                            onChange={e => setHour(+e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                        {/* Hour markers */}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            {["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "11p"].map(t => (
                                <span key={t} style={{ fontSize: 9, color: "#3D5166" }}>{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* ── Stats Row ── */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        {[
                            { label: "Running", val: onCount, color: "#00A896", icon: "✅" },
                            { label: "Deferred", val: deferCount, color: "#F4A261", icon: "⏰" },
                            { label: "Off", val: offCount, color: "#3D5166", icon: "○" },
                        ].map(s => (
                            <div key={s.label} style={{
                                flex: 1, minWidth: 100, padding: "14px 16px", borderRadius: 14,
                                background: "#0A1520", border: `1px solid ${s.color}25`,
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
                                <div style={{ fontSize: 10, color: "#8BA0B4", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Live Load Bar ── */}
                    <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "18px 22px", marginBottom: 20 }}>
                        <WattBar used={totalW} limit={LIMIT_W} />
                    </div>

                    {/* ── SCHEDULE TAB ── */}
                    {tab === "schedule" && (
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                            {/* Left — appliance list */}
                            <div style={{ flex: "1 1 340px" }}>
                                <div style={{ fontSize: 12, color: "#3D5166", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                                    Appliance Status at {HOURS_LABEL[hour]}
                                </div>
                                {items.map((item, i) => <ApplianceCard key={i} item={item} />)}
                            </div>
                        </div>
                    )}

                    {/* ── TIMELINE TAB ── */}
                    {tab === "timeline" && (
                        <div style={{ background: "#0A1520", border: "1px solid #1B2A3B", borderRadius: 16, padding: "22px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>24-Hour Appliance Schedule</div>
                            <div style={{ fontSize: 11, color: "#8BA0B4", marginBottom: 20 }}>
                                {mode === "timetable"
                                    ? "Set start/end time for each appliance. Coloured bar shows active window."
                                    : "Based on your daily behaviour pattern. Coloured = ON, Dark = OFF."}
                            </div>

                            {/* Hour labels */}
                            <div style={{ display: "flex", gap: 1.5, marginBottom: 6, paddingLeft: 180 }}>
                                {["12a", "", "", "", "4a", "", "", "", "8a", "", "", "", "12p", "", "", "", "4p", "", "", "", "8p", "", "", "11p"].map((t, i) => (
                                    <div key={i} style={{ flex: 1, fontSize: 8, color: "#3D5166", textAlign: "center" }}>{t}</div>
                                ))}
                            </div>

                            {APPLIANCES.map(a => (
                                <div key={a.id} style={{
                                    display: "flex", alignItems: "center", gap: 12,
                                    padding: "10px 0", borderBottom: "1px solid rgba(27,42,59,0.5)"
                                }}>
                                    <div style={{ width: 28, textAlign: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                                    <div style={{ width: 140, flexShrink: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{a.name}</div>
                                        <div style={{ fontSize: 10, color: "#3D5166" }}>{a.watts}W</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Timeline applianceId={a.id} mode={mode} customWindows={customWindows} />
                                    </div>
                                    {mode === "timetable" && a.canDefer && (
                                        <div style={{ flexShrink: 0, marginLeft: 12 }}>
                                            <TimeWindowEditor applianceId={a.id} customWindows={customWindows} setCustomWindows={setCustomWindows} />
                                        </div>
                                    )}
                                    {(!a.canDefer || mode === "behaviour") && (
                                        <div style={{ flexShrink: 0, marginLeft: 12, fontSize: 10, color: "#3D5166", width: 120, textAlign: "right" }}>
                                            {!a.canDefer ? "Always on schedule" : "Auto from behaviour"}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
                                {Object.entries(CAT_COLORS).map(([cat, color]) => (
                                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                                        <span style={{ fontSize: 10, color: "#8BA0B4", textTransform: "capitalize" }}>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </>
    )
}
export default Live;