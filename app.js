/* =====================================================================
   Little Bites — app logic (v2)
   WEEK-BASED calendar plan + meal planner, Fridge/Pantry suggestions,
   summarized log, "try next by food group", nutrition facts + filter.
   Keeps: timestamped checks (who & when), Google Sheets sync.
   ===================================================================== */

const LS_KEY = "littleBites.v1";   // same key; we migrate old shape in-place

const DEFAULT_STATE = {
  v: 2,
  baby: { name:"Baby", parents:["Parent 1","Parent 2"] },
  activeParent: "Parent 1",
  startDateISO: todayISO(),         // Monday-anchored week 1 start
  weeks: [],                        // [{n, foods:[name...], intros:{name:{days,checks,reactions,introduced,emoji,isAllergen,startedISO}}}]
  activeWeek: 1,
  pantry: [],                       // raw ingredient strings the user typed
  cloud: { url:"", lastSync:"" },
  settings: { disclaimerDismissed:false }
};

let S = loadLocal();
migrate();

/* ---------------- date helpers ---------------- */
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function mondayOf(iso){
  const d = new Date(iso); const dow = (d.getDay()+6)%7; // 0=Mon
  d.setDate(d.getDate()-dow); d.setHours(0,0,0,0); return d;
}
function weekStart(n){ const m = mondayOf(S.startDateISO); m.setDate(m.getDate()+(n-1)*7); return m; }
function weekRangeLabel(n){
  const s = weekStart(n); const e = new Date(s); e.setDate(e.getDate()+6);
  const f = d=>d.toLocaleDateString([], {month:"short",day:"numeric"});
  return `${f(s)} – ${f(e)}`;
}
function dayDate(weekN, dayN){ const s = weekStart(weekN); const d=new Date(s); d.setDate(d.getDate()+(dayN-1)); return d; }
function dayLabel(weekN, dayN){ return dayDate(weekN,dayN).toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}); }

/* ---------------- migration from v1 ---------------- */
function migrate(){
  if(S.v === 2) { ensureWeek(1); return; }
  // v1 had S.intros (flat list). Fold them into Week 1.
  const old = S.intros || [];
  S.v = 2;
  if(!S.startDateISO) S.startDateISO = todayISO();
  S.weeks = S.weeks || [];
  ensureWeek(1);
  old.forEach(it=>{
    const wk = S.weeks[0];
    wk.foods = wk.foods || [];
    if(!wk.foods.includes(it.label)) wk.foods.push(it.label);
    wk.intros[it.label] = {
      emoji: it.emoji, isAllergen: it.isAllergen, startedISO: it.startedISO,
      days: it.days || makeIntroDays(it.label),
      checks: it.checks || {}, reactions: it.reactions || {}, introduced: !!it.introduced
    };
  });
  delete S.intros; delete S.activeIntroId; delete S.activeDay;
  S.activeWeek = 1;
  saveLocal();
}
function ensureWeek(n){
  S.weeks = S.weeks || [];
  while(S.weeks.length < n){
    S.weeks.push({ n:S.weeks.length+1, foods:[], intros:{} });
  }
  return S.weeks[n-1];
}
function week(n){ return ensureWeek(n); }

/* ---------------- persistence ---------------- */
function loadLocal(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), JSON.parse(raw));
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function saveLocal(){
  localStorage.setItem(LS_KEY, JSON.stringify(S));
  const el = document.getElementById("lastSaved");
  if(el) el.textContent = "saved " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
async function save(){ saveLocal(); if(S.cloud.url){ await cloudPush(); } }

/* ---------------- cloud (Google Sheets via Apps Script) ---------------- */
function setSyncLabel(state, ok){
  const el = document.getElementById("syncState"); const chip = document.getElementById("syncBtn");
  if(el) el.textContent = state; if(chip) chip.classList.toggle("ok", !!ok);
}
async function cloudPush(){
  if(!S.cloud.url) return;
  try{
    setSyncLabel("Saving…");
    await fetch(S.cloud.url, { method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body: JSON.stringify({ action:"save", data:S }) });
    S.cloud.lastSync = new Date().toISOString(); saveLocal(); setSyncLabel("Synced ✓", true);
  }catch(e){ setSyncLabel("Sync failed"); toast("Could not reach your Google Sheet. Saved on this device."); }
}
async function cloudPull(){
  if(!S.cloud.url){ toast("Add your Google Sheet link in Setup first."); return; }
  try{
    setSyncLabel("Loading…");
    const res = await fetch(S.cloud.url + "?action=load", { method:"GET" });
    const json = await res.json();
    if(json && json.data){
      const url = S.cloud.url;
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), json.data);
      S.cloud.url = url; migrate(); saveLocal(); render();
      setSyncLabel("Synced ✓", true); toast("Loaded your saved data from Google Sheets.");
    } else { setSyncLabel("Connected", true); toast("Connected — no saved data in the Sheet yet."); }
  }catch(e){ setSyncLabel("Load failed"); toast("Could not load from your Google Sheet. Check the link in Setup."); }
}

/* ---------------- small helpers ---------------- */
function stampNow(){ return new Date().toISOString(); }
function fmtStamp(iso){ if(!iso) return ""; return new Date(iso).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t = document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2600);
}
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

/* all food names ever added to any week */
function allPlannedFoods(){
  const set = new Set();
  S.weeks.forEach(w=> (w.foods||[]).forEach(f=>set.add(f)) );
  return [...set];
}
/* names of foods marked introduced (tolerated) anywhere */
function introducedFoods(){
  const out = [];
  S.weeks.forEach(w=> Object.entries(w.intros||{}).forEach(([name,it])=>{ if(it.introduced) out.push(name); }) );
  return out;
}
/* the groups the baby has successfully tried */
function triedGroups(){
  const groups = new Set();
  introducedFoods().forEach(name=>{ const it=itemByName(name); if(it && it.group) groups.add(it.group); });
  return [...groups];
}

/* ---------------- plan / week ops ---------------- */
function addFoodToWeek(weekN, name, emoji, isAllergen){
  const w = week(weekN);
  if(!w.foods.includes(name)) w.foods.push(name);
  if(!w.intros[name]){
    w.intros[name] = { emoji: emoji||"🍽️", isAllergen: !!isAllergen, startedISO: stampNow(),
      days: makeIntroDays(name), checks:{}, reactions:{}, introduced:false };
  }
  save(); toast(`Added ${name} to Week ${weekN}`);
}
function removeFoodFromWeek(weekN, name){
  const w = week(weekN);
  w.foods = w.foods.filter(f=>f!==name);
  delete w.intros[name];
  save(); render();
}
function toggleCheck(weekN, name, day, itemId){
  const it = week(weekN).intros[name]; if(!it) return;
  const key = `${day}:${itemId}`;
  if(it.checks[key]) delete it.checks[key];
  else it.checks[key] = { at: stampNow(), by: S.activeParent };
  it.introduced = !!it.checks[`3:d3-done`];
  save(); render();
}
function logReaction(weekN, name, day){
  const it = week(weekN).intros[name]; if(!it) return;
  const txt = prompt("Describe what you noticed (symptoms, timing). A note for you and your doctor:");
  if(txt===null) return;
  it.reactions[day] = { at: stampNow(), by: S.activeParent, text: txt.trim() };
  save(); render(); toast("Reaction note saved with a timestamp.");
}

/* ---------------- rendering ---------------- */
const main = document.getElementById("main");
let currentTab = "plan";
let foodFilterNutrient = "";   // nutrition filter on Foods tab

function render(){
  const bf = document.getElementById("babyNameFoot"); if(bf) bf.textContent = S.baby.name || "Baby";
  const disc = document.getElementById("disclaimer"); if(disc) disc.classList.toggle("hide", S.settings.disclaimerDismissed);
  if(S.cloud.url){ const el=document.getElementById("syncState"); if(el && el.textContent==="Local only") setSyncLabel("Connected", true); }
  if(!S.cloud.url) setSyncLabel("Local only", false);

  if(currentTab==="plan") renderPlan();
  else if(currentTab==="foods") renderFoods();
  else if(currentTab==="pantry") renderPantry();
  else if(currentTab==="allergens") renderAllergens();
  else if(currentTab==="log") renderLog();
  else if(currentTab==="settings") renderSettings();
}

/* ---------- PLAN (weekly calendar) ---------- */
function renderPlan(){
  const w = week(S.activeWeek);
  let html = "";

  html += `<div class="card">
    <div class="dayhead">
      <div><h2 style="margin:0">Weekly Plan</h2><span class="muted">Build each week from foods you choose</span></div>
      <select id="parentSel" style="width:auto">
        ${S.baby.parents.map(p=>`<option ${p===S.activeParent?"selected":""}>${esc(p)}</option>`).join("")}
      </select>
    </div>
    <div class="muted" style="margin-bottom:8px">Checks record who &amp; when. Logging as the person above.</div>
    <div class="daysel" id="weekSel">
      ${S.weeks.map(wk=>{
        const foods=(wk.foods||[]).length;
        const done=Object.values(wk.intros||{}).filter(i=>i.introduced).length;
        return `<div class="daychip ${wk.n===S.activeWeek?'active':''} ${foods&&done===foods?'done':''}" data-week="${wk.n}">
          Week ${wk.n}<small>${weekRangeLabel(wk.n)}</small></div>`;
      }).join("")}
      <div class="daychip" id="addWeek" style="min-width:48px">＋<small>week</small></div>
    </div>
  </div>`;

  // week builder: add foods
  html += `<div class="card">
    <div class="dayhead"><h3 style="margin:0">Week ${w.n} · ${weekRangeLabel(w.n)}</h3></div>
    <button class="btn sec small" id="addFoodBtn">➕ Add a food to this week</button>`;
  if(!(w.foods||[]).length){
    html += `<p class="muted" style="margin-top:10px">No foods yet. Add from the <b>Foods</b> or <b>Allergens</b> tab, or tap the button above.</p>`;
  }
  html += `</div>`;

  // try-next suggestions based on what's been tolerated (cross-reactivity-informed)
  const sugg = buildSuggestions();
  if(sugg.length){
    const ok = sugg.filter(s=>s.tier==="ok").slice(0,5);
    const care = sugg.filter(s=>s.tier==="care").slice(0,5);
    html += `<div class="card"><h3>💡 Foods to try next</h3>
      <p class="muted">Based on what ${esc(S.baby.name)} already tolerates, using allergy cross-reactivity research (how related two foods are). Still introduce one new food at a time and confirm with your pediatrician.</p>`;
    const renderSugg = (s)=>`<div class="check-row"><div class="check-main">
        <div class="check-title">${s.emoji||"🍽️"} ${esc(s.name)}
          ${s.tier==="care"?'<span class="pill allergen">🟡 introduce carefully</span>':'<span class="pill safe">🟢 likely well tolerated</span>'}</div>
        <div class="check-meta">${esc(s.why)}</div>
      </div><button class="btn sec small" style="flex:0 0 auto" data-sugg="${esc(s.name)}" data-se="${esc(s.emoji||'🍽️')}">Add</button></div>`;
    if(ok.length){ html += `<div class="check-meta" style="margin:6px 0;font-weight:600;color:var(--green-d)">🟢 Lower-risk relatives</div>` + ok.map(renderSugg).join(""); }
    if(care.length){ html += `<div class="check-meta" style="margin:10px 0 6px;font-weight:600;color:var(--red)">🟡 Related but higher cross-reactivity — introduce singly</div>` + care.map(renderSugg).join(""); }
    html += `<div class="note" style="margin-top:8px">🟢 = foods in a <b>low cross-reactivity</b> family (tolerating one is reassuring for the others). 🟡 = <b>high cross-reactivity</b> family — tolerating one does <b>not</b> mean the others are safe, so offer each on its own and watch. Rates from Francis et al., J Food Allergy 2020 (FARE).</div>`;
    html += `</div>`;
  }

  // per-food checklist blocks for the week (Day 1/2/3 inside the week)
  (w.foods||[]).forEach(name=>{
    const it = w.intros[name]; if(!it) return;
    const item = itemByName(name);
    html += `<div class="card">
      <div class="dayhead">
        <div><h3 style="margin:0">${it.emoji} ${esc(name)} ${it.isAllergen?'<span class="pill allergen">allergen</span>':''}
          ${it.introduced?'<span class="pill safe">Introduced ✓</span>':''}</h3>
          ${item?`<span class="muted">${(item.nutrients||[]).map(n=>`${NUTRIENTS[n]||''} ${n}`).join(" · ")}</span>`:''}
        </div>
        <button class="btn danger small" style="width:auto" data-rm="${esc(name)}">Remove</button>
      </div>`;
    // 3 day watch
    it.days.forEach(d=>{
      const total=d.items.length, done=d.items.filter(x=>it.checks[`${d.day}:${x.id}`]).length;
      html += `<details ${d.day===1?'open':''}><summary>Day ${d.day} · ${dayLabel(w.n,d.day)} <span class="muted">(${done}/${total})</span></summary>`;
      d.items.forEach(itm=>{
        const c = it.checks[`${d.day}:${itm.id}`];
        html += `<div class="check-row">
          <div class="check-box ${c?'on':''}" data-week="${w.n}" data-food="${esc(name)}" data-day="${d.day}" data-item="${itm.id}">${c?'✓':''}</div>
          <div class="check-main"><div class="check-title">${esc(itm.text)}</div>
          ${c?`<span class="stamp">✓ ${esc(c.by)} · ${fmtStamp(c.at)}</span>`:`<div class="check-meta">not checked yet</div>`}</div></div>`;
      });
      const r = it.reactions[d.day];
      html += `<div class="react-note" style="padding-left:4px">
        ${r?`<span class="stamp react">⚠ ${esc(r.by)} · ${fmtStamp(r.at)}</span><div class="note">${esc(r.text)||'(no text)'}</div>`:''}
        <button class="btn danger small" style="margin-top:6px;width:auto" data-react="${esc(name)}" data-rday="${d.day}">⚠️ Log reaction / note</button>
      </div></details>`;
    });
    html += `</div>`;
  });

  html += `<div class="card"><details><summary>What a reaction can look like</summary>
    <ul class="steps">${REACTION_SIGNS.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28">${esc(EMERGENCY_TEXT)}</div>
  </details></div>`;

  main.innerHTML = html; wirePlan();
}

function wirePlan(){
  const ps=document.getElementById("parentSel"); if(ps) ps.onchange=()=>{ S.activeParent=ps.value; saveLocal(); };
  document.querySelectorAll("#weekSel [data-week]").forEach(c=>c.onclick=()=>{ S.activeWeek=+c.dataset.week; render(); });
  const aw=document.getElementById("addWeek"); if(aw) aw.onclick=()=>{ ensureWeek(S.weeks.length+1); S.activeWeek=S.weeks.length; save(); render(); };
  const af=document.getElementById("addFoodBtn"); if(af) af.onclick=()=>{ currentTab="foods"; setActiveTab(); render(); toast(`Pick foods — they add to Week ${S.activeWeek}`); };
  document.querySelectorAll("[data-sugg]").forEach(b=>b.onclick=()=>{ const it=itemByName(b.dataset.sugg); addFoodToWeek(S.activeWeek,b.dataset.sugg,b.dataset.se,it?it.isAllergen:false); render(); });
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{ if(confirm(`Remove ${b.dataset.rm} from Week ${S.activeWeek}?`)) removeFoodFromWeek(S.activeWeek,b.dataset.rm); });
  document.querySelectorAll(".check-box").forEach(b=>b.onclick=()=>toggleCheck(+b.dataset.week,b.dataset.food,+b.dataset.day,b.dataset.item));
  document.querySelectorAll("[data-react]").forEach(b=>b.onclick=()=>logReaction(S.activeWeek,b.dataset.react,+b.dataset.rday));
}

/* build try-next suggestions from tolerated groups, excluding already-planned */
function buildSuggestions(){
  const planned = new Set(allPlannedFoods().map(s=>s.toLowerCase()));
  const out = [];
  triedGroups().forEach(g=>{
    (GROUP_SUGGESTIONS[g]||[]).forEach(s=>{
      if(!planned.has(s.name.toLowerCase())){
        const known = itemByName(s.name);
        out.push({ name:s.name, why:s.why, group:g, tier:s.tier||"ok", emoji: known?known.emoji:groupEmoji(g) });
      }
    });
  });
  return out;
}
function groupEmoji(g){
  const f = FOODS.find(x=>x.group===g) || ALLERGENS.find(x=>x.group===g);
  return f ? (f.groupEmoji||f.emoji) : "🍽️";
}

/* ---------- FOODS (with nutrition + filter) ---------- */
function renderFoods(){
  const filterOpts = Object.keys(NUTRIENTS).map(n=>`<option value="${n}" ${foodFilterNutrient===n?'selected':''}>${NUTRIENTS[n]} ${n}</option>`).join("");
  let html = `<div class="card"><h2>Recommended first foods</h2>
    <p class="muted">Around 6 months. Introduce one new food at a time and watch for a few days. Tap <b>Add</b> to put a food into <b>Week ${S.activeWeek}</b> of your plan.</p>
    <label>Filter by key vitamin / mineral</label>
    <select id="nutFilter"><option value="">Show all foods</option>${filterOpts}</select>
  </div>`;

  const list = FOODS.filter(f=> !foodFilterNutrient || (f.nutrients||[]).includes(foodFilterNutrient));
  html += `<div class="card">`;
  if(!list.length) html += `<p class="muted">No listed foods highlight that nutrient. Try another.</p>`;
  list.forEach(f=>{
    const planned = allPlannedFoods().includes(f.name);
    html += `<div class="food-item">
      <div class="food-name">${f.emoji} ${esc(f.name)} <span class="pill safe">${esc(f.group)}</span></div>
      <div style="margin:4px 0">${(f.nutrients||[]).map(n=>`<span class="pill ${n===foodFilterNutrient?'allergen':''}">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      <div class="food-grid">
        <b>Cook</b><span>${esc(f.cook)}</span>
        <b>Temp</b><span>${esc(f.temp)}</span>
        <b>Texture</b><span>${esc(f.texture)}</span>
        <b>Amount</b><span>${esc(f.amount)}</span>
        <b>Tips</b><span>${esc(f.tips)}</span>
      </div>
      <button class="btn ${planned?'sec':''} small" style="margin-top:8px" data-food="${esc(f.name)}" data-emoji="${f.emoji}">${planned?'✓ In plan — add again':'➕ Add to Week '+S.activeWeek}</button>
    </div>`;
  });
  html += `</div>`;
  html += `<div class="note">🥄 <b>Choking safety:</b> no honey before 12 months, no whole nuts/grapes/hard chunks, no cow's milk as a drink before 12 months, no added salt or sugar. Always supervise; keep baby upright.</div>`;
  main.innerHTML = html;
  document.getElementById("nutFilter").onchange = (e)=>{ foodFilterNutrient=e.target.value; render(); };
  document.querySelectorAll("[data-food]").forEach(b=>b.onclick=()=>{ addFoodToWeek(S.activeWeek,b.dataset.food,b.dataset.emoji,false); render(); });
}

/* ---------- PANTRY ---------- */
function renderPantry(){
  let html = `<div class="card"><h2>🧊 Fridge / Pantry</h2>
    <p class="muted">Type ingredients you have at home. We'll suggest baby-safe foods to try — matching your ingredients and pointing you toward foods in the same groups ${esc(S.baby.name)} already does well with.</p>
    <label>Add an ingredient</label>
    <div class="row"><input id="pantryIn" placeholder="e.g. sweet potato, yogurt, banana"><button class="btn small" style="flex:0 0 auto" id="pantryAdd">Add</button></div>`;
  if(S.pantry.length){
    html += `<div style="margin-top:10px">${S.pantry.map((p,i)=>`<span class="pill">${esc(p)} <span data-prm="${i}" style="cursor:pointer;color:var(--red)">✕</span></span>`).join("")}</div>`;
  }
  html += `</div>`;

  const matches = pantrySuggestions();
  html += `<div class="card"><h3>Suggestions from your pantry</h3>`;
  if(!S.pantry.length){ html += `<p class="muted">Add a few ingredients above to see suggestions.</p>`; }
  else if(!matches.length){ html += `<p class="muted">No direct baby-food matches yet — try ingredients like sweet potato, banana, avocado, oats, carrot, yogurt, egg.</p>`; }
  else {
    matches.forEach(m=>{
      const planned = allPlannedFoods().includes(m.name);
      html += `<div class="check-row"><div class="check-main">
        <div class="check-title">${m.emoji} ${esc(m.name)} <span class="pill ${m.isAllergen?'allergen':'safe'}">${esc(m.group)}</span> ${m.reasonTag}</div>
        <div class="check-meta">${esc(m.why)}</div>
        <div style="margin-top:4px">${(m.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      </div><button class="btn ${planned?'sec':''} small" style="flex:0 0 auto" data-padd="${esc(m.name)}" data-pe="${m.emoji}">${planned?'✓':'Add'}</button></div>`;
    });
  }
  html += `</div>`;
  main.innerHTML = html; wirePantry();
}
function wirePantry(){
  const add=()=>{ const v=document.getElementById("pantryIn").value.trim(); if(v){ S.pantry.push(v); save(); render(); } };
  const b=document.getElementById("pantryAdd"); if(b) b.onclick=add;
  const inp=document.getElementById("pantryIn"); if(inp) inp.onkeydown=(e)=>{ if(e.key==="Enter") add(); };
  document.querySelectorAll("[data-prm]").forEach(x=>x.onclick=()=>{ S.pantry.splice(+x.dataset.prm,1); save(); render(); });
  document.querySelectorAll("[data-padd]").forEach(x=>x.onclick=()=>{ const it=itemByName(x.dataset.padd); addFoodToWeek(S.activeWeek,x.dataset.padd,x.dataset.pe,it?it.isAllergen:false); render(); });
}
/* match pantry text to known foods, + same-group next-steps */
function pantrySuggestions(){
  const pantryLc = S.pantry.map(p=>p.toLowerCase());
  const out = []; const seen = new Set();
  const triedG = new Set(triedGroups());
  // 1) direct matches: an ingredient name appears in / contains a known food name
  allItems().forEach(it=>{
    const nameLc = it.name.toLowerCase().replace(/\s*\(.*?\)/,"").trim();
    const hit = pantryLc.some(p=> p.includes(nameLc) || nameLc.includes(p) || sharesWord(p,nameLc));
    if(hit && !seen.has(it.name)){
      seen.add(it.name);
      out.push({ name:it.name, emoji:it.emoji, group:it.group, isAllergen:it.isAllergen,
        nutrients:it.nutrients, why: it.isAllergen?`You have this — it's an allergen, introduce carefully (${it.how.split(".")[0]}).`:`You have this on hand — ${it.amount}`,
        reasonTag: triedG.has(it.group)?'<span class="pill safe">same group tried</span>':'<span class="pill">in your pantry</span>', score: triedG.has(it.group)?2:3 });
    }
  });
  // 2) same-group next steps for tolerated groups (even if not literally in pantry)
  triedGroups().forEach(g=>{
    (GROUP_SUGGESTIONS[g]||[]).forEach(s=>{
      if(seen.has(s.name)) return;
      // only surface if a pantry word loosely relates OR it's a strong group pick
      const known = itemByName(s.name);
      out.push({ name:s.name, emoji: known?known.emoji:groupEmoji(g), group:g, isAllergen: known?known.isAllergen:false,
        nutrients: known?known.nutrients:[], why:s.why,
        reasonTag:'<span class="pill safe">goes with '+esc(g)+'</span>', score:1 });
      seen.add(s.name);
    });
  });
  return out.sort((a,b)=>b.score-a.score);
}
function sharesWord(a,b){
  const aw=a.split(/\W+/).filter(w=>w.length>3), bw=b.split(/\W+/).filter(w=>w.length>3);
  return aw.some(w=>bw.includes(w));
}

/* ---------- ALLERGENS ---------- */
function renderAllergens(){
  let html = `<div class="card"><h2>Allergen schedule</h2>
    <p class="muted">Introduce one allergen at a time, early, in the morning, on a day you can watch baby for a few hours. A common pace is <b>one new allergen per week</b>, kept in rotation afterward. Tap <b>Add</b> to drop one into a week of your plan.</p>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28"><b>Confirm this order &amp; timing with your pediatrician</b>, especially with family history of allergies or eczema.</div>
  </div><div class="card">`;
  ALLERGENS.forEach(a=>{
    const planned = allPlannedFoods().includes(a.name);
    html += `<div class="food-item">
      <div class="food-name">${a.emoji} ${esc(a.name)} <span class="pill allergen">Suggested week ${a.week}</span></div>
      <div style="margin:4px 0">${(a.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      <div class="food-grid">
        <b>How</b><span>${esc(a.how)}</span><b>Amount</b><span>${esc(a.amount)}</span>
        <b>Watch</b><span>${esc(a.watch)}</span><b>Note</b><span>${esc(a.note)}</span>
      </div>
      <button class="btn ${planned?'sec':''} small" style="margin-top:8px" data-all="${esc(a.name)}" data-emoji="${a.emoji}">${planned?'✓ In plan':'➕ Add to Week '+S.activeWeek}</button>
    </div>`;
  });
  html += `</div>`;
  main.innerHTML = html;
  document.querySelectorAll("[data-all]").forEach(b=>b.onclick=()=>{ addFoodToWeek(S.activeWeek,b.dataset.all,b.dataset.emoji,true); render(); });
}

/* ---------- LOG (summarized per food) ---------- */
function renderLog(){
  let html = `<div class="card"><h2>History log</h2><p class="muted">One summary per food, newest activity first — with every timestamp and who did it folded in.</p></div>`;
  // gather per-food activity across all weeks
  const byFood = {};
  S.weeks.forEach(w=>{
    Object.entries(w.intros||{}).forEach(([name,it])=>{
      const key = name;
      if(!byFood[key]) byFood[key] = { name, emoji:it.emoji, isAllergen:it.isAllergen, group:(itemByName(name)||{}).group, events:[], introduced:false, weeks:new Set() };
      byFood[key].weeks.add(w.n);
      if(it.introduced) byFood[key].introduced = true;
      Object.entries(it.checks||{}).forEach(([k,c])=>{
        const [day,itemId]=k.split(":"); const dObj=it.days.find(d=>d.day==day); const itm=dObj&&dObj.items.find(x=>x.id===itemId);
        byFood[key].events.push({ at:c.at, by:c.by, text:(itm?itm.text:itemId), react:false, week:w.n, day });
      });
      Object.entries(it.reactions||{}).forEach(([day,r])=>{
        byFood[key].events.push({ at:r.at, by:r.by, text:"⚠ Reaction: "+(r.text||""), react:true, week:w.n, day });
      });
    });
  });
  const foods = Object.values(byFood).map(f=>{
    f.events.sort((a,b)=>(b.at||"").localeCompare(a.at||""));
    f.last = f.events[0] ? f.events[0].at : "";
    return f;
  }).filter(f=>f.events.length).sort((a,b)=>(b.last||"").localeCompare(a.last||""));

  if(!foods.length){ html += `<div class="card"><p class="muted">Nothing logged yet. Check items off in the Weekly Plan.</p></div>`; main.innerHTML=html; return; }

  foods.forEach(f=>{
    const checks = f.events.filter(e=>!e.react).length;
    const reacts = f.events.filter(e=>e.react).length;
    const people = [...new Set(f.events.map(e=>e.by))];
    html += `<div class="card"><details ${foods.length<=2?'open':''}>
      <summary>${f.emoji} ${esc(f.name)} ${f.introduced?'<span class="pill safe">Introduced ✓</span>':''} ${reacts?'<span class="pill allergen">'+reacts+' reaction note'+(reacts>1?'s':'')+'</span>':''}
        <span class="muted">— ${checks} check${checks!==1?'s':''}, last ${fmtStamp(f.last)}</span></summary>
      <div class="check-meta" style="margin:6px 0">Week${f.weeks.size>1?'s':''} ${[...f.weeks].sort((a,b)=>a-b).join(", ")} · logged by ${people.map(esc).join(", ")}</div>`;
    f.events.forEach(e=>{
      html += `<div class="check-row"><div class="check-main">
        <div class="check-title" style="font-weight:500">${esc(e.text)}</div>
        <span class="stamp ${e.react?'react':''}">${esc(e.by)} · W${e.week} D${e.day} · ${fmtStamp(e.at)}</span>
      </div></div>`;
    });
    html += `</details></div>`;
  });
  main.innerHTML = html;
}

/* ---------- SETTINGS ---------- */
function renderSettings(){
  const url = S.cloud.url || "";
  let html = `<div class="card"><h2>Baby &amp; parents</h2>
    <label>Baby's name</label><input id="babyName" value="${esc(S.baby.name)}">
    <label>Parent / caregiver names (comma separated)</label><input id="parentsIn" value="${esc(S.baby.parents.join(", "))}">
    <label>Week 1 start date</label><input type="date" id="startDate" value="${new Date(S.startDateISO).toISOString().slice(0,10)}">
    <button class="btn small" style="margin-top:10px" id="saveProfile">Save</button>
  </div>`;

  html += `<div class="card"><h2>☁️ Google Sheets sync</h2>
    <p class="muted">Saves on this device automatically and syncs to your Google Sheet so both phones share one plan.</p>
    <label>Your Apps Script Web App link</label>
    <input id="cloudUrl" placeholder="https://script.google.com/macros/s/..../exec" value="${esc(url)}">
    <div class="row" style="margin-top:10px"><button class="btn small" id="saveCloud">Connect</button><button class="btn sec small" id="pullCloud">⬇️ Load</button></div>
    <div class="row" style="margin-top:8px"><button class="btn sec small" id="pushCloud">⬆️ Save to Sheet now</button></div>
    <p class="muted" style="margin-top:8px">Last sync: ${S.cloud.lastSync?fmtStamp(S.cloud.lastSync):"never"}</p>
  </div>`;

  html += `<div class="card"><h2>Data</h2>
    <button class="btn sec small" id="exportBtn">⬇️ Export backup file</button>
    <button class="btn danger small" style="margin-top:8px" id="resetBtn">Reset everything</button>
  </div>`;

  main.innerHTML = html;
  document.getElementById("saveProfile").onclick=()=>{
    S.baby.name=document.getElementById("babyName").value.trim()||"Baby";
    S.baby.parents=document.getElementById("parentsIn").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!S.baby.parents.length) S.baby.parents=["Parent 1"];
    if(!S.baby.parents.includes(S.activeParent)) S.activeParent=S.baby.parents[0];
    const dv=document.getElementById("startDate").value; if(dv){ const d=new Date(dv); d.setHours(0,0,0,0); S.startDateISO=d.toISOString(); }
    save(); toast("Saved"); render();
  };
  document.getElementById("saveCloud").onclick=async()=>{ S.cloud.url=document.getElementById("cloudUrl").value.trim(); saveLocal();
    if(S.cloud.url){ setSyncLabel("Connecting…"); await cloudPush(); toast("Connected."); } else setSyncLabel("Local only",false); render(); };
  document.getElementById("pullCloud").onclick=cloudPull;
  document.getElementById("pushCloud").onclick=async()=>{ await cloudPush(); toast("Saved to Sheet."); };
  document.getElementById("exportBtn").onclick=()=>{ const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="baby-solids-backup.json"; a.click(); };
  document.getElementById("resetBtn").onclick=()=>{ if(confirm("Erase all tracked data on this device? (Your Google Sheet copy stays unless you overwrite it.)")){
    S=JSON.parse(JSON.stringify(DEFAULT_STATE)); migrate(); saveLocal(); render(); toast("Reset."); } };
}

/* ---------------- tabs & boot ---------------- */
function setActiveTab(){ document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===currentTab)); }
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{ currentTab=t.dataset.tab; setActiveTab(); render(); });
document.getElementById("dismissDisc").onclick=()=>{ S.settings.disclaimerDismissed=true; saveLocal(); render(); };
document.getElementById("syncBtn").onclick=()=>{ currentTab="settings"; setActiveTab(); render(); };

render();
if(S.cloud.url){ cloudPull(); }
