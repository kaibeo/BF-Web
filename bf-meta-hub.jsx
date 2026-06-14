
import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const REGIONS = ["Global","Vietnam","Thailand","Indonesia","Philippines","Malaysia","Singapore","North America","Europe"];
const MODES = ["Overall","SD","1v1","1v2","2v2","Speedrun"];
const TIERS = ["S+","S","A+","A","B","C"];

const RANK_TIERS = ["LT","MT","HT","OT"];
const RANK_NUMS = [10,9,8,7,6,5,4,3,2,1];

const RANK_COLORS = {
  LT: { text:"#9CA3AF", bg:"rgba(156,163,175,0.1)", border:"rgba(156,163,175,0.3)" },
  MT: { text:"#FFFFFF", bg:"rgba(255,255,255,0.1)", border:"rgba(255,255,255,0.3)" },
  HT: { text:"#C0C0C0", bg:"rgba(192,192,192,0.12)", border:"rgba(192,192,192,0.4)" },
  OT: { text:"#FFD700", bg:"rgba(255,215,0,0.12)", border:"rgba(255,215,0,0.4)" },
};

const ALL_RANKS = RANK_NUMS.flatMap(n => RANK_TIERS.map(t => `${t}${n}`)).reverse();
// OT1 highest -> index 39, LT10 lowest -> index 0
// Actually build ascending: LT10 at 0, OT1 at 39
const RANK_LIST = [];
for(let n=10;n>=1;n--) for(const t of RANK_TIERS) RANK_LIST.push(`${t}${n}`);
// Reverse so OT1=index 39 is highest
const RANK_ORDER = Object.fromEntries(RANK_LIST.map((r,i)=>([r,i])));

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_PLAYERS = [
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

const TIER_LIST_DATA = {
  Overall: { "S+":["Kaimc","Shadow"],"S":["Dragon","Alpha"],"A+":["NightKing","ViperX"],"A":["ZeroTwo","Phoenix"],"B":["BlazeFist","IceLord"],"C":["StormBlade","Specter"] },
  SD: { "S+":["Kaimc","Dragon"],"S":["Shadow","Alpha"],"A+":["ViperX","NightKing"],"A":["Phoenix","ZeroTwo"],"B":["IceLord","BlazeFist"],"C":["Falcon","GhostWing"] },
  "1v1": { "S+":["Kaimc","Shadow"],"S":["Alpha","Dragon"],"A+":["NightKing","ViperX"],"A":["ZeroTwo","Phoenix"],"B":["BlazeFist","Specter"],"C":["IceLord","TitanX"] },
  "1v2": { "S+":["Shadow","Kaimc"],"S":["Dragon","Alpha"],"A+":["ViperX","NightKing"],"A":["Phoenix","ZeroTwo"],"B":["IceLord","BlazeFist"],"C":["Falcon","StormBlade"] },
  "2v2": { "S+":["Alpha","Kaimc"],"S":["Shadow","Dragon"],"A+":["NightKing","ZeroTwo"],"A":["ViperX","Phoenix"],"B":["BlazeFist","Specter"],"C":["GhostWing","TitanX"] },
  Speedrun: { "S+":["Dragon","Kaimc"],"S":["Shadow","NightKing"],"A+":["Alpha","ViperX"],"A":["ZeroTwo","BlazeFist"],"B":["Phoenix","IceLord"],"C":["StormBlade","Falcon"] },
};

const META_UPDATES = [
  { id:1, type:"buff", title:"Leopard Fruit", desc:"Combo damage increased by 15%. Now viable in 1v1 meta.", date:"Jun 10, 2026", icon:"⬆" },
  { id:2, type:"nerf", title:"Dragon Fruit", desc:"Z move cooldown increased from 8s to 12s. Top-tier pick impacted.", date:"Jun 10, 2026", icon:"⬇" },
  { id:3, type:"rank", title:"Ranking Reset", desc:"Season 7 begins. All OT players retain rank, HT1 players reset to HT3.", date:"Jun 8, 2026", icon:"🏆" },
  { id:4, type:"season", title:"Season 7 Launch", desc:"New region: Europe now officially tracked. New speedrun leaderboard.", date:"Jun 8, 2026", icon:"⚡" },
  { id:5, type:"buff", title:"Dough Fruit", desc:"Awakened moves reverted to pre-patch values after community feedback.", date:"Jun 5, 2026", icon:"⬆" },
  { id:6, type:"nerf", title:"Kitsune Fruit", desc:"Passive healing reduced by 20% in PvP modes.", date:"Jun 3, 2026", icon:"⬇" },
];

const MATCH_HISTORY = [
  { id:1, mode:"1v1", result:"W", opponent:"Shadow", score:"3-1", date:"2h ago" },
  { id:2, mode:"2v2", result:"W", opponent:"Dragon & Alpha", score:"3-2", date:"4h ago" },
  { id:3, mode:"1v2", result:"L", opponent:"NightKing & ViperX", score:"1-3", date:"6h ago" },
  { id:4, mode:"SD", result:"W", opponent:"ZeroTwo", score:"5-2", date:"1d ago" },
  { id:5, mode:"1v1", result:"W", opponent:"Phoenix", score:"3-0", date:"1d ago" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getRankParts(rank) {
  const tier = rank.slice(0,-1).replace(/\d+/,""); // LT, MT, HT, OT — wait
  // rank format: "OT1", "LT10", "HT2"
  const match = rank.match(/^([A-Z]+)(\d+)$/);
  if(!match) return { tier:"LT", num:10 };
  return { tier: match[1], num: parseInt(match[2]) };
}

function calcDS(scores) {
  return Math.round(
    (scores["1v1"]||0)*0.40 +
    (scores["1v2"]||0)*0.25 +
    (scores["2v2"]||0)*0.20 +
    (scores.speedrun||0)*0.15
  );
}

function getRobloxAvatarUrl(userId) {
  return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=Png`;
}

// ─── ANIMATION HOOK ──────────────────────────────────────────────────────────

function useFadeIn(delay=0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setVisible(true), delay); return ()=>clearTimeout(t); },[delay]);
  return visible;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function RankBadge({ rank, size="md" }) {
  const { tier, num } = getRankParts(rank);
  const col = RANK_COLORS[tier] || RANK_COLORS.LT;
  const sz = size==="sm" ? { fontSize:10, padding:"2px 6px" } : { fontSize:12, padding:"3px 8px" };
  return (
    <span style={{
      color: col.text,
      background: col.bg,
      border: `1px solid ${col.border}`,
      borderRadius:4,
      fontWeight:700,
      letterSpacing:"0.05em",
      fontFamily:"'JetBrains Mono',monospace",
      display:"inline-block",
      ...sz
    }}>
      {rank}
    </span>
  );
}

function Avatar({ userId, username, size=40 }) {
  const [err, setErr] = useState(false);
  const initials = username.slice(0,2).toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:"linear-gradient(135deg,#FFD700,#B8860B)",
      border:"2px solid rgba(255,215,0,0.3)",
      display:"flex",alignItems:"center",justifyContent:"center",
      overflow:"hidden", flexShrink:0, position:"relative"
    }}>
      {!err ? (
        <img
          src={getRobloxAvatarUrl(userId)}
          alt={username}
          width={size} height={size}
          style={{objectFit:"cover",position:"absolute",top:0,left:0,width:"100%",height:"100%"}}
          onError={()=>setErr(true)}
        />
      ) : (
        <span style={{color:"#000",fontWeight:800,fontSize:size*0.32}}>{initials}</span>
      )}
    </div>
  );
}

function GlassCard({ children, style={}, hover=false, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>hover&&setHov(true)}
      onMouseLeave={()=>hover&&setHov(false)}
      style={{
        background: hov ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.08)"}`,
        borderRadius:12,
        backdropFilter:"blur(10px)",
        transition:"all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        transform: hov ? "translateY(-1px)" : "none",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Skeleton({ w="100%", h=16, br=4, style={} }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:br,
      background:"linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)",
      backgroundSize:"200% 100%",
      animation:"shimmer 1.5s infinite",
      ...style
    }}/>
  );
}

function TierColor({ tier }) {
  const map = {"S+":"#FFD700","S":"#FFA500","A+":"#C0C0C0","A":"#9CA3AF","B":"#6B7280","C":"#4B5563"};
  return map[tier]||"#fff";
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

function Navbar({ page, setPage, isAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    {id:"home",label:"Rankings"},
    {id:"ds",label:"DS Rankings"},
    {id:"tierlist",label:"Tier Lists"},
    {id:"players",label:"Players"},
    {id:"meta",label:"Meta"},
    ...(isAdmin ? [{id:"admin",label:"Admin"}] : []),
  ];
  return (
    <nav style={{
      position:"sticky",top:0,zIndex:100,
      background:"rgba(0,0,0,0.92)",
      backdropFilter:"blur(20px)",
      borderBottom:"1px solid rgba(255,215,0,0.15)",
    }}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        {/* Logo */}
        <button onClick={()=>setPage("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:32,height:32,borderRadius:8,
            background:"linear-gradient(135deg,#FFD700,#B8860B)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,fontWeight:900
          }}>⚔</div>
          <span style={{color:"#FFD700",fontWeight:800,fontSize:16,letterSpacing:"-0.02em",fontFamily:"inherit"}}>
            BF META HUB
          </span>
        </button>

        {/* Desktop Nav */}
        <div style={{display:"flex",gap:4,alignItems:"center"}} className="desktop-nav">
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              background: page===item.id ? "rgba(255,215,0,0.1)" : "none",
              border: page===item.id ? "1px solid rgba(255,215,0,0.25)" : "1px solid transparent",
              borderRadius:8,
              color: page===item.id ? "#FFD700" : "rgba(255,255,255,0.65)",
              padding:"6px 14px",
              cursor:"pointer",
              fontSize:13,
              fontWeight: page===item.id ? 600 : 400,
              transition:"all 0.15s",
              fontFamily:"inherit",
              ...(item.id==="admin" ? {color:"#FFD700"} : {})
            }}>
              {item.id==="admin" ? "🔐 "+item.label : item.label}
            </button>
          ))}
        </div>

        {/* Mobile burger */}
        <button onClick={()=>setMobileOpen(o=>!o)} style={{
          background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
          color:"#fff",padding:"6px 10px",cursor:"pointer",fontSize:18,
          display:"none"
        }} className="mobile-burger">☰</button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background:"rgba(0,0,0,0.98)",borderTop:"1px solid rgba(255,215,0,0.1)",
          padding:"8px 16px 16px"
        }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{setPage(item.id);setMobileOpen(false);}} style={{
              display:"block",width:"100%",textAlign:"left",
              background: page===item.id ? "rgba(255,215,0,0.08)" : "none",
              border:"none", color: page===item.id ? "#FFD700" : "rgba(255,255,255,0.7)",
              padding:"12px 8px",cursor:"pointer",fontSize:15,fontFamily:"inherit",fontWeight: page===item.id ? 600 : 400,
              borderBottom:"1px solid rgba(255,255,255,0.05)"
            }}>
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
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        body{margin:0;background:#000;color:#fff;font-family:system-ui,-apple-system,sans-serif}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#FFD700}
        input::placeholder{color:rgba(255,255,255,0.3)}
        select option{background:#111;color:#fff}
      `}</style>
    </nav>
  );
}

// ─── HOME / LEADERBOARD ───────────────────────────────────────────────────────

function HomePage({ setPage, setSelectedPlayer }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Global");
  const [mode, setMode] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const visible = useFadeIn(50);

  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),800); return()=>clearTimeout(t); },[]);

  const filtered = useMemo(()=>{
    let p = [...MOCK_PLAYERS];
    if(region!=="Global") p=p.filter(x=>x.region===region);
    if(search) p=p.filter(x=>x.username.toLowerCase().includes(search.toLowerCase()));
    return p.sort((a,b)=>{
      if(mode==="Overall") return b.scores.overall - a.scores.overall;
      const key = mode.toLowerCase().replace("sd","sd");
      return (b.scores[key.toLowerCase()]||0)-(a.scores[key.toLowerCase()]||0);
    });
  },[search,region,mode]);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation: visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      {/* Page header */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>
            Season 7 · Live Rankings
          </span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em",color:"#fff"}}>
          Global Leaderboard
        </h1>
      </div>

      {/* Filters */}
      <GlassCard style={{padding:16,marginBottom:20}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          {/* Search */}
          <div style={{flex:"1 1 200px",position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.3)",fontSize:14}}>⌕</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search player..."
              style={{
                width:"100%",background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,
                color:"#fff",padding:"9px 12px 9px 34px",fontSize:14,outline:"none",
                fontFamily:"inherit",transition:"border 0.15s"
              }}
              onFocus={e=>e.target.style.borderColor="rgba(255,215,0,0.4)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}
            />
          </div>
          {/* Region */}
          <select value={region} onChange={e=>setRegion(e.target.value)} style={{
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",
            fontFamily:"inherit",cursor:"pointer",minWidth:130
          }}>
            {REGIONS.map(r=><option key={r}>{r}</option>)}
          </select>
          {/* Mode */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {MODES.map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{
                background: mode===m ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${mode===m ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius:6, color: mode===m ? "#FFD700" : "rgba(255,255,255,0.5)",
                padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight: mode===m ? 600 : 400,
                transition:"all 0.15s",fontFamily:"inherit"
              }}>{m}</button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Stats bar */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[["Total Players",MOCK_PLAYERS.length.toLocaleString()],["Active Region",region],["Current Mode",mode],["Season","7"]].map(([l,v])=>(
          <GlassCard key={l} style={{padding:"10px 16px",flex:"1 1 120px"}}>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{l}</div>
            <div style={{color:"#FFD700",fontWeight:700,fontSize:16}}>{v}</div>
          </GlassCard>
        ))}
      </div>

      {/* Leaderboard table */}
      <GlassCard>
        {/* Header */}
        <div style={{
          display:"grid",gridTemplateColumns:"48px 1fr 110px 100px 80px",
          gap:12, padding:"10px 16px",
          borderBottom:"1px solid rgba(255,255,255,0.06)",
          color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"
        }}>
          <span>#</span><span>Player</span><span>Region</span><span>Rank</span><span style={{textAlign:"right"}}>DS</span>
        </div>

        {loading ? (
          Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:12,alignItems:"center"}}>
              <Skeleton w={28} h={14} br={3}/>
              <Skeleton w={36} h={36} br={"50%"} style={{flexShrink:0}}/>
              <div style={{flex:1}}><Skeleton w="60%" h={14} br={3}/></div>
              <Skeleton w={80} h={14} br={3}/>
              <Skeleton w={60} h={20} br={4}/>
              <Skeleton w={50} h={14} br={3}/>
            </div>
          ))
        ) : filtered.length===0 ? (
          <div style={{padding:48,textAlign:"center",color:"rgba(255,255,255,0.3)"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔍</div>
            <div>No players found</div>
          </div>
        ) : (
          filtered.map((p,i)=>{
            const ds = calcDS(p.scores);
            const isTop3 = i<3;
            const modeKey = mode==="Overall"?"overall":mode.toLowerCase();
            const score = p.scores[modeKey]||p.scores.overall;
            return (
              <div
                key={p.id}
                onClick={()=>{ setSelectedPlayer(p); setPage("player"); }}
                style={{
                  display:"grid",gridTemplateColumns:"48px 1fr 110px 100px 80px",
                  gap:12, padding:"12px 16px",
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                  cursor:"pointer",
                  background: isTop3 ? "rgba(255,215,0,0.025)" : "transparent",
                  transition:"background 0.15s",
                  alignItems:"center",
                  animation:`fadeIn 0.3s ease ${i*0.03}s both`
                }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,215,0,0.05)"}
                onMouseLeave={e=>e.currentTarget.style.background=isTop3?"rgba(255,215,0,0.025)":"transparent"}
              >
                <span style={{
                  fontWeight:800, fontSize:14,
                  color: i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.3)",
                  fontFamily:"'JetBrains Mono',monospace"
                }}>
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
                <span style={{textAlign:"right",fontWeight:700,fontSize:14,color:"#FFD700",fontFamily:"'JetBrains Mono',monospace"}}>{ds.toLocaleString()}</span>
              </div>
            );
          })
        )}
      </GlassCard>
    </div>
  );
}

// ─── DS RANKINGS ─────────────────────────────────────────────────────────────

function DSPage({ setPage, setSelectedPlayer }) {
  const [dsRegion, setDsRegion] = useState("Global");
  const visible = useFadeIn(50);

  const sorted = useMemo(()=>{
    let p = [...MOCK_PLAYERS];
    if(dsRegion!=="Global") p=p.filter(x=>x.region===dsRegion);
    return p.sort((a,b)=>calcDS(b.scores)-calcDS(a.scores));
  },[dsRegion]);

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:3,height:20,background:"#FFD700",borderRadius:2}}/>
          <span style={{color:"rgba(255,215,0,0.7)",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>DS Formula · 1v1×40% + 1v2×25% + 2v2×20% + Speedrun×15%</span>
        </div>
        <h1 style={{margin:0,fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.03em"}}>DS Rankings</h1>
      </div>

      {/* Region tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {["Global","Vietnam","Thailand","Indonesia","Philippines"].map(r=>(
          <button key={r} onClick={()=>setDsRegion(r)} style={{
            background: dsRegion===r ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${dsRegion===r ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.08)"}`,
            borderRadius:8, color: dsRegion===r ? "#FFD700" : "rgba(255,255,255,0.5)",
            padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight: dsRegion===r ? 600 : 400,
            transition:"all 0.15s",fontFamily:"inherit"
          }}>{r}</button>
        ))}
      </div>

      {/* DS breakdown legend */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[["1v1","40%","#FFD700"],["1v2","25%","#FFA500"],["2v2","20%","#C0C0C0"],["Speedrun","15%","#9CA3AF"]].map(([l,pct,c])=>(
          <GlassCard key={l} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:28,background:c,borderRadius:2}}/>
            <div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600}}>{l}</div>
              <div style={{fontSize:18,fontWeight:700,color:c}}>{pct}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div style={{
          display:"grid",gridTemplateColumns:"48px 1fr 80px 80px 80px 80px 90px",
          gap:8,padding:"10px 16px",
          borderBottom:"1px solid rgba(255,255,255,0.06)",
          color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"
        }}>
          <span>#</span><span>Player</span><span>1v1</span><span>1v2</span><span>2v2</span><span>Speed</span><span style={{textAlign:"right"}}>DS Score</span>
        </div>
        {sorted.map((p,i)=>{
          const ds=calcDS(p.scores);
          return (
            <div key={p.id} onClick={()=>{setSelectedPlayer(p);setPage("player");}} style={{
              display:"grid",gridTemplateColumns:"48px 1fr 80px 80px 80px 80px 90px",
              gap:8,padding:"12px 16px",
              borderBottom:"1px solid rgba(255,255,255,0.04)",
              cursor:"pointer",transition:"background 0.15s",alignItems:"center",
              animation:`fadeIn 0.3s ease ${i*0.04}s both`
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,215,0,0.05)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <span style={{fontWeight:700,color:"rgba(255,255,255,0.4)",fontFamily:"monospace",fontSize:13}}>#{i+1}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar userId={p.robloxId} username={p.username} size={32}/>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{p.username}</div>
                  <RankBadge rank={p.rank} size="sm"/>
                </div>
              </div>
              {["1v1","1v2","2v2","speedrun"].map(k=>(
                <span key={k} style={{fontSize:13,color:"rgba(255,255,255,0.6)",fontFamily:"monospace"}}>{p.scores[k]||0}</span>
              ))}
              <span style={{textAlign:"right",fontWeight:800,fontSize:16,color:"#FFD700",fontFamily:"monospace"}}>{ds.toLocaleString()}</span>
            </div>
          );
        })}
      </GlassCard>
    </div>
  );
}

// ─── TIER LIST ────────────────────────────────────────────────────────────────

function TierListPage({ setPage, setSelectedPlayer }) {
  const [mode, setMode] = useState("Overall");
  const visible = useFadeIn(50);
  const data = TIER_LIST_DATA[mode]||TIER_LIST_DATA.Overall;

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

      {/* Mode selector */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {MODES.map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{
            background: mode===m ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${mode===m ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.08)"}`,
            borderRadius:8, color: mode===m ? "#FFD700" : "rgba(255,255,255,0.5)",
            padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight: mode===m ? 600 : 400,
            transition:"all 0.15s",fontFamily:"inherit"
          }}>{m}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {TIERS.map((tier,ti)=>{
          const tm = TIER_META[tier];
          const players = data[tier]||[];
          return (
            <div key={tier} style={{
              display:"flex",gap:0,borderRadius:12,overflow:"hidden",
              border:`1px solid ${tm.border}`,
              background:tm.bg,
              animation:`slideIn 0.3s ease ${ti*0.07}s both`
            }}>
              {/* Tier label */}
              <div style={{
                width:64,minHeight:64,display:"flex",alignItems:"center",justifyContent:"center",
                borderRight:`1px solid ${tm.border}`,flexShrink:0,
                background: tm.tag
              }}>
                <span style={{fontWeight:900,fontSize:22,color:tm.label}}>{tier}</span>
              </div>
              {/* Players */}
              <div style={{display:"flex",flexWrap:"wrap",gap:10,padding:"12px 16px",alignItems:"center",flex:1}}>
                {players.map(name=>{
                  const p = MOCK_PLAYERS.find(x=>x.username===name);
                  return (
                    <button key={name} onClick={()=>{if(p){setSelectedPlayer(p);setPage("player");}}} style={{
                      display:"flex",alignItems:"center",gap:8,
                      background:"rgba(0,0,0,0.3)",border:`1px solid ${tm.border}`,
                      borderRadius:8,padding:"6px 12px 6px 8px",cursor:"pointer",
                      transition:"all 0.15s",fontFamily:"inherit",color:"#fff"
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background=tm.tag;e.currentTarget.style.transform="translateY(-1px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0.3)";e.currentTarget.style.transform="none";}}
                    >
                      {p && <Avatar userId={p.robloxId} username={p.username} size={28}/>}
                      <span style={{fontWeight:600,fontSize:14,color:tm.label}}>{name}</span>
                      {p && <RankBadge rank={p.rank} size="sm"/>}
                    </button>
                  );
                })}
                {players.length===0 && <span style={{color:"rgba(255,255,255,0.2)",fontSize:13}}>No players</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PLAYERS PAGE ─────────────────────────────────────────────────────────────

function PlayersPage({ setPage, setSelectedPlayer }) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("All");
  const visible = useFadeIn(50);

  const filtered = useMemo(()=>{
    let p = [...MOCK_PLAYERS];
    if(search) p=p.filter(x=>x.username.toLowerCase().includes(search.toLowerCase()));
    if(rankFilter!=="All") {
      const tier = rankFilter;
      p=p.filter(x=>x.rank.startsWith(tier));
    }
    return p;
  },[search,rankFilter]);

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
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}
          />
        </div>
        <select value={rankFilter} onChange={e=>setRankFilter(e.target.value)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#fff",padding:"9px 12px",fontSize:14,outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
          <option value="All">All Tiers</option>
          {RANK_TIERS.map(t=><option key={t} value={t}>{t==="LT"?"LT (Gray)":t==="MT"?"MT (White)":t==="HT"?"HT (Silver)":"OT (Gold)"}</option>)}
        </select>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {filtered.map((p,i)=>{
          const ds=calcDS(p.scores);
          const {tier}=getRankParts(p.rank);
          const col=RANK_COLORS[tier];
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
      </div>
    </div>
  );
}

// ─── PLAYER PROFILE ───────────────────────────────────────────────────────────

function PlayerPage({ player, setPage }) {
  const visible = useFadeIn(50);
  const [reporting, setReporting] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportSent, setReportSent] = useState(false);

  if(!player) return (
    <div style={{padding:48,textAlign:"center"}}>
      <button onClick={()=>setPage("home")} style={{background:"none",border:"1px solid rgba(255,215,0,0.3)",borderRadius:8,color:"#FFD700",padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>← Back to Rankings</button>
    </div>
  );

  const ds=calcDS(player.scores);
  const {tier}=getRankParts(player.rank);
  const rankCol=RANK_COLORS[tier];

  const stats=[
    {label:"Overall",val:player.scores.overall},
    {label:"1v1",val:player.scores["1v1"]},
    {label:"1v2",val:player.scores["1v2"]},
    {label:"2v2",val:player.scores["2v2"]},
    {label:"Speedrun",val:player.scores.speedrun},
    {label:"SD",val:player.scores.sd},
  ];

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"24px 16px",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <button onClick={()=>setPage("home")} style={{
        background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:8,color:"rgba(255,255,255,0.6)",padding:"8px 14px",cursor:"pointer",
        fontSize:13,fontFamily:"inherit",marginBottom:20,display:"flex",alignItems:"center",gap:6
      }}>← Rankings</button>

      {/* Profile header */}
      <GlassCard style={{padding:24,marginBottom:16}}>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{position:"relative"}}>
            <Avatar userId={player.robloxId} username={player.username} size={80}/>
            <div style={{
              position:"absolute",bottom:-4,right:-4,
              background:rankCol.bg, border:`1px solid ${rankCol.border}`,
              borderRadius:6,padding:"2px 6px",fontSize:10,fontWeight:700,color:rankCol.text,
              fontFamily:"monospace"
            }}>{player.rank}</div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h2 style={{margin:"0 0 4px",fontSize:"clamp(20px,4vw,28px)",fontWeight:800,letterSpacing:"-0.02em"}}>{player.username}</h2>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:12}}>{player.region} · {player.matches.toLocaleString()} matches</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <RankBadge rank={player.rank}/>
              <span style={{
                background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.3)",
                borderRadius:4,padding:"3px 8px",fontSize:12,fontWeight:700,color:"#FFD700",fontFamily:"monospace"
              }}>DS {ds.toLocaleString()}</span>
              <span style={{
                background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:4,padding:"3px 8px",fontSize:12,color:"rgba(255,255,255,0.6)"
              }}>{player.winRate}% WR</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:16}}>
        {stats.map(({label,val})=>(
          <GlassCard key={label} style={{padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color:"#FFD700",fontFamily:"monospace"}}>{val?.toLocaleString()||"—"}</div>
          </GlassCard>
        ))}
      </div>

      {/* DS Breakdown bar */}
      <GlassCard style={{padding:16,marginBottom:16}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>DS Breakdown</div>
        {[["1v1","40%",player.scores["1v1"],9750,"#FFD700"],
          ["1v2","25%",player.scores["1v2"],9750,"#FFA500"],
          ["2v2","20%",player.scores["2v2"],9750,"#C0C0C0"],
          ["Speedrun","15%",player.scores.speedrun,9750,"#6B7280"]].map(([l,pct,val,max,color])=>(
          <div key={l} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
              <span style={{color:"rgba(255,255,255,0.6)"}}>{l} <span style={{color:"rgba(255,255,255,0.3)"}}>{pct}</span></span>
              <span style={{color:"#fff",fontFamily:"monospace",fontWeight:600}}>{val?.toLocaleString()}</span>
            </div>
            <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(val/max)*100}%`,background:color,borderRadius:3,transition:"width 0.8s ease"}}/>
            </div>
          </div>
        ))}
      </GlassCard>

      {/* Match History */}
      <GlassCard style={{marginBottom:16}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Match History
        </div>
        {MATCH_HISTORY.map((m,i)=>(
          <div key={m.id} style={{
            display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:13
          }}>
            <span style={{
              width:24,height:24,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
              background: m.result==="W" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: m.result==="W" ? "#22c55e" : "#ef4444",
              fontWeight:800,fontSize:12,flexShrink:0
            }}>{m.result}</span>
            <span style={{color:"rgba(255,215,0,0.7)",fontWeight:600,minWidth:60}}>{m.mode}</span>
            <span style={{flex:1,color:"rgba(255,255,255,0.6)"}}>vs {m.opponent}</span>
            <span style={{color:"rgba(255,255,255,0.4)",fontFamily:"monospace"}}>{m.score}</span>
            <span style={{color:"rgba(255,255,255,0.25)",fontSize:11}}>{m.date}</span>
          </div>
        ))}
      </GlassCard>

      {/* Report */}
      <GlassCard style={{padding:16}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Report Incorrect Information</div>
        {reportSent ? (
          <div style={{color:"#22c55e",fontSize:14,padding:"10px 0"}}>✓ Report submitted. Admins will review shortly.</div>
        ) : (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {["Wrong Rank","Wrong DS Score","Wrong Region","Wrong Tier Placement"].map(t=>(
              <button key={t} onClick={()=>setReportType(t)} style={{
                background: reportType===t ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${reportType===t ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:8,color: reportType===t ? "#ef4444" : "rgba(255,255,255,0.5)",
                padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit",transition:"all 0.15s"
              }}>{t}</button>
            ))}
            {reportType && (
              <button onClick={()=>setReportSent(true)} style={{
                background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",
                borderRadius:8,color:"#ef4444",padding:"7px 18px",cursor:"pointer",
                fontSize:12,fontWeight:600,fontFamily:"inherit"
              }}>Submit Report</button>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── META PAGE ────────────────────────────────────────────────────────────────

function MetaPage() {
  const visible = useFadeIn(50);
  const TYPE_META = {
    buff: { color:"#22c55e", bg:"rgba(34,197,94,0.1)", border:"rgba(34,197,94,0.25)", label:"BUFF" },
    nerf: { color:"#ef4444", bg:"rgba(239,68,68,0.1)", border:"rgba(239,68,68,0.25)", label:"NERF" },
    rank: { color:"#FFD700", bg:"rgba(255,215,0,0.1)", border:"rgba(255,215,0,0.25)", label:"RANK" },
    season: { color:"#a855f7", bg:"rgba(168,85,247,0.1)", border:"rgba(168,85,247,0.25)", label:"SEASON" },
  };

  const [filter, setFilter] = useState("all");
  const filtered = filter==="all" ? META_UPDATES : META_UPDATES.filter(x=>x.type===filter);

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
          <button key={v} onClick={()=>setFilter(v)} style={{
            background: filter===v ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${filter===v ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
            borderRadius:8,color: filter===v ? "#FFD700" : "rgba(255,255,255,0.5)",
            padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight: filter===v ? 600 : 400,
            transition:"all 0.15s",fontFamily:"inherit"
          }}>{l}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((u,i)=>{
          const tm=TYPE_META[u.type];
          return (
            <GlassCard key={u.id} style={{padding:16,animation:`fadeIn 0.3s ease ${i*0.06}s both`}}>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{
                  width:40,height:40,borderRadius:10,
                  background:tm.bg,border:`1px solid ${tm.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,flexShrink:0
                }}>{u.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{
                      background:tm.bg,border:`1px solid ${tm.border}`,
                      borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700,
                      color:tm.color,letterSpacing:"0.08em"
                    }}>{tm.label}</span>
                    <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#fff"}}>{u.title}</h3>
                    <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,0.3)"}}>{u.date}</span>
                  </div>
                  <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{u.desc}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────

function AdminPage({ isAdmin, setIsAdmin }) {
  const [tab, setTab] = useState("players");
  const visible = useFadeIn(50);

  const AUDIT_LOGS = [
    { admin:"AdminUser",action:"Updated Rank",player:"Kaimc",old:"OT2",new:"OT1",time:"2h ago" },
    { admin:"AdminUser",action:"Updated DS Score",player:"Shadow",old:"9200",new:"9550",time:"5h ago" },
    { admin:"AdminUser",action:"Tier List Edit",player:"Dragon",old:"S",new:"A+",time:"1d ago" },
    { admin:"ModUser",action:"Report Approved",player:"Alpha",old:"-",new:"Wrong Region",time:"1d ago" },
  ];

  if(!isAdmin) return (
    <div style={{maxWidth:480,margin:"80px auto",padding:"0 16px",textAlign:"center",animation:visible?"fadeIn 0.4s ease":"none",opacity:visible?1:0}}>
      <GlassCard style={{padding:40}}>
        <div style={{fontSize:40,marginBottom:16}}>🔐</div>
        <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800}}>Admin Access</h2>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,marginBottom:24}}>Sign in to access the admin panel.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setIsAdmin(true)} style={{
            background:"#5865F2",border:"none",borderRadius:10,color:"#fff",
            padding:"12px 24px",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",
            display:"flex",alignItems:"center",gap:8
          }}>
            <span>💬</span> Sign in with Discord
          </button>
          <button onClick={()=>setIsAdmin(true)} style={{
            background:"#fff",border:"none",borderRadius:10,color:"#000",
            padding:"12px 24px",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",
            display:"flex",alignItems:"center",gap:8
          }}>
            <span>🌐</span> Sign in with Google
          </button>
        </div>
      </GlassCard>
    </div>
  );

  const TABS = [["players","Players"],["tiers","Tier Lists"],["reports","Reports"],["logs","Audit Logs"]];

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
        <button onClick={()=>setIsAdmin(false)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#ef4444",padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Sign Out</button>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{
            background: tab===v ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${tab===v ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
            borderRadius:8,color: tab===v ? "#FFD700" : "rgba(255,255,255,0.5)",
            padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight: tab===v ? 600 : 400,
            transition:"all 0.15s",fontFamily:"inherit"
          }}>{l}</button>
        ))}
      </div>

      {tab==="players" && (
        <GlassCard>
          <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:12,color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            <span style={{flex:1}}>Player</span><span style={{width:90}}>Rank</span><span style={{width:80}}>DS</span><span style={{width:80}}>Actions</span>
          </div>
          {MOCK_PLAYERS.slice(0,8).map(p=>{
            const ds=calcDS(p.scores);
            return (
              <div key={p.id} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}>
                  <Avatar userId={p.robloxId} username={p.username} size={30}/>
                  <span style={{fontWeight:600,fontSize:14}}>{p.username}</span>
                </div>
                <span style={{width:90}}><RankBadge rank={p.rank} size="sm"/></span>
                <span style={{width:80,fontFamily:"monospace",color:"#FFD700",fontWeight:600}}>{ds.toLocaleString()}</span>
                <div style={{width:80,display:"flex",gap:6}}>
                  <button style={{background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,color:"#FFD700",padding:"4px 8px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Edit</button>
                </div>
              </div>
            );
          })}
        </GlassCard>
      )}

      {tab==="reports" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {player:"Kaimc",type:"Wrong Rank",reporter:"user123",time:"3h ago"},
            {player:"Alpha",type:"Wrong Region",reporter:"bf_fan99",time:"8h ago"},
            {player:"Dragon",type:"Wrong DS Score",reporter:"anon_player",time:"2d ago"},
          ].map((r,i)=>(
            <GlassCard key={i} style={{padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,color:"#fff"}}>{r.player}</span>
                  <span style={{margin:"0 8px",color:"rgba(255,255,255,0.3)"}}>·</span>
                  <span style={{color:"rgba(239,68,68,0.8)",fontSize:13}}>{r.type}</span>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Reported by {r.reporter} · {r.time}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:8,color:"#22c55e",padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Approve</button>
                  <button style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#ef4444",padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Reject</button>
                  <button style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:8,color:"#FFD700",padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Edit</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab==="tiers" && (
        <GlassCard style={{padding:20}}>
          <p style={{color:"rgba(255,255,255,0.5)",margin:0,fontSize:14}}>Drag & drop tier list editor — manage player placements across all modes and tiers.</p>
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
            {TIERS.map(tier=>(
              <div key={tier} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 14px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <span style={{fontWeight:800,fontSize:16,color:TierColor({tier}),width:32}}>{tier}</span>
                <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>{(TIER_LIST_DATA.Overall[tier]||[]).join(", ")||"Empty"}</span>
                <button style={{marginLeft:"auto",background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.2)",borderRadius:6,color:"#FFD700",padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Edit</button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {tab==="logs" && (
        <GlassCard>
          <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 80px",gap:12,color:"rgba(255,255,255,0.35)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            <span>Admin</span><span>Action</span><span>Old</span><span>New</span><span>Time</span>
          </div>
          {AUDIT_LOGS.map((l,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 80px",gap:12,padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:13,alignItems:"center"}}>
              <span style={{color:"#FFD700",fontWeight:600}}>{l.admin}</span>
              <span style={{color:"rgba(255,255,255,0.7)"}}>{l.action}</span>
              <span style={{color:"rgba(239,68,68,0.7)",fontFamily:"monospace"}}>{l.old}</span>
              <span style={{color:"rgba(34,197,94,0.7)",fontFamily:"monospace"}}>{l.new}</span>
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>{l.time}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div style={{minHeight:"100vh",background:"#000",color:"#fff",fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Subtle grid background */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:"linear-gradient(rgba(255,215,0,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.015) 1px,transparent 1px)",
        backgroundSize:"40px 40px"
      }}/>
      <div style={{position:"relative",zIndex:1}}>
        <Navbar page={page} setPage={setPage} isAdmin={isAdmin}/>
        <main>
          {page==="home" && <HomePage setPage={setPage} setSelectedPlayer={setSelectedPlayer}/>}
          {page==="ds" && <DSPage setPage={setPage} setSelectedPlayer={setSelectedPlayer}/>}
          {page==="tierlist" && <TierListPage setPage={setPage} setSelectedPlayer={setSelectedPlayer}/>}
          {page==="players" && <PlayersPage setPage={setPage} setSelectedPlayer={setSelectedPlayer}/>}
          {page==="meta" && <MetaPage/>}
          {page==="admin" && <AdminPage isAdmin={isAdmin} setIsAdmin={setIsAdmin}/>}
          {page==="player" && <PlayerPage player={selectedPlayer} setPage={setPage}/>}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop:"1px solid rgba(255,215,0,0.08)",
          padding:"20px 24px",marginTop:40,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          color:"rgba(255,255,255,0.2)",fontSize:12,flexWrap:"wrap",gap:8,
          maxWidth:1200,margin:"40px auto 0"
        }}>
          <span style={{color:"rgba(255,215,0,0.4)",fontWeight:700}}>⚔ BF META HUB</span>
          <span>Season 7 · Unofficial · Not affiliated with Roblox or Blox Fruits</span>
        </footer>
      </div>
    </div>
  );
}
