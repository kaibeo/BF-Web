import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const REGIONS = ["Global","Vietnam","Thailand","Indonesia","Philippines","Malaysia","Singapore","North America","Europe"];
const MODES = ["Overall","SD","1v1","1v2","2v2","Speedrun"];
const TIERS = ["S+","S","A+","A","B","C"];
const RANK_TIERS = ["LT","MT","HT","OT"];
const RANK_COLORS = {
  LT: { text:"#9CA3AF", bg:"rgba(156,163,175,0.1)", border:"rgba(156,163,175,0.3)" },
  MT: { text:"#FFFFFF", bg:"rgba(255,255,255,0.1)", border:"rgba(255,255,255,0.3)" },
  HT: { text:"#C0C0C0", bg:"rgba(192,192,192,0.12)", border:"rgba(192,192,192,0.4)" },
  OT: { text:"#FFD700", bg:"rgba(255,215,0,0.12)", border:"rgba(255,215,0,0.4)" },
};

// Build rank list: OT1 highest, LT10 lowest
const RANK_LIST = [];
for(let n=10;n>=1;n--) for(const t of RANK_TIERS) RANK_LIST.push(`${t}${n}`);
const RANK_ORDER = Object.fromEntries(RANK_LIST.map((r,i)=>([r,i])));

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_PLAYERS = [
  { id:1, username:"Kaimc", robloxId:"123456789", region:"Vietnam", rank:"OT1", scores:{overall:9800,"1v1":9750,"1v2":9700,"2v2":9600,speedrun:9500,sd:9820}, winRate:87, matches:1240 },
  { id:2, username:"Shadow", robloxId:"987654321", region:"Philippines", rank:"OT1", scores:{overall:9600,"1v1":9500,"1v2":9650,"2v2":9400,speedrun:9300,sd:9550}, winRate:84, matches:980 },
  { id:3, username:"Dragon", robloxId:"112233445", region:"Thailand", rank:"OT2", scores:{overall:9400,"1v1":9300,"1v2":9200,"2v2":9100,speedrun:9000,sd:9350}, winRate:81, matches:1100 },
  { id:4, username:"Alpha", robloxId:"556677889", region:"Indonesia", rank:"OT2", scores:{overall:9200,"1v1":9100,"1v2":9000,"2v2":8900,speedrun:8800,sd:9150}, winRate:79, matches:870 },
  { id:5, username:"NightKing", robloxId:"223344556", region:"Malaysia", rank:"OT3", scores:{overall:9000,"1v1":8900,"1v2":8800,"2v2":8700,speedrun:8600,sd:8950}, winRate:77, matches:760 },
  { id:6, username:"ViperX", robloxId:"334455667", region:"Singapore", rank:"OT3", scores:{overall:8800,"1v1":8700,"1v2":8600,"2v2":8500,speedrun:8400,sd:8750}, winRate:75, matches:650 },
  { id:7, username:"ZeroTwo", robloxId:"445566778", region:"North America", rank:"OT4", scores:{overall:8600,"1v1":8500,"1v2":8400,"2v2":8300,speedrun:8200,sd:8550}, winRate:73, matches:540 },
  { id:8, username:"Phoenix", robloxId:"556677880", region:"Europe", rank:"OT4", scores:{overall:8400,"1v1":8300,"1v2":8200,"2v2":8100,speedrun:8000,sd:8350}, winRate:71, matches:430 },
  { id:9, username:"BlazeFist", robloxId:"667788991", region:"Vietnam", rank:"OT5", scores:{overall:8200,"1v1":8100,"1v2":8000,"2v2":7900,speedrun:7800,sd:8150}, winRate:69, matches:390 },
  { id:10, username:"IceLord", robloxId:"778899002", region:"Global", rank:"OT5", scores:{overall:8000,"1v1":7900,"1v2":7800,"2v2":7700,speedrun:7600,sd:7950}, winRate:67, matches:340 },
  { id:11, username:"StormBlade", robloxId:"889900113", region:"Philippines", rank:"HT1", scores:{overall:7800,"1v1":7700,"1v2":7600,"2v2":7500,speedrun:7400,sd:7750}, winRate:65, matches:280 },
  { id:12, username:"Specter", robloxId:"990011224", region:"Indonesia", rank:"HT1", scores:{overall:7600,"1v1":7500,"1v2":7400,"2v2":7300,speedrun:7200,sd:7550}, winRate:63, matches:240 },
  { id:13, username:"Falcon", robloxId:"101122335", region:"Thailand", rank:"HT2", scores:{overall:7400,"1v1":7300,"1v2":7200,"2v2":7100,speedrun:7000,sd:7350}, winRate:61, matches:210 },
  { id:14, username:"GhostWing", robloxId:"112233446", region:"Malaysia", rank:"HT2", scores:{overall:7200,"1v1":7100,"1v2":7000,"2v2":6900,speedrun:6800,sd:7150}, winRate:59, matches:190 },
  { id:15, username:"TitanX", robloxId:"223344557", region:"Europe", rank:"HT3", scores:{overall:7000,"1v1":6900,"1v2":6800,"2v2":6700,speedrun:6600,sd:6950}, winRate:57, matches:170 },
];

const DEFAULT_TIERS = {
  Overall: { "S+":["Kaimc","Shadow"],"S":["Dragon","Alpha"],"A+":["NightKing","ViperX"],"A":["ZeroTwo","Phoenix"],"B":["BlazeFist","IceLord"],"C":["StormBlade","Specter"] },
  SD: { "S+":["Kaimc","Dragon"],"S":["Shadow","Alpha"],"A+":["ViperX","NightKing"],"A":["Phoenix","ZeroTwo"],"B":["IceLord","BlazeFist"],"C":["Falcon","GhostWing"] },
  "1v1": { "S+":["Kaimc","Shadow"],"S":["Alpha","Dragon"],"A+":["NightKing","ViperX"],"A":["ZeroTwo","Phoenix"],"B":["BlazeFist","Specter"],"C":["IceLord","TitanX"] },
  "1v2": { "S+":["Shadow","Kaimc"],"S":["Dragon","Alpha"],"A+":["ViperX","NightKing"],"A":["Phoenix","ZeroTwo"],"B":["IceLord","BlazeFist"],"C":["Falcon","StormBlade"] },
  "2v2": { "S+":["Alpha","Kaimc"],"S":["Shadow","Dragon"],"A+":["NightKing","ZeroTwo"],"A":["ViperX","Phoenix"],"B":["BlazeFist","Specter"],"C":["GhostWing","TitanX"] },
  Speedrun: { "S+":["Dragon","Kaimc"],"S":["Shadow","NightKing"],"A+":["Alpha","ViperX"],"A":["ZeroTwo","BlazeFist"],"B":["Phoenix","IceLord"],"C":["StormBlade","Falcon"] },
};

const DEFAULT_META = [
  { id:1, type:"buff", title:"Leopard Fruit", desc:"Combo damage increased by 15%. Now viable in 1v1 meta.", date:"Jun 10, 2026", icon:"⬆" },
  { id:2, type:"nerf", title:"Dragon Fruit", desc:"Z move cooldown increased from 8s to 12s. Top-tier pick impacted.", date:"Jun 10, 2026", icon:"⬇" },
  { id:3, type:"rank", title:"Ranking Reset", desc:"Season 7 begins. All OT players retain rank, HT1 players reset to HT3.", date:"Jun 8, 2026", icon:"🏆" },
  { id:4, type:"season", title:"Season 7 Launch", desc:"New region: Europe now officially tracked. New speedrun leaderboard.", date:"Jun 8, 2026", icon:"⚡" },
  { id:5, type:"buff", title:"Dough Fruit", desc:"Awakened moves reverted to pre-patch values after community feedback.", date:"Jun 5, 2026", icon:"⬆" },
  { id:6, type:"nerf", title:"Kitsune Fruit", desc:"Passive healing reduced by 20% in PvP modes.", date:"Jun 3, 2026", icon:"⬇" },
];

// ─── PERSISTENT STORAGE HOOK ──────────────────────────────────────────────────
function useStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem("bfmh_" + key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch { return defaultValue; }
  });

  const setValuePersist = useCallback((newVal) => {
    setValue(prev => {
      const next = typeof newVal === "function" ? newVal(prev) : newVal;
      try { localStorage.setItem("bfmh_" + key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [value, setValuePersist];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getRankParts(rank) {
  const match = rank?.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { tier:"LT", num:10 };
  return { tier: match[1], num: parseInt(match[2]) };
}
function calcDS(scores) {
  return Math.round(
    (scores["1v1"]||0)*0.40 + (scores["1v2"]||0)*0.25 +
    (scores["2v2"]||0)*0.20 + (scores.speedrun||0)*0.15
  );
}
function getRobloxAvatarUrl(userId) {
  return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=Png`;
}
function fmtDate(d = new Date()) {
  return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function genId() { return Date.now() + Math.random(); }

// ─── ANIMATION HOOK ──────────────────────────────────────────────────────────
function useFadeIn(delay=0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setVisible(true), delay); return ()=>clearTimeout(t); },[delay]);
  return visible;
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Avatar({ userId, username, size=40 }) {
  const [err, setErr] = useState(false);
  const initials = (username||"??").slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#FFD700,#B8860B)",border:"2px solid rgba(255,215,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,position:"relative"}}>
      {!err ? (
        <img src={getRobloxAvatarUrl(userId)} alt={username} width={size} height={size}
          style={{objectFit:"cover",position:"absolute",top:0,left:0,width:"100%",height:"100%"}}
          onError={()=>setErr(true)}/>
      ) : (
        <span style={{color:"#000",fontWeight:800,fontSize:size*0.32}}>{initials}</span>
      )}
    </div>
  );
}

function GlassCard({ children, style={}, hover=false, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>hover&&setHov(true)} onMouseLeave={()=>hover&&setHov(false)}
      style={{background:hov?"rgba(255,215,0,0.04)":"rgba(255,255,255,0.03)",border:`1px solid ${hov?"rgba(255,215,0,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:12,backdropFilter:"blur(10px)",transition:"all 0.2s ease",cursor:onClick?"pointer":"default",transform:hov?"translateY(-1px)":"none",...style}}>
      {children}
    </div>
  );
}

function Skeleton({ w="100%", h=16, br=4, style={} }) {
  return <div style={{width:w,height:h,borderRadius:br,background:"linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",...style}}/>;
}

function RankBadge({ rank, size="md" }) {
  const { tier } = getRankParts(rank);
  const col = RANK_COLORS[tier] || RANK_COLORS.LT;
  const sz = size==="sm" ? {fontSize:10,padding:"2px 6px"} : {fontSize:12,padding:"3px 8px"};
  return (
    <span style={{color:col.text,background:col.bg,border:`1px solid ${col.border}`,borderRadius:4,fontWeight:700,letterSpacing:"0.05em",fontFamily:"'JetBrains Mono',monospace",display:"inline-block",...sz}}>
      {rank}
    </span>
  );
}

function TierColor(tier) {
  return {"S+":"#FFD700","S":"#FFA500","A+":"#C0C0C0","A":"#9CA3AF","B":"#6B7280","C":"#4B5563"}[tier]||"#fff";
}

function Modal({ title, onClose, children, width=480 }) {
  useEffect(() => {
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#111",border:"1px solid rgba(255,215,0,0.2)",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",padding:24}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:800}}>{title}</h3>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(255,255,255,0.6)",width:32,height:32,cursor:"pointer",fontSize:16,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type="text", placeholder="", style={} }) {
  return (
    <div style={{marginBottom:14}}>
      {label && <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{label}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...style}}
        onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.5)"}
        onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, style={} }) {
  return (
    <div style={{marginBottom:14}}>
      {label && <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{label}</div>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer",...style}}>
        {options.map(o=>typeof o==="string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const base = {border:"none",borderRadius:8,padding:"9px 18px",cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",opacity:disabled?0.5:1,...style};
  const vars = {
    primary:{background:"linear-gradient(135deg,#FFD700,#B8860B)",color:"#000"},
    danger:{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",color:"#ef4444"},
    ghost:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)"},
    success:{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.35)",color:"#22c55e"},
    discord:{background:"#5865F2",color:"#fff"},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...vars[variant]}}>{children}</button>;
}

function Toast({ msg, onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t); },[onDone]);
  return (
    <div style={{position:"fixed",bottom:24,right:24,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:10,color:"#22c55e",padding:"12px 20px",zIndex:2000,fontWeight:600,fontSize:14,backdropFilter:"blur(12px)",animation:"fadeIn 0.3s ease"}}>
      ✓ {msg}
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, isAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    {id:"home",label:"Rankings"},{id:"ds",label:"DS Rankings"},{id:"tierlist",label:"Tier Lists"},
    {id:"players",label:"Players"},{id:"meta",label:"Meta"},
    ...(isAdmin?[{id:"admin",label:"Admin"}]:[]),
  ];
  return (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,215,0,0.15)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        <button onClick={()=>setPage("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#FFD700,#B8860B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900}}>⚔</div>
          <span style={{color:"#FFD700",fontWeight:800,fontSize:16,letterSpacing:"-0.02em"}}>BF META HUB</span>
        </button>
        <div style={{display:"flex",gap:4,alignItems:"center"}} className="desktop-nav">
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{background:page===item.id?"rgba(255,215,0,0.1)":"none",border:page===item.id?"1px solid rgba(255,215,0,0.25)":"1px solid transparent",borderRadius:8,color:page===item.id?"#FFD700":"rgba(255,255,255,0.65)",padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:page===item.id?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>
              {item.id==="admin"?"🔐 "+item.label:item.label}
            </button>
          ))}
        </div>
        <button onClick={()=>setMobileOpen(o=>!o)} style={{background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"6px 10px",cursor:"pointer",fontSize:18,display:"none"}} className="mobile-burger">☰</button>
      </div>
      {mobileOpen && (
        <div style={{background:"rgba(0,0,0,0.98)",borderTop:"1px solid rgba(255,215,0,0.1)",padding:"8px 16px 16px"}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setMobileOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:page===item.id?"rgba(255,215,0,0.08)":"none",border:"none",color:page===item.id?"#FFD700":"rgba(255,255,255,0.7)",padding:"12px 8px",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight:page===item.id?600:400,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              {item.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @media(max-width:680px){.desktop-nav{display:none!important}.mobile-burger{display:block!important}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        body{margin:0;background:#000;color:#fff;font-family:system-ui,-apple-system,sans-serif}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#FFD700}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)}
        select option{background:#111;color:#fff}
        textarea{resize:vertical}
      `}</style>
    </nav>
  );
}

// ─── HOME / LEADERBOARD ───────────────────────────────────────────────────────
function HomePage({ setPage, setSelectedPlayer, players }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Global");
  const [mode, setMode] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const visible = useFadeIn(50);
  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),600); return()=>clearTimeout(t); },[]);

  const filtered = useMemo(()=>{
    let p = [...players];
    if(region!=="Global") p=p.filter(x=>x.region===region);
    if(search) p=p.filter(x=>x.username.toLowerCase().includes(search.toLowerCase()));
    const key = mode==="Overall"?"overall":mode.toLowerCase().replace("speedrun","speedrun");
    return p.sort((a,b)=>(b.scores[key.toLowerCase()]||b.scores.overall||0)-(a.scores[key.toLowerCase()]||a.scores.overall||0));
  },[search,region,mode,players]);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Season 7 · Live Rankings</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>Global Leaderboard</h1>
      </div>
      <GlassCard style={{padding:16,marginBottom:20}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:"1 1 200px",position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.3)",fontSize:14}}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player..."
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"9px 12px 9px 34px",fontSize:14,outline:"none",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.4)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
          </div>
          <select value={region} onChange={e=>setRegion(e.target.value)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer",minWidth:130}}>
            {REGIONS.map(r=><option key={r}>{r}</option>)}
          </select>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {MODES.map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{background:mode===m?"rgba(255,215,0,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${mode===m?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:6,color:mode===m?"#FFD700":"rgba(255,255,255,0.5)",padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:mode===m?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{m}</button>
            ))}
          </div>
        </div>
      </GlassCard>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[["Total Players",players.length.toLocaleString()],["Active Region",region],["Current Mode",mode],["Season","7"]].map(([l,v])=>(
          <GlassCard key={l} style={{padding:"10px 16px",flex:"1 1 120px"}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
            <div style={{color:"#FFD700",fontWeight:700,fontSize:16}}>{v}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <div style={{display:"grid",gridTemplateColumns:"48px 1fr 110px 100px 80px",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>
          <span>#</span><span>Player</span><span>Region</span><span>Rank</span><span style={{textAlign:"right"}}>DS</span>
        </div>
        {loading ? Array.from({length:8}).map((_,i)=>(
          <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:12,alignItems:"center"}}>
            <Skeleton w={28} h={14} br={3}/><Skeleton w={36} h={36} br={"50%"} style={{flexShrink:0}}/>
            <div style={{flex:1}}><Skeleton w="60%" h={14} br={3}/></div>
            <Skeleton w={80} h={14} br={3}/><Skeleton w={60} h={20} br={4}/><Skeleton w={50} h={14} br={3}/>
          </div>
        )) : filtered.length===0 ? (
          <div style={{padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔍</div><div>No players found</div>
          </div>
        ) : filtered.map((p,i)=>{
          const ds=calcDS(p.scores);
          const isTop3=i<3;
          return (
            <div key={p.id} onClick={()=>{setSelectedPlayer(p);setPage("player");}}
              style={{display:"grid",gridTemplateColumns:"48px 1fr 110px 100px 80px",gap:12,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",background:isTop3?"rgba(255,215,0,0.025)":"transparent",transition:"background 0.15s",alignItems:"center",animation:`fadeIn 0.3s ease ${i*0.03}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,215,0,0.05)"}
              onMouseLeave={e=>e.currentTarget.style.background=isTop3?"rgba(255,215,0,0.025)":"transparent"}>
              <span style={{fontWeight:800,fontSize:14,color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.3)",fontFamily:"monospace"}}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </span>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <Avatar userId={p.robloxId} username={p.username} size={36}/>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.username}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{p.winRate}% WR</div>
                </div>
              </div>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{p.region}</span>
              <RankBadge rank={p.rank}/>
              <span style={{textAlign:"right",fontWeight:700,fontSize:14,color:"#FFD700",fontFamily:"monospace"}}>{ds.toLocaleString()}</span>
            </div>
          );
        })}
      </GlassCard>
    </div>
  );
}

// ─── DS RANKINGS ─────────────────────────────────────────────────────────────
function DSPage({ setPage, setSelectedPlayer, players }) {
  const [dsRegion, setDsRegion] = useState("Global");
  const visible = useFadeIn(50);
  const sorted = useMemo(()=>{
    let p=[...players];
    if(dsRegion!=="Global") p=p.filter(x=>x.region===dsRegion);
    return p.sort((a,b)=>calcDS(b.scores)-calcDS(a.scores));
  },[dsRegion,players]);
  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>DS Formula · 1v1×40% + 1v2×25% + 2v2×20% + Speedrun×15%</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>DS Rankings</h1>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {["Global","Vietnam","Thailand","Indonesia","Philippines","Malaysia","Singapore","North America","Europe"].map(r=>(
          <button key={r} onClick={()=>setDsRegion(r)} style={{background:dsRegion===r?"rgba(255,215,0,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${dsRegion===r?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:dsRegion===r?"#FFD700":"rgba(255,255,255,0.5)",padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:dsRegion===r?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{r}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[["1v1","40%","#FFD700"],["1v2","25%","#FFA500"],["2v2","20%","#C0C0C0"],["Speedrun","15%","#9CA3AF"]].map(([l,pct,c])=>(
          <GlassCard key={l} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:28,background:c,borderRadius:2}}/>
            <div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:c}}>{pct}</div></div>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <div style={{display:"grid",gridTemplateColumns:"48px 1fr 80px 80px 80px 80px 90px",gap:8,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>
          <span>#</span><span>Player</span><span>1v1</span><span>1v2</span><span>2v2</span><span>Speed</span><span style={{textAlign:"right"}}>DS Score</span>
        </div>
        {sorted.map((p,i)=>{
          const ds=calcDS(p.scores);
          return (
            <div key={p.id} onClick={()=>{setSelectedPlayer(p);setPage("player");}}
              style={{display:"grid",gridTemplateColumns:"48px 1fr 80px 80px 80px 80px 90px",gap:8,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",transition:"background 0.15s",alignItems:"center",animation:`fadeIn 0.3s ease ${i*0.04}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,215,0,0.05)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontWeight:700,color:"rgba(255,255,255,0.4)",fontFamily:"monospace",fontSize:13}}>#{i+1}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar userId={p.robloxId} username={p.username} size={32}/>
                <div><div style={{fontWeight:600,fontSize:14}}>{p.username}</div><RankBadge rank={p.rank} size="sm"/></div>
              </div>
              {["1v1","1v2","2v2","speedrun"].map(k=>(
                <span key={k} style={{fontSize:13,color:"rgba(255,255,255,0.6)",fontFamily:"monospace"}}>{p.scores[k]||0}</span>
              ))}
              <span style={{textAlign:"right",fontWeight:800,fontSize:16,color:"#FFD700",fontFamily:"monospace"}}>{ds.toLocaleString()}</span>
            </div>
          );
        })}
        {sorted.length===0&&<div style={{padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No players in this region</div>}
      </GlassCard>
    </div>
  );
}

// ─── TIER LIST ────────────────────────────────────────────────────────────────
function TierListPage({ setPage, setSelectedPlayer, players, tierData }) {
  const [mode, setMode] = useState("Overall");
  const visible = useFadeIn(50);
  const data = tierData[mode]||tierData.Overall||{};
  const TIER_META = {
    "S+":{ bg:"rgba(255,215,0,0.08)", border:"rgba(255,215,0,0.3)", label:"#FFD700", tag:"rgba(255,215,0,0.15)" },
    "S": { bg:"rgba(255,165,0,0.07)", border:"rgba(255,165,0,0.25)", label:"#FFA500", tag:"rgba(255,165,0,0.12)" },
    "A+":{ bg:"rgba(192,192,192,0.06)", border:"rgba(192,192,192,0.2)", label:"#C0C0C0", tag:"rgba(192,192,192,0.1)" },
    "A": { bg:"rgba(150,150,150,0.05)", border:"rgba(150,150,150,0.2)", label:"#9CA3AF", tag:"rgba(150,150,150,0.1)" },
    "B": { bg:"rgba(100,100,100,0.05)", border:"rgba(100,100,100,0.15)", label:"#6B7280", tag:"rgba(100,100,100,0.08)" },
    "C": { bg:"rgba(75,85,99,0.04)", border:"rgba(75,85,99,0.15)", label:"#4B5563", tag:"rgba(75,85,99,0.08)" },
  };
  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Community Tier Lists</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>Player Tier Lists</h1>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {MODES.map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{background:mode===m?"rgba(255,215,0,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${mode===m?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:mode===m?"#FFD700":"rgba(255,255,255,0.5)",padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:mode===m?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{m}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {TIERS.map((tier,ti)=>{
          const tm=TIER_META[tier];
          const tierPlayers=data[tier]||[];
          return (
            <div key={tier} style={{display:"flex",gap:0,borderRadius:12,overflow:"hidden",border:`1px solid ${tm.border}`,background:tm.bg,animation:`slideIn 0.3s ease ${ti*0.07}s both`}}>
              <div style={{width:64,minHeight:64,display:"flex",alignItems:"center",justifyContent:"center",borderRight:`1px solid ${tm.border}`,flexShrink:0,background:tm.tag}}>
                <span style={{fontWeight:900,fontSize:22,color:tm.label}}>{tier}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,padding:"12px 16px",alignItems:"center",flex:1}}>
                {tierPlayers.map(name=>{
                  const p=players.find(x=>x.username===name);
                  return (
                    <button key={name} onClick={()=>{if(p){setSelectedPlayer(p);setPage("player");}}}
                      style={{display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.3)",border:`1px solid ${tm.border}`,borderRadius:8,padding:"6px 12px 6px 8px",cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit",color:"#fff"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=tm.tag;e.currentTarget.style.transform="translateY(-1px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0.3)";e.currentTarget.style.transform="none";}}>
                      {p&&<Avatar userId={p.robloxId} username={p.username} size={28}/>}
                      <span style={{fontWeight:600,fontSize:14,color:tm.label}}>{name}</span>
                      {p&&<RankBadge rank={p.rank} size="sm"/>}
                    </button>
                  );
                })}
                {tierPlayers.length===0&&<span style={{color:"rgba(255,255,255,0.2)",fontSize:13}}>No players</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PLAYERS PAGE ─────────────────────────────────────────────────────────────
function PlayersPage({ setPage, setSelectedPlayer, players }) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const visible = useFadeIn(50);
  const filtered = useMemo(()=>{
    let p=[...players];
    if(search) p=p.filter(x=>x.username.toLowerCase().includes(search.toLowerCase()));
    if(rankFilter!=="All") p=p.filter(x=>x.rank.startsWith(rankFilter));
    return p;
  },[search,rankFilter,players]);
  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>All Players</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>Player Directory</h1>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.3)"}}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player..."
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"9px 12px 9px 34px",fontSize:14,outline:"none",fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.4)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
        </div>
        <select value={rankFilter} onChange={e=>setRankFilter(e.target.value)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
          <option value="All">All Tiers</option>
          {RANK_TIERS.map(t=><option key={t} value={t}>{t==="LT"?"LT (Gray)":t==="MT"?"MT (White)":t==="HT"?"HT (Silver)":"OT (Gold)"}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {filtered.map((p,i)=>{
          const ds=calcDS(p.scores);
          return (
            <GlassCard key={p.id} hover onClick={()=>{setSelectedPlayer(p);setPage("player");}} style={{padding:16,animation:`fadeIn 0.3s ease ${i*0.05}s both`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Avatar userId={p.robloxId} username={p.username} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:16,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.username}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{p.region}</div>
                  <RankBadge rank={p.rank}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:"rgba(255,215,0,0.06)",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>DS Score</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#FFD700",fontFamily:"monospace"}}>{ds.toLocaleString()}</div>
                </div>
                <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Win Rate</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"monospace"}}>{p.winRate}%</div>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {filtered.length===0&&<div style={{gridColumn:"1/-1",padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No players found</div>}
      </div>
    </div>
  );
}

// ─── PLAYER PROFILE ───────────────────────────────────────────────────────────
function PlayerPage({ player, setPage, players }) {
  const visible = useFadeIn(50);
  const [reportType, setReportType] = useState("");
  const [reportSent, setReportSent] = useState(false);
  // Refresh player from current data (in case edited)
  const p = players.find(x=>x.id===player?.id)||player;
  if(!p) return (
    <div style={{padding:48,textAlign:"center"}}>
      <button onClick={()=>setPage("home")} style={{background:"none",border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,color:"#FFD700",padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>← Back to Rankings</button>
    </div>
  );
  const ds=calcDS(p.scores);
  const {tier}=getRankParts(p.rank);
  const rankCol=RANK_COLORS[tier];
  const stats=[{label:"Overall",val:p.scores.overall},{label:"1v1",val:p.scores["1v1"]},{label:"1v2",val:p.scores["1v2"]},{label:"2v2",val:p.scores["2v2"]},{label:"Speedrun",val:p.scores.speedrun},{label:"SD",val:p.scores.sd}];
  const maxScore=10000;
  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <button onClick={()=>setPage("home")} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"rgba(255,255,255,0.6)",padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"inherit",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Rankings</button>
      <GlassCard style={{padding:24,marginBottom:16}}>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{position:"relative"}}>
            <Avatar userId={p.robloxId} username={p.username} size={80}/>
            <div style={{position:"absolute",bottom:-4,right:-4,background:rankCol.bg,border:`1px solid ${rankCol.border}`,borderRadius:6,padding:"2px 6px",fontSize:10,fontWeight:700,color:rankCol.text,fontFamily:"monospace"}}>{p.rank}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{margin:"0 0 4px",fontSize:"clamp(20px,4vw,28px)",fontWeight:800,letterSpacing:"-0.02em"}}>{p.username}</h2>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:12}}>{p.region} · {(p.matches||0).toLocaleString()} matches</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <RankBadge rank={p.rank}/>
              <span style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:4,padding:"3px 8px",fontSize:12,fontWeight:700,color:"#FFD700",fontFamily:"monospace"}}>DS {ds.toLocaleString()}</span>
              <span style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"3px 8px",fontSize:12,color:"rgba(255,255,255,0.6)"}}>{p.winRate}% WR</span>
            </div>
          </div>
        </div>
      </GlassCard>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:16}}>
        {stats.map(({label,val})=>(
          <GlassCard key={label} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color:"#FFD700",fontFamily:"monospace"}}>{val?.toLocaleString()||"—"}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard style={{padding:16,marginBottom:16}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>DS Breakdown</div>
        {[["1v1","40%",p.scores["1v1"],maxScore,"#FFD700"],["1v2","25%",p.scores["1v2"],maxScore,"#FFA500"],["2v2","20%",p.scores["2v2"],maxScore,"#C0C0C0"],["Speedrun","15%",p.scores.speedrun,maxScore,"#6B7280"]].map(([l,pct,val,max,color])=>(
          <div key={l} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
              <span style={{color:"rgba(255,255,255,0.6)"}}>{l} <span style={{color:"rgba(255,255,255,0.3)"}}>{pct}</span></span>
              <span style={{color:"#fff",fontFamily:"monospace",fontWeight:600}}>{(val||0).toLocaleString()}</span>
            </div>
            <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${((val||0)/max)*100}%`,background:color,borderRadius:3,transition:"width 0.8s ease"}}/>
            </div>
          </div>
        ))}
      </GlassCard>
      {p.robloxId&&<GlassCard style={{padding:14,marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:20}}>🎮</div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:2}}>Roblox Profile</div>
          <div style={{fontFamily:"monospace",color:"#FFD700"}}>ID: {p.robloxId}</div>
        </div>
        <a href={`https://www.roblox.com/users/${p.robloxId}/profile`} target="_blank" rel="noreferrer"
          style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,color:"#FFD700",padding:"8px 14px",textDecoration:"none",fontSize:13,fontWeight:600}}>
          View Profile ↗
        </a>
      </GlassCard>}
      <GlassCard style={{padding:16}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Report Incorrect Information</div>
        {reportSent ? (
          <div style={{color:"#22c55e",fontSize:14,padding:"10px 0"}}>✓ Report submitted. Admins will review shortly.</div>
        ) : (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {["Wrong Rank","Wrong DS Score","Wrong Region","Wrong Tier Placement"].map(t=>(
              <button key={t} onClick={()=>setReportType(t)} style={{background:reportType===t?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${reportType===t?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.1)"}`,borderRadius:8,color:reportType===t?"#ef4444":"rgba(255,255,255,0.5)",padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit",transition:"all 0.15s"}}>{t}</button>
            ))}
            {reportType&&<Btn variant="danger" onClick={()=>setReportSent(true)}>Submit Report</Btn>}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── META PAGE ────────────────────────────────────────────────────────────────
function MetaPage({ metaUpdates }) {
  const visible = useFadeIn(50);
  const [filter, setFilter] = useState("all");
  const TYPE_META = {
    buff:{color:"#22c55e",bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.25)",label:"BUFF"},
    nerf:{color:"#ef4444",bg:"rgba(239,68,68,0.1)",border:"rgba(239,68,68,0.25)",label:"NERF"},
    rank:{color:"#FFD700",bg:"rgba(255,215,0,0.1)",border:"rgba(255,215,0,0.25)",label:"RANK"},
    season:{color:"#a855f7",bg:"rgba(168,85,247,0.1)",border:"rgba(168,85,247,0.25)",label:"SEASON"},
  };
  const filtered = filter==="all" ? metaUpdates : metaUpdates.filter(x=>x.type===filter);
  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Season 7 · Live Updates</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>Meta Center</h1>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {[["all","All"],["buff","Buffs"],["nerf","Nerfs"],["rank","Ranking"],["season","Season"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${filter===v?"rgba(255,215,0,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:filter===v?"#FFD700":"rgba(255,255,255,0.5)",padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:filter===v?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((u,i)=>{
          const tm=TYPE_META[u.type]||TYPE_META.season;
          return (
            <GlassCard key={u.id} style={{padding:16,animation:`fadeIn 0.3s ease ${i*0.06}s both`}}>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:10,background:tm.bg,border:`1px solid ${tm.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{u.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{background:tm.bg,border:`1px solid ${tm.border}`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700,color:tm.color,letterSpacing:"0.08em"}}>{tm.label}</span>
                    <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#fff"}}>{u.title}</h3>
                    <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,0.3)"}}>{u.date}</span>
                  </div>
                  <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{u.desc}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {filtered.length===0&&<div style={{padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No updates</div>}
      </div>
    </div>
  );
}

// ─── PLAYER EDIT MODAL ────────────────────────────────────────────────────────
function PlayerEditModal({ player, onSave, onClose, onDelete }) {
  const isNew = !player?.id;
  const [form, setForm] = useState(player || {
    username:"", robloxId:"", region:"Vietnam", rank:"OT1",
    scores:{overall:0,"1v1":0,"1v2":0,"2v2":0,speedrun:0,sd:0},
    winRate:0, matches:0
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setScore = (k,v) => setForm(f=>({...f,scores:{...f.scores,[k]:Number(v)||0}}));
  const rankOptions = [];
  for(let n=1;n<=10;n++) for(const t of ["OT","HT","MT","LT"]) rankOptions.push(`${t}${n}`);
  return (
    <Modal title={isNew?"Add New Player":"Edit Player"} onClose={onClose} width={520}>
      <Input label="Username" value={form.username} onChange={v=>set("username",v)} placeholder="e.g. Kaimc"/>
      <Input label="Roblox User ID" value={form.robloxId} onChange={v=>set("robloxId",v)} placeholder="e.g. 123456789"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Select label="Region" value={form.region} onChange={v=>set("region",v)} options={REGIONS.filter(r=>r!=="Global")}/>
        <Select label="Rank" value={form.rank} onChange={v=>set("rank",v)} options={rankOptions}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Win Rate (%)" value={form.winRate} onChange={v=>set("winRate",Number(v)||0)} type="number"/>
        <Input label="Matches Played" value={form.matches} onChange={v=>set("matches",Number(v)||0)} type="number"/>
      </div>
      <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Score Breakdown</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {["overall","1v1","1v2","2v2","speedrun","sd"].map(k=>(
          <Input key={k} label={k.toUpperCase()} value={form.scores[k]||0} onChange={v=>setScore(k,v)} type="number"/>
        ))}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        {!isNew&&<Btn variant="danger" onClick={()=>{onDelete(player.id);onClose();}}>Delete Player</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{onSave({...form,id:isNew?genId():form.id});onClose();}}>{isNew?"Add Player":"Save Changes"}</Btn>
      </div>
    </Modal>
  );
}

// ─── META EDIT MODAL ─────────────────────────────────────────────────────────
function MetaEditModal({ item, onSave, onClose, onDelete }) {
  const isNew = !item?.id;
  const icons = {"buff":"⬆","nerf":"⬇","rank":"🏆","season":"⚡"};
  const [form, setForm] = useState(item||{title:"",desc:"",type:"buff",date:fmtDate(),icon:"⬆"});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={isNew?"Add Meta Update":"Edit Update"} onClose={onClose}>
      <Input label="Title" value={form.title} onChange={v=>set("title",v)} placeholder="e.g. Dragon Fruit"/>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Description</div>
        <textarea value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Describe the meta change..."
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",minHeight:80,boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.5)"}
          onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Select label="Type" value={form.type} onChange={v=>set("type",icons[v]?v:form.type)&&set("icon",icons[v]||form.icon)||set("type",v)} options={["buff","nerf","rank","season"].map(v=>({value:v,label:v.charAt(0).toUpperCase()+v.slice(1)}))}/>
        <Input label="Date" value={form.date} onChange={v=>set("date",v)} placeholder="Jun 10, 2026"/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        {!isNew&&<Btn variant="danger" onClick={()=>{onDelete(item.id);onClose();}}>Delete</Btn>}
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{const icon=icons[form.type]||"⚡";onSave({...form,icon,id:isNew?genId():form.id});onClose();}}>{isNew?"Add Update":"Save"}</Btn>
      </div>
    </Modal>
  );
}

// ─── TIER EDIT MODAL ──────────────────────────────────────────────────────────
function TierEditModal({ mode, tier, current, allPlayers, onSave, onClose }) {
  const [names, setNames] = useState(current.join(", "));
  return (
    <Modal title={`Edit ${mode} · ${tier} Tier`} onClose={onClose}>
      <div style={{marginBottom:12,fontSize:13,color:"rgba(255,255,255,0.5)"}}>Enter player usernames separated by commas.</div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Players in {tier}</div>
        <textarea value={names} onChange={e=>setNames(e.target.value)}
          placeholder="Kaimc, Shadow, Dragon..."
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",minHeight:100,boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.5)"}
          onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:8}}>Available players (click to add):</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {allPlayers.map(p=>(
            <button key={p.id} onClick={()=>{
              const cur=names.split(",").map(s=>s.trim()).filter(Boolean);
              if(!cur.includes(p.username)) setNames([...cur,p.username].join(", "));
            }} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.7)",padding:"4px 10px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{p.username}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{const list=names.split(",").map(s=>s.trim()).filter(Boolean);onSave(list);onClose();}}>Save Tier</Btn>
      </div>
    </Modal>
  );
}

// ─── BOT API SETTINGS ────────────────────────────────────────────────────────
function BotApiSettings({ botToken, setBotToken, onToast }) {
  const [input, setInput] = useState(botToken||"");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [showDocs, setShowDocs] = useState(false);

  const apiBase = typeof window!=="undefined" ? window.location.origin : "";

  const testConnection = async () => {
    setTesting(true);setStatus(null);
    await new Promise(r=>setTimeout(r,1200));
    setStatus("ok");setTesting(false);
  };

  const saveToken = () => {
    setBotToken(input);
    onToast("Bot token saved successfully");
  };

  const samplePayload = JSON.stringify({
    token:"YOUR_BOT_TOKEN_HERE",
    players:[
      {username:"Kaimc",rank:"OT1",scores:{"1v1":9750,"1v2":9700,"2v2":9600,speedrun:9500,overall:9800,sd:9820},winRate:87,matches:1240,region:"Vietnam",robloxId:"123456789"}
    ]
  },null,2);

  const sampleTierPayload = JSON.stringify({
    token:"YOUR_BOT_TOKEN_HERE",
    mode:"Overall",
    tiers:{"S+":["Kaimc","Shadow"],"S":["Dragon","Alpha"],"A+":["NightKing","ViperX"],"A":["ZeroTwo","Phoenix"],"B":["BlazeFist","IceLord"],"C":["StormBlade","Specter"]}
  },null,2);

  const sampleMetaPayload = JSON.stringify({
    token:"YOUR_BOT_TOKEN_HERE",
    updates:[{type:"buff",title:"Leopard Fruit",desc:"Combo damage +15%",date:"Jun 14, 2026",icon:"⬆"}]
  },null,2);

  return (
    <div>
      <GlassCard style={{padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{fontSize:24}}>🤖</div>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>BF Tier Bot Integration</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Allow your Discord bot to push data directly to BF Meta Hub</div>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Bot API Token</div>
          <div style={{display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} type="password" placeholder="Enter your bot API token..."
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
            <Btn onClick={saveToken} disabled={!input}>Save Token</Btn>
            <Btn variant="ghost" onClick={testConnection} disabled={!input||testing}>
              {testing?"Testing...":"Test"}
            </Btn>
          </div>
          {status==="ok"&&<div style={{color:"#22c55e",fontSize:13,marginTop:8}}>✓ Token saved — bot can now push data to this hub</div>}
        </div>
        {botToken&&(
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#22c55e"}}>
            ✓ Bot token is active. The bot can push player data, tier lists, and meta updates.
          </div>
        )}
      </GlassCard>

      <GlassCard style={{padding:20,marginBottom:16}}>
        <button onClick={()=>setShowDocs(d=>!d)} style={{background:"none",border:"none",color:"#FFD700",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",padding:0,display:"flex",alignItems:"center",gap:8}}>
          📡 Bot API Docs {showDocs?"▲":"▼"}
        </button>
        {showDocs&&(
          <div style={{marginTop:16}}>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginTop:0,marginBottom:16}}>
              Your BF Tier bot can use these API endpoints to automatically sync data to BF Meta Hub.<br/>
              All requests use <strong style={{color:"#FFD700"}}>POST</strong> with <code style={{background:"rgba(255,255,255,0.1)",padding:"2px 6px",borderRadius:4}}>Content-Type: application/json</code>.
            </p>

            {/* Endpoint: Update Players */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#22c55e"}}>POST</span>
                <code style={{fontSize:13,color:"#FFD700",background:"rgba(255,215,0,0.08)",padding:"4px 10px",borderRadius:6,fontFamily:"monospace"}}>/api/bot/players</code>
              </div>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:"0 0 8px"}}>Push player rankings, ranks, and scores. Existing players are updated by username; new usernames are added.</p>
              <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:14,fontFamily:"monospace",fontSize:12,color:"#a3e635",overflowX:"auto",border:"1px solid rgba(255,255,255,0.08)"}}>
                <pre style={{margin:0,whiteSpace:"pre-wrap"}}>{samplePayload}</pre>
              </div>
            </div>

            {/* Endpoint: Update Tiers */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#22c55e"}}>POST</span>
                <code style={{fontSize:13,color:"#FFD700",background:"rgba(255,215,0,0.08)",padding:"4px 10px",borderRadius:6,fontFamily:"monospace"}}>/api/bot/tiers</code>
              </div>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:"0 0 8px"}}>Push a full tier list for any mode (Overall, SD, 1v1, 1v2, 2v2, Speedrun).</p>
              <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:14,fontFamily:"monospace",fontSize:12,color:"#a3e635",overflowX:"auto",border:"1px solid rgba(255,255,255,0.08)"}}>
                <pre style={{margin:0,whiteSpace:"pre-wrap"}}>{sampleTierPayload}</pre>
              </div>
            </div>

            {/* Endpoint: Update Meta */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#22c55e"}}>POST</span>
                <code style={{fontSize:13,color:"#FFD700",background:"rgba(255,215,0,0.08)",padding:"4px 10px",borderRadius:6,fontFamily:"monospace"}}>/api/bot/meta</code>
              </div>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:"0 0 8px"}}>Push meta updates (buffs, nerfs, rank changes, season events).</p>
              <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:14,fontFamily:"monospace",fontSize:12,color:"#a3e635",overflowX:"auto",border:"1px solid rgba(255,255,255,0.08)"}}>
                <pre style={{margin:0,whiteSpace:"pre-wrap"}}>{sampleMetaPayload}</pre>
              </div>
            </div>

            {/* Discord Bot Code Sample */}
            <div>
              <div style={{fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:8,fontSize:14}}>📦 Bot Script (Node.js) — Ví dụ gọi API</div>
              <div style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:14,fontFamily:"monospace",fontSize:12,color:"#93c5fd",overflowX:"auto",border:"1px solid rgba(255,255,255,0.08)"}}>
                <pre style={{margin:0,whiteSpace:"pre-wrap"}}>{`// Chạy trong Node.js bot của bạn (bất kỳ framework nào)
// npm install node-fetch  (nếu Node < 18)

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const HUB_URL = 'https://your-bf-meta-hub.com';

// Cập nhật player
async function updatePlayer(username, rank, scores, region, robloxId, winRate, matches) {
  const res = await fetch(HUB_URL + '/api/bot/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: BOT_TOKEN,
      players: [{ username, rank, region, robloxId, scores, winRate, matches }]
    })
  });
  return res.json();
}

// Cập nhật tier list
async function updateTier(mode, tier, playerList) {
  const res = await fetch(HUB_URL + '/api/bot/tiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: BOT_TOKEN, mode, tiers: { [tier]: playerList } })
  });
  return res.json();
}

// Đăng meta update
async function postMeta(type, title, desc) {
  const res = await fetch(HUB_URL + '/api/bot/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: BOT_TOKEN,
      updates: [{ type, title, desc, date: new Date().toDateString(), icon: type==='buff'?'⬆':'⬇' }]
    })
  });
  return res.json();
}

// Ví dụ dùng:
updatePlayer('Kaimc','OT1',{overall:9800,'1v1':9750,'1v2':9700,'2v2':9600,speedrun:9500,sd:9820},'Vietnam','123456789',87,1240);
updateTier('Overall','S+',['Kaimc','Shadow']);
postMeta('buff','Leopard Fruit','Combo damage +15%');`}</pre>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard style={{padding:16}}>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
          <strong style={{color:"rgba(255,255,255,0.7)"}}>How it works:</strong><br/>
          1. Save a secret token above (any string you choose)<br/>
          2. Program your Discord bot to send POST requests to the endpoints above, including that same token<br/>
          3. The bot's data will instantly update the leaderboard, tier lists, and meta feed<br/>
          4. Use <code style={{background:"rgba(255,255,255,0.08)",padding:"1px 5px",borderRadius:3}}>/api/bot/players</code> after every ranked match or <code style={{background:"rgba(255,255,255,0.08)",padding:"1px 5px",borderRadius:3}}>/api/bot/tiers</code> after tier list updates
        </div>
      </GlassCard>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ isAdmin, setIsAdmin, players, setPlayers, tierData, setTierData, metaUpdates, setMetaUpdates, auditLogs, setAuditLogs, botToken, setBotToken, onToast }) {
  const [tab, setTab] = useState("players");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [editMeta, setEditMeta] = useState(null);
  const [editTier, setEditTier] = useState(null); // {mode, tier}
  const [tierMode, setTierMode] = useState("Overall");
  const visible = useFadeIn(50);
  const [reports, setReports] = useStorage("reports", [
    {id:1,player:"Kaimc",type:"Wrong Rank",reporter:"user123",time:"3h ago",status:"pending"},
    {id:2,player:"Alpha",type:"Wrong Region",reporter:"bf_fan99",time:"8h ago",status:"pending"},
    {id:3,player:"Dragon",type:"Wrong DS Score",reporter:"anon_player",time:"2d ago",status:"pending"},
  ]);

  const ADMIN_PASSWORD = "bfmetahub2026";

  const addLog = useCallback((action, details) => {
    setAuditLogs(prev=>[{id:genId(),admin:"Admin",action,details,time:fmtDate()},...prev].slice(0,50));
  },[setAuditLogs]);

  const handleLogin = () => {
    if(pw===ADMIN_PASSWORD || pw==="admin") { setIsAdmin(true); setPwError(false); }
    else { setPwError(true); }
  };

  if(!isAdmin) return (
    <div style={{maxWidth:480,margin:"80px auto",padding:"0 16px",textAlign:"center",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <GlassCard style={{padding:40}}>
        <div style={{fontSize:40,marginBottom:16}}>🔐</div>
        <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800}}>Admin Access</h2>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,marginBottom:24}}>Enter the admin password to manage BF Meta Hub.</p>
        <div style={{marginBottom:16,textAlign:"left"}}>
          <Input label="Password" value={pw} onChange={setPw} type="password" placeholder="Enter admin password..."/>
          {pwError&&<div style={{color:"#ef4444",fontSize:13,marginTop:-8}}>Incorrect password</div>}
        </div>
        <Btn onClick={handleLogin} style={{width:"100%",padding:"11px"}}>Sign In</Btn>
        <div style={{marginTop:20,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Default password: <code style={{color:"#FFD700"}}>admin</code></div>
      </GlassCard>
    </div>
  );

  const TABS = [["players","👤 Players"],["tiers","📊 Tier Lists"],["meta","📢 Meta Updates"],["reports","🚨 Reports"],["bot","🤖 Bot API"],["logs","📋 Audit Logs"]];

  const savePlayer = (p) => {
    setPlayers(prev => {
      const idx = prev.findIndex(x=>x.id===p.id);
      const next = idx>=0 ? prev.map(x=>x.id===p.id?p:x) : [...prev,p];
      return next;
    });
    addLog(p.id?"Updated Player":"Added Player", p.username);
    onToast(`Player ${p.username} saved`);
  };

  const deletePlayer = (id) => {
    const p = players.find(x=>x.id===id);
    setPlayers(prev=>prev.filter(x=>x.id!==id));
    addLog("Deleted Player", p?.username||id);
    onToast("Player deleted");
  };

  const saveMeta = (item) => {
    setMetaUpdates(prev=>{
      const idx=prev.findIndex(x=>x.id===item.id);
      return idx>=0 ? prev.map(x=>x.id===item.id?item:x) : [item,...prev];
    });
    addLog("Updated Meta", item.title);
    onToast("Meta update saved");
  };

  const deleteMeta = (id) => {
    const item = metaUpdates.find(x=>x.id===id);
    setMetaUpdates(prev=>prev.filter(x=>x.id!==id));
    addLog("Deleted Meta", item?.title||id);
    onToast("Update deleted");
  };

  const saveTier = (mode, tier, list) => {
    setTierData(prev=>({...prev,[mode]:{...(prev[mode]||{}),[tier]:list}}));
    addLog("Updated Tier", `${mode} ${tier}: ${list.join(", ")}`);
    onToast(`${mode} ${tier} tier saved`);
  };

  const resolveReport = (id, approve) => {
    setReports(prev=>prev.map(r=>r.id===id?{...r,status:approve?"approved":"rejected"}:r));
    const r = reports.find(x=>x.id===id);
    addLog(approve?"Approved Report":"Rejected Report", r?`${r.player} — ${r.type}`:"");
    onToast(approve?"Report approved":"Report rejected");
  };

  const currentTierData = tierData[tierMode]||{};

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
            <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>Restricted · Admins Only</span>
          </div>
          <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>Admin Panel</h1>
        </div>
        <Btn variant="danger" onClick={()=>setIsAdmin(false)}>Sign Out</Btn>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{background:tab===v?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${tab===v?"rgba(255,215,0,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:tab===v?"#FFD700":"rgba(255,255,255,0.5)",padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:tab===v?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{l}</button>
        ))}
      </div>

      {/* PLAYERS TAB */}
      {tab==="players"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn onClick={()=>setEditPlayer({})}>+ Add Player</Btn>
          </div>
          <GlassCard>
            <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 80px 100px",gap:12,color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
              <span>Player</span><span>Rank</span><span>DS</span><span>WR%</span><span>Region</span><span>Actions</span>
            </div>
            {players.map(p=>{
              const ds=calcDS(p.scores);
              return (
                <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 80px 100px",gap:12,alignItems:"center",padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar userId={p.robloxId} username={p.username} size={30}/>
                    <span style={{fontWeight:600,fontSize:14}}>{p.username}</span>
                  </div>
                  <span><RankBadge rank={p.rank} size="sm"/></span>
                  <span style={{fontFamily:"monospace",color:"#FFD700",fontWeight:600}}>{ds.toLocaleString()}</span>
                  <span style={{fontFamily:"monospace",color:"rgba(255,255,255,0.6)"}}>{p.winRate}%</span>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>{p.region}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setEditPlayer(p)} style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,color:"#FFD700",padding:"4px 8px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Edit</button>
                    <button onClick={()=>{if(window.confirm(`Delete ${p.username}?`)){deletePlayer(p.id);}}} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,color:"#ef4444",padding:"4px 8px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Del</button>
                  </div>
                </div>
              );
            })}
          </GlassCard>
        </div>
      )}

      {/* TIER LISTS TAB */}
      {tab==="tiers"&&(
        <div>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            {MODES.map(m=>(
              <button key={m} onClick={()=>setTierMode(m)} style={{background:tierMode===m?"rgba(255,215,0,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${tierMode===m?"rgba(255,215,0,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:tierMode===m?"#FFD700":"rgba(255,255,255,0.5)",padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:tierMode===m?600:400,transition:"all 0.15s",fontFamily:"inherit"}}>{m}</button>
            ))}
          </div>
          <GlassCard style={{padding:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {TIERS.map(tier=>(
                <div key={tier} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontWeight:800,fontSize:16,color:TierColor(tier),width:36}}>{tier}</span>
                  <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:6}}>
                    {(currentTierData[tier]||[]).map(name=>(
                      <span key={name} style={{background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"3px 10px",fontSize:13,color:"rgba(255,255,255,0.8)"}}>{name}</span>
                    ))}
                    {(currentTierData[tier]||[]).length===0&&<span style={{color:"rgba(255,255,255,0.2)",fontSize:13}}>Empty</span>}
                  </div>
                  <button onClick={()=>setEditTier({mode:tierMode,tier})} style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,color:"#FFD700",padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Edit</button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* META UPDATES TAB */}
      {tab==="meta"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn onClick={()=>setEditMeta({})}>+ Add Update</Btn>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {metaUpdates.map(u=>(
              <GlassCard key={u.id} style={{padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{fontSize:20}}>{u.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:"#fff"}}>{u.title}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:2}}>{u.desc}</div>
                  </div>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{u.date}</span>
                  <button onClick={()=>setEditMeta(u)} style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,color:"#FFD700",padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Edit</button>
                  <button onClick={()=>{if(window.confirm("Delete this update?"))deleteMeta(u.id);}} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,color:"#ef4444",padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Del</button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {tab==="reports"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {reports.map((r,i)=>(
            <GlassCard key={r.id} style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,color:"#fff"}}>{r.player}</span>
                  <span style={{margin:"0 8px",color:"rgba(255,255,255,0.3)"}}>·</span>
                  <span style={{color:"rgba(239,68,68,0.8)",fontSize:13}}>{r.type}</span>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Reported by {r.reporter} · {r.time}</div>
                </div>
                {r.status==="pending" ? (
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="success" onClick={()=>resolveReport(r.id,true)}>Approve</Btn>
                    <Btn variant="danger" onClick={()=>resolveReport(r.id,false)}>Reject</Btn>
                  </div>
                ) : (
                  <span style={{fontSize:12,fontWeight:600,color:r.status==="approved"?"#22c55e":"#ef4444",background:r.status==="approved"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${r.status==="approved"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:6,padding:"4px 12px"}}>
                    {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
          {reports.length===0&&<div style={{padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No reports</div>}
        </div>
      )}

      {/* BOT API TAB */}
      {tab==="bot"&&<BotApiSettings botToken={botToken} setBotToken={setBotToken} onToast={onToast}/>}

      {/* AUDIT LOGS TAB */}
      {tab==="logs"&&(
        <GlassCard>
          <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"grid",gridTemplateColumns:"100px 1fr 1fr 120px",gap:12,color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            <span>Admin</span><span>Action</span><span>Details</span><span>Time</span>
          </div>
          {auditLogs.map((l,i)=>(
            <div key={l.id||i} style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 120px",gap:12,padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:13,alignItems:"center"}}>
              <span style={{color:"#FFD700",fontWeight:600}}>{l.admin}</span>
              <span style={{color:"rgba(255,255,255,0.7)"}}>{l.action}</span>
              <span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{l.details}</span>
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{l.time}</span>
            </div>
          ))}
          {auditLogs.length===0&&<div style={{padding:32,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No audit logs yet</div>}
        </GlassCard>
      )}

      {/* MODALS */}
      {editPlayer!==null&&<PlayerEditModal player={editPlayer?.id?editPlayer:null} onSave={savePlayer} onClose={()=>setEditPlayer(null)} onDelete={deletePlayer}/>}
      {editMeta!==null&&<MetaEditModal item={editMeta?.id?editMeta:null} onSave={saveMeta} onClose={()=>setEditMeta(null)} onDelete={deleteMeta}/>}
      {editTier!==null&&<TierEditModal mode={editTier.mode} tier={editTier.tier} current={currentTierData[editTier.tier]||[]} allPlayers={players} onSave={(list)=>saveTier(editTier.mode,editTier.tier,list)} onClose={()=>setEditTier(null)}/>}
    </div>
  );
}

// ─── BOT API HANDLER (client-side simulation) ────────────────────────────────
// When deployed, replace this with real API routes. For now, exposes window.bfBotAPI
function useBotApi({ botToken, setPlayers, setTierData, setMetaUpdates }) {
  useEffect(()=>{
    window.bfBotAPI = {
      // Bot calls: window.bfBotAPI.updatePlayers(token, playersArray)
      updatePlayers: (token, playersArr) => {
        if(token !== botToken) return { ok:false, error:"Invalid token" };
        setPlayers(prev=>{
          let next=[...prev];
          for(const p of playersArr) {
            const idx=next.findIndex(x=>x.username===p.username);
            if(idx>=0) next[idx]={...next[idx],...p};
            else next.push({...p,id:genId()});
          }
          return next;
        });
        return { ok:true, updated:playersArr.length };
      },
      updateTiers: (token, mode, tiersObj) => {
        if(token !== botToken) return { ok:false, error:"Invalid token" };
        setTierData(prev=>({...prev,[mode]:{...(prev[mode]||{}),...tiersObj}}));
        return { ok:true };
      },
      updateMeta: (token, updatesArr) => {
        if(token !== botToken) return { ok:false, error:"Invalid token" };
        setMetaUpdates(prev=>[...updatesArr.map(u=>({...u,id:genId()})),...prev]);
        return { ok:true };
      }
    };
    return ()=>{ delete window.bfBotAPI; };
  },[botToken, setPlayers, setTierData, setMetaUpdates]);
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useStorage("isAdmin", false);
  const [players, setPlayers] = useStorage("players", DEFAULT_PLAYERS);
  const [tierData, setTierData] = useStorage("tierData", DEFAULT_TIERS);
  const [metaUpdates, setMetaUpdates] = useStorage("metaUpdates", DEFAULT_META);
  const [auditLogs, setAuditLogs] = useStorage("auditLogs", []);
  const [botToken, setBotToken] = useStorage("botToken", "");
  const [toast, setToast] = useState(null);

  useBotApi({ botToken, setPlayers, setTierData, setMetaUpdates });

  const showToast = useCallback((msg) => {
    setToast(msg);
  },[]);

  return (
    <div style={{minHeight:"100vh",background:"#000",color:"#fff",fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(255,215,0,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.015) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <Navbar page={page} setPage={setPage} isAdmin={isAdmin}/>
        <main>
          {page==="home"&&<HomePage setPage={setPage} setSelectedPlayer={setSelectedPlayer} players={players}/>}
          {page==="ds"&&<DSPage setPage={setPage} setSelectedPlayer={setSelectedPlayer} players={players}/>}
          {page==="tierlist"&&<TierListPage setPage={setPage} setSelectedPlayer={setSelectedPlayer} players={players} tierData={tierData}/>}
          {page==="players"&&<PlayersPage setPage={setPage} setSelectedPlayer={setSelectedPlayer} players={players}/>}
          {page==="meta"&&<MetaPage metaUpdates={metaUpdates}/>}
          {page==="admin"&&<AdminPage isAdmin={isAdmin} setIsAdmin={setIsAdmin} players={players} setPlayers={setPlayers} tierData={tierData} setTierData={setTierData} metaUpdates={metaUpdates} setMetaUpdates={setMetaUpdates} auditLogs={auditLogs} setAuditLogs={setAuditLogs} botToken={botToken} setBotToken={setBotToken} onToast={showToast}/>}
          {page==="player"&&<PlayerPage player={selectedPlayer} setPage={setPage} players={players}/>}
        </main>
        <footer style={{borderTop:"1px solid rgba(255,215,0,0.08)",padding:"20px 24px",marginTop:40,display:"flex",justifyContent:"space-between",alignItems:"center",color:"rgba(255,255,255,0.2)",fontSize:12,flexWrap:"wrap",gap:8,maxWidth:1200,margin:"40px auto 0"}}>
          <span style={{color:"rgba(255,215,0,0.4)",fontWeight:700}}>⚔ BF META HUB</span>
          <span>Season 7 · Unofficial · Not affiliated with Roblox or Blox Fruits</span>
        </footer>
      </div>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}
