/* ══════════════════════════════════════════════════════════════════
   TrisTras — App Logic (v1.3.0) — PRODUCTO REAL CUERPOS SERRANOS
   ══════════════════════════════════════════════════════════════════ */

// ── PWA UPDATE SYSTEM ──
let newWorker;
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      newWorker = reg.installing;
      newWorker.addEventListener('statechange',()=>{
        if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
          document.getElementById('updateToast').classList.remove('hidden');
        }
      });
    });
  });
}
function applyUpdate(){
  if(newWorker) newWorker.postMessage({action:'skipWaiting'});
  window.location.reload();
}
function dismissUpdate(){
  document.getElementById('updateToast').classList.add('hidden');
}

// ── UTILITIES & DB ──
const CU = {id:null, name:null, pin:null, theme:'dark', color:'default', showTimers:false};
const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('tt_users')||'[]'),
  setUsers: (u) => localStorage.setItem('tt_users', JSON.stringify(u)),
  data: (id) => JSON.parse(localStorage.getItem('tt_data_'+id)||(id==='Cuerposserranos'?'{"sessions":[]}':'{"sessions":[]}')),
  save: (id, d) => localStorage.setItem('tt_data_'+id, JSON.stringify(d)),
  // ── Planning (independent key, never exported) ──
  planData: (id) => JSON.parse(localStorage.getItem('tt_plan_'+id)||'{"plans":[]}'),
  savePlan: (id, d) => localStorage.setItem('tt_plan_'+id, JSON.stringify(d))
};

// ── CATÁLOGO OFICIAL CUERPOS SERRANOS ──
// 8 packs (4 niveles × 2 tipos A/B) + OTRO
const PROGRAMS = {
  '1a': { n:'1A - Nivel Unicornio', e:'🦄', d:'Pack A · Iniciación', s:['Sesión única'], b:['🦄 Pack 1A'] },
  '1b': { n:'1B - Nivel Unicornio', e:'🦄', d:'Pack B · Iniciación', s:['Sesión única'], b:['🦄 Pack 1B'] },
  '2a': { n:'2A - Nivel Amarillo', e:'💛', d:'Pack A · Intermedio bajo', s:['Sesión única'], b:['💛 Pack 2A'] },
  '2b': { n:'2B - Nivel Amarillo', e:'💛', d:'Pack B · Intermedio bajo', s:['Sesión única'], b:['💛 Pack 2B'] },
  '3a': { n:'3A - Nivel Naranja', e:'🍊', d:'Pack A · Intermedio alto', s:['Sesión única'], b:['🍊 Pack 3A'] },
  '3b': { n:'3B - Nivel Naranja', e:'🍊', d:'Pack B · Intermedio alto', s:['Sesión única'], b:['🍊 Pack 3B'] },
  '4a': { n:'4A - Nivel Negro', e:'🥋', d:'Pack A · Avanzado', s:['Sesión única'], b:['🥋 Pack 4A'] },
  '4b': { n:'4B - Nivel Negro', e:'🥋', d:'Pack B · Avanzado', s:['Sesión única'], b:['🥋 Pack 4B'] },
  'ot': { n:'OTRO', e:'🏃', d:'Otras actividades físicas', s:['Único'], b:['🏃 Actividad'] }
};

const EJERCICIOS = {
  '🦄 Pack 1A': [
    'Media sentadilla. "El pantalón vaquero"',
    'Curl de bíceps. "La camiseta blanca"',
    'Zancada adelante y rodilla. "Las converse"',
    'Press de pecho con banda. "El Mazinger Z"',
    'Puente de glúteos sin banda. "Las Kardashian"',
    'Remo con banda sentado'
  ],
  '🦄 Pack 1B': [
    'Media sentadilla. "El pantalón vaquero"',
    'Curl de bíceps. "La camiseta blanca"',
    'Zancada adelante y rodilla a suelo. "Las converse"',
    'Extensión de tríceps con banda . "El latigazo"',
    'Abducción de cadera con banda. "La almeja"',
    'Aperturas de hombros con banda. "El bostezo"'
  ],
  '💛 Pack 2A': [
    'Media sentadilla. "Pantalón vaquero"',
    'Curl de bíceps . "Camiseta blanca"',
    'Puente de glúteos con banda . "Kardashian con goma"',
    'Extensión de cadera con banda . "Coz de pie"',
    'Zancadas laterales con banda . "El Godzilla"',
    'Jalón dorsal con banda . "La aspiradora"',
    'Puente con extensión de rodilla'
  ],
  '💛 Pack 2B': [
    'Media sentadilla. "Pantalón vaquero"',
    'Extensión de tríceps. "El latigazo"',
    'Puente de glúteos con banda . "Kardashian con gomas"',
    'Flexiones de brazos y rodillas apoyadas. "Flexión con barreños"',
    'Rotación externa de hombros con banda . "Maldito rotador"',
    'Patada de glúteo con banda. "Coz del borriquito"',
    'Curl de bíceps con banda sentado. "El presidiario"'
  ],
  '🍊 Pack 3A': [
    'Media sentadilla con goma o peso. "El Pantalón Vaquero"',
    'Extensión de tríceps con banda . "El latigazo"',
    'Zancada adelante (con peso). "Las Converse con peso"',
    'Curl de bíceps. "La camiseta blanca"',
    'Desplazamiento lateral. "Pachín, pachín, los patitos"',
    'Extensión tríceps sentado (con peso). "Latigazo con garrafa"',
    'Patada de glúteo con banda. "La coz del borriquito"',
    'Under switch animal flow. "El matrix"'
  ],
  '🍊 Pack 3B': [
    'Media sentadilla con goma o peso. "El Pantalón Vaquero"',
    'Extensión de tríceps con banda. "El latigazo"',
    'Zancada adelante (con peso). "Las Converse con peso"',
    'Curl de bíceps con banda. "La camiseta blanca"',
    'Muñecas de famosa (2x)',
    'Abducción de cadera con banda. "La almeja de pie"',
    'Aperturas de hombros de pie (elev laterales). "El playmobil"',
    'Peso muerto con goma. "Paquito el chocolatero"'
  ],
  '🥋 Pack 4A': [
    'Media sentadilla con peso. "Pantalón vaquero"',
    'Flexiones de brazos y rodillas apoyadas. "Flexión con barreños"',
    'Peso muerto con goma. "Paquito el chocolatero"',
    'Curl de bíceps con banda. "Camiseta blanca"',
    'Resistencia: Skipping, comba.. "Las trillizas del oxígeno"',
    'Puente de glúteos con elevación. "Kardashian-cabaret"',
    'Reverse Pec Deck. "Cu-cú...¡TRAS!"',
    'Zancada lateral (slider). "La mopa"'
  ],
  '🥋 Pack 4B': [
    'Media sentadilla con Peso. "El pantalón vaquero con goma"',
    'Plancha horizontal isométrica. "La plancha"',
    'Curl de bíceps. "La camiseta blanca"',
    'Flexiones de brazos y rodillas apoyadas. "Flexiones con barreños"',
    'Jalón con Goma. "Superman"',
    'Desplazamiento lateral en plancha con banda. "La plancha en marcha"',
    'Press de hombro con goma sentado. "La maleta"',
    'Resistencia: Skipping, comba.. "Las trillizas del oxígeno"'
  ],
  '🏃 Actividad': ['Correr','Caminar','Bici','Natación','Yoga','Pilates','Otro']
};

const METS = { '1a':4.5, '1b':4.5, '2a':5.5, '2b':5.5, '3a':6.5, '3b':6.5, '4a':8.0, '4b':8.0, 'ot':7.0 };
const MOODS = ['','😴','😐','🙂','💪','🔥'];
const MOOD_LABELS = ['','Agotado','Normal','Bien','Fuerte','¡Brutal!'];

// ── APP STATE ──
let hmDate = new Date();
let hmMode = 'history';  // 'history' | 'plan'
let planPickerDate = null; // ISO string of day being planned
let currentWorkout = null;
let editIdx = -1;
let calPeriod = 'week';
let charts = {};
let lastSavedSessionId = null;
let selectedMood = 0;
let repeatMode = false;

// ── LOGIN LÓGICA ──
window.onload = () => {
  const lastUser = localStorage.getItem('tt_last_user');
  if(lastUser) login(lastUser); else showSelect();
  initColorPicker();
};

function showSelect(){
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('appScreen').style.display='none';
  document.getElementById('lm-select').style.display='block';
  document.getElementById('lm-pin').style.display='none';
  const u = DB.getUsers();
  const c = document.getElementById('userChips');
  c.innerHTML = u.map(x=>`<div class="chip" onclick="login('${x.id}')">${x.name[0].toUpperCase()} ${x.name}</div>`).join('') || '<p class="sub">No hay usuarios aún</p>';
}

function createUser(){
  const n = document.getElementById('newName').value.trim();
  const p = document.getElementById('newPin').value.trim();
  if(!n) return alert("Escribe un nombre");
  const id='u'+Date.now();
  const u=DB.getUsers();
  u.push({id, name:n, pin:p||null, theme:'dark', color:'default', showTimers:false});
  DB.setUsers(u);
  login(id);
}

function login(id){
  const u = DB.getUsers().find(x=>x.id===id);
  if(!u) return showSelect();
  if(u.pin){
    CU.id=id; document.getElementById('pinUser').textContent=u.name;
    document.getElementById('lm-select').style.display='none';
    document.getElementById('lm-pin').style.display='block';
    document.getElementById('pinInput').value='';
    setTimeout(()=>document.getElementById('pinInput').focus(),100);
  } else {
    doLogin(u);
  }
}

function confirmPin(){
  const p = document.getElementById('pinInput').value;
  const u = DB.getUsers().find(x=>x.id===CU.id);
  if(u.pin === p){ doLogin(u); } else { alert("PIN incorrecto"); document.getElementById('pinInput').value=''; }
}

function doLogin(user){
  Object.assign(CU, user);
  localStorage.setItem('tt_last_user', CU.id);
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('appScreen').style.display='block';
  applyTheme(CU.theme);
  applyColor(CU.color);
  
  updateGreeting();
  
  showTab('dashboard');
}

function updateGreeting(){
  const h=new Date().getHours();
  const greet = h<12 ? '¡Buenos días! 🌅' : h<21 ? '¡Buenas tardes! ☀️' : '¡Buenas noches! 🌙';
  document.getElementById('greeting').textContent = `${greet}, ${CU.name}`;
}

function logout(){ localStorage.removeItem('tt_last_user'); location.reload(); }

// ── THEME & UI ──
function toggleTheme(){
  CU.theme = CU.theme==='dark'?'light':'dark';
  applyTheme(CU.theme);
  saveUserConfig();
}
function applyTheme(t){
  document.body.classList.toggle('light-theme', t==='light');
  document.getElementById('btn-theme-toggle').textContent = t==='light'?'🌙':'☀️';
  if(document.getElementById('sTheme')) document.getElementById('sTheme').value = t;
}
function initColorPicker(){
  document.querySelectorAll('.cpick').forEach(p=>{
    p.onclick = () => pickColor(p.dataset.c);
  });
}
function pickColor(c){
  CU.color = c;
  applyColor(c);
  document.querySelectorAll('.cpick').forEach(p=>p.classList.toggle('sel', p.dataset.c===c));
  saveUserConfig();
}
function applyColor(c){
  const b = document.body;
  b.classList.remove('theme-red','theme-orange','theme-green','theme-pink','theme-blue');
  if(c!=='default') b.classList.add('theme-'+c);
}
function saveUserConfig(){
  const u = DB.getUsers();
  const i = u.findIndex(x=>x.id===CU.id);
  if(i>-1) { u[i] = {...u[i], ...CU}; DB.setUsers(u); }
}

function showTab(t){
  document.querySelectorAll('.tcont').forEach(c=>c.classList.remove('vis'));
  document.querySelectorAll('.ntab,.mnav-btn').forEach(b=>b.classList.remove('act'));
  document.getElementById('tab-'+t).classList.add('vis');
  if(document.getElementById('nt-'+t)) document.getElementById('nt-'+t).classList.add('act');
  if(document.getElementById('mn-'+t)) document.getElementById('mn-'+t).classList.add('act');
  if(t==='dashboard') drawDashboard();
  if(t==='log') { if(editIdx>=0) initLogForEdit(); else if(repeatMode) initLogForRepeat(); else initLog(); }
  if(t==='history') drawHistory();
  if(t==='settings') initSettings();
  // Scroll to top — compatible with all mobile browsers and iOS PWA
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

// ── DASHBOARD ──
function drawDashboard(){
  const d = DB.data(CU.id);
  const sessions = d.sessions || [];
  
  document.getElementById('s-total').textContent = sessions.length;
  
  const now = new Date();
  const dow = now.getDay(); 
  const diffToMonday = dow===0 ? 6 : dow-1;
  const ws = new Date(now); ws.setDate(now.getDate()-diffToMonday); ws.setHours(0,0,0,0);
  document.getElementById('s-week').textContent = sessions.filter(s=>new Date(s.date+'T00:00:00')>=ws).length;
  
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthMins = sessions.filter(s=>new Date(s.date)>=startMonth).reduce((a,c)=>a+(c.duration||0),0);
  document.getElementById('s-mins').textContent = thisMonthMins;
  
  const totalMins = sessions.reduce((a,c)=>a+(c.duration||0),0);
  document.getElementById('s-hours').textContent = (totalMins/60).toFixed(1);
  
  const streak = calcStreak(sessions);
  document.getElementById('s-streak').textContent = streak;
  const bestS = Math.max(streak, parseInt(localStorage.getItem('tt_best_streak_'+CU.id)||0));
  document.getElementById('s-best-streak').textContent = bestS;
  localStorage.setItem('tt_best_streak_'+CU.id, bestS);
  
  document.getElementById('s-consist').textContent = calcConsistency(sessions) + '%';

  let maxKm = 0;
  sessions.forEach(s=>{
    if(s.program==='ot') s.exercises.forEach(ex=>ex.sets.forEach(st=>{
      const val = parseFloat(st.reps)||0;
      if(val > maxKm) maxKm = val;
    }));
  });
  document.getElementById('s-km').textContent = maxKm % 1 === 0 ? maxKm : maxKm.toFixed(1);

  drawWeeklyGoal(sessions);
  drawWeekly(sessions);
  fillExSel(sessions);
  drawProgress();
  drawPRs(sessions);
  drawRecent(sessions);
  drawMonthlyHeatmap();
}

function calcStreak(sessions){
  if(!sessions.length) return 0;
  const dates=[...new Set(sessions.map(s=>s.date))].sort().reverse();
  let streak=0,ref=new Date(); ref.setHours(0,0,0,0);
  for(const d of dates){
    const dd=new Date(d+'T00:00:00'); dd.setHours(0,0,0,0);
    if((ref-dd)/864e5<=1.1){streak++;ref=dd;}else break;
  }
  return streak;
}

function calcConsistency(sessions){
  if(!sessions.length) return 0;
  const ninetyDaysAgo = new Date(Date.now() - 90*864e5).toISOString().split('T')[0];
  const activeDays = [...new Set(sessions.filter(s=>s.date>=ninetyDaysAgo).map(s=>s.date))].length;
  return Math.min(100, Math.round((activeDays / 38) * 100));
}

// ── HEATMAP INTERACTIVO ──
function navHeatmap(dir) {
  if (dir === 0) hmDate = new Date();
  else hmDate.setMonth(hmDate.getMonth() + dir);
  drawMonthlyHeatmap();
}

function setHmMode(mode) {
  hmMode = mode;
  document.getElementById('hmBtnHistory').classList.toggle('act', mode === 'history');
  document.getElementById('hmBtnPlan').classList.toggle('act', mode === 'plan');
  drawMonthlyHeatmap();
}

function drawMonthlyHeatmap() {
  if (hmMode === 'plan') drawPlanHeatmap();
  else drawHistoryHeatmap();
}

// ── HISTORY HEATMAP (original) ──
function drawHistoryHeatmap() {
  const container = document.getElementById('hmGrid');
  const monthLab  = document.getElementById('hmMonth');
  const titleEl   = document.getElementById('hmTitle');
  const legend    = document.getElementById('hmLegend');
  if (!container) return;
  if (titleEl) titleEl.textContent = '📅 Actividad';
  const sessions = DB.data(CU.id).sessions || [];
  const year = hmDate.getFullYear();
  const month = hmDate.getMonth();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  monthLab.textContent = `${monthNames[month]} ${year}`;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  container.innerHTML = '';
  const dayNames = ['L','M','X','J','V','S','D'];
  dayNames.forEach(d => container.innerHTML += `<div style="text-align:center;font-size:0.6rem;color:var(--muted);font-weight:800;padding-bottom:5px">${d}</div>`);
  for (let i = 0; i < startOffset; i++) container.innerHTML += '<div></div>';
  const dailyData = {};
  sessions.forEach(s => {
    const d = new Date(s.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!dailyData[day]) dailyData[day] = { count: 0, progs: [] };
      dailyData[day].count += s.exercises.length;
      const pName = PROGRAMS[s.program]?.n || s.program;
      if (!dailyData[day].progs.includes(pName)) dailyData[day].progs.push(pName);
    }
  });
  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  for (let d = 1; d <= daysInMonth; d++) {
    const data = dailyData[d];
    let cls = 'hm-day', tip = '';
    if (data) {
      cls += ' train';
      if (data.count <= 4) cls += ' lv1'; else if (data.count <= 8) cls += ' lv2'; else if (data.count <= 12) cls += ' lv3'; else cls += ' lv4';
      tip = `${data.progs.join(', ')} (${data.count} exs)`;
    }
    if (isThisMonth && d === today.getDate()) cls += ' today';
    const el = document.createElement('div');
    el.className = cls; el.textContent = d;
    if(tip) el.setAttribute('data-tip', tip);
    el.onclick = () => { if(data) alert(`Día ${d}: ${tip}`); };
    container.appendChild(el);
  }
  // Legend
  if (legend) legend.innerHTML = `
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:var(--card2);border:1px solid var(--border)"></span>Sin entreno</span>
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:rgba(124,58,237,.15)"></span>1-4 ej.</span>
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:rgba(124,58,237,.4)"></span>5-8 ej.</span>
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:rgba(124,58,237,.7)"></span>9-12 ej.</span>
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:var(--p2)"></span>+12 ej.</span>`;
}

// ── PLANNING HEATMAP ──
function drawPlanHeatmap() {
  const container = document.getElementById('hmGrid');
  const monthLab  = document.getElementById('hmMonth');
  const titleEl   = document.getElementById('hmTitle');
  const legend    = document.getElementById('hmLegend');
  if (!container) return;
  if (titleEl) titleEl.textContent = '🗓️ Planificación';
  const plans = DB.planData(CU.id).plans || [];
  const year  = hmDate.getFullYear();
  const month = hmDate.getMonth();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  monthLab.textContent = `${monthNames[month]} ${year}`;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  container.innerHTML = '';
  const dayNames = ['L','M','X','J','V','S','D'];
  dayNames.forEach(d => container.innerHTML += `<div style="text-align:center;font-size:0.6rem;color:var(--muted);font-weight:800;padding-bottom:5px">${d}</div>`);
  for (let i = 0; i < startOffset; i++) container.innerHTML += '<div></div>';
  // Index plans for this month
  const planMap = {};
  plans.forEach(p => {
    const pd = new Date(p.date + 'T00:00:00');
    if (pd.getFullYear() === year && pd.getMonth() === month) planMap[pd.getDate()] = p;
  });
  const today     = new Date(); today.setHours(0,0,0,0);
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  for (let d = 1; d <= daysInMonth; d++) {
    const plan   = planMap[d];
    const cellDate = new Date(year, month, d);
    const isPast   = cellDate < today;
    const isToday  = isThisMonth && d === today.getDate();
    let cls = 'hm-day';
    let tip = '';
    if (plan) {
      cls += ' planned';
      const prog = PROGRAMS[plan.program];
      tip = `${prog?.e || ''} ${prog?.n || plan.program}`;
    }
    if (isPast && !isToday) cls += ' plan-past';
    if (isToday) cls += ' today';
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = d;
    if (tip) el.setAttribute('data-tip', tip);
    // Only allow editing today or future days
    if (!isPast || isToday) {
      el.onclick = () => openPlanModal(year, month, d, plan || null);
    }
    container.appendChild(el);
  }
  if (legend) legend.innerHTML = `
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:var(--card2);border:1px solid var(--border)"></span>Sin plan</span>
    <span class="hm-legend-item"><span class="hm-legend-swatch" style="background:rgba(249,115,22,.5);border:1px solid var(--coral)"></span>Planificado</span>`;
}

// ── PLAN MODAL ──
function openPlanModal(year, month, day, existingPlan) {
  planPickerDate = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  document.getElementById('planModalTitle').textContent = `🗓️ ${day} de ${monthNames[month]}`;
  // Build program buttons
  const grid = document.getElementById('planProgGrid');
  grid.innerHTML = Object.entries(PROGRAMS).map(([k, v]) => {
    const isSel = existingPlan && existingPlan.program === k;
    return `<button class="plan-prog-btn${isSel?' sel':''}" onclick="savePlan('${k}')">
      <span class="ppe">${v.e}</span><span>${v.n.split(' - ')[0] || k.toUpperCase()}</span>
    </button>`;
  }).join('');
  // Show delete btn only if plan already exists
  const delBtn = document.getElementById('planDeleteBtn');
  delBtn.style.display = existingPlan ? 'block' : 'none';
  document.getElementById('planModal').style.display = 'flex';
}

function savePlan(programKey) {
  const d = DB.planData(CU.id);
  // Remove if same date already exists, then add new
  d.plans = d.plans.filter(p => p.date !== planPickerDate);
  d.plans.push({ date: planPickerDate, program: programKey });
  DB.savePlan(CU.id, d);
  closePlanModal();
  drawPlanHeatmap();
}

function deletePlan() {
  const d = DB.planData(CU.id);
  d.plans = d.plans.filter(p => p.date !== planPickerDate);
  DB.savePlan(CU.id, d);
  closePlanModal();
  drawPlanHeatmap();
}

function closePlanModal() {
  document.getElementById('planModal').style.display = 'none';
  planPickerDate = null;
}

// ── CHARTS ──
function drawWeekly(sessions){
  const ctx = document.getElementById('cWeekly').getContext('2d');
  const weeks = [];
  for(let i=7; i>=0; i--){
    const d = new Date(); d.setDate(d.getDate() - (i*7));
    const start = new Date(d); start.setDate(d.getDate() - (d.getDay()===0?6:d.getDay()-1)); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    weeks.push({ label: `${start.getDate()}/${start.getMonth()+1}`, count: sessions.filter(s=>{ const sd=new Date(s.date+'T00:00:00'); return sd>=start && sd<=end; }).length });
  }
  if(charts.weekly) charts.weekly.destroy();
  charts.weekly = new Chart(ctx, {
    type:'bar', data: { labels: weeks.map(w=>w.label), datasets: [{ data: weeks.map(w=>w.count), backgroundColor: 'rgba(168,85,247,0.5)', borderColor:'#a855f7', borderWidth:2, borderRadius:6 }] },
    options: { maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{stepSize:1,color:'#77a'}}, x:{ticks:{color:'#77a'}} } }
  });
  drawCalChart(sessions);
}

function setCalPeriod(p){ calPeriod=p; document.querySelectorAll('.cal-pill').forEach(b=>b.classList.toggle('act', b.dataset.p===p)); drawCalChart(DB.data(CU.id).sessions); }

function drawCalChart(sessions){
  const ctx = document.getElementById('cCal').getContext('2d');
  const user = DB.getUsers().find(u=>u.id===CU.id);
  const weight = parseFloat(user.weight) || 70;
  let labels=[], data=[];
  const now = new Date(); now.setHours(0,0,0,0);

  if(calPeriod==='week'){
    for(let i=6;i>=0;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      labels.push(d.toLocaleDateString('es-ES',{weekday:'short'}));
      data.push(sumCals(sessions.filter(s=>s.date===d.toISOString().split('T')[0]), weight));
    }
  } else if(calPeriod==='lastweek'){
    for(let i=13;i>=7;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      labels.push(d.toLocaleDateString('es-ES',{weekday:'short'}));
      data.push(sumCals(sessions.filter(s=>s.date===d.toISOString().split('T')[0]), weight));
    }
  } else if(calPeriod==='4weeks'){
    for(let i=3;i>=0;i--){
      const end=new Date(now); end.setDate(end.getDate()-(i*7));
      const start=new Date(end); start.setDate(start.getDate()-6);
      labels.push(`${start.getDate()}/${start.getMonth()+1}`);
      data.push(sumCals(sessions.filter(s=>{const d=new Date(s.date+'T00:00:00'); return d>=start && d<=end}), weight));
    }
  } else {
    for(let i=11;i>=0;i--){
      const d=new Date(now.getFullYear(), now.getMonth()-i, 1);
      labels.push(d.toLocaleDateString('es-ES',{month:'short'}));
      data.push(sumCals(sessions.filter(s=>{const sd=new Date(s.date+'T00:00:00'); return sd.getMonth()===d.getMonth() && sd.getFullYear()===d.getFullYear()}), weight));
    }
  }
  const total = data.reduce((a,b)=>a+b,0);
  document.getElementById('calBurnInfo').textContent = `Total periodo: ${Math.round(total)} Kcal estimadas`;
  if(charts.cal) charts.cal.destroy();
  charts.cal = new Chart(ctx, {
    type:'line', data: { labels, datasets: [{ data, borderColor: '#f97316', backgroundColor:'rgba(249,115,22,0.1)', fill:true, tension:0.4, pointRadius:4 }] },
    options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{color:'#77a'}}, x:{ticks:{color:'#77a'}} } }
  });
}

function sumCals(sessArr, weight){
  return sessArr.reduce((acc, s)=>{
    const met = METS[s.program] || 5.0;
    return acc + (met * 3.5 * weight / 200 * (s.duration||20));
  }, 0);
}

function fillExSel(sessions){
  const sel = document.getElementById('exSel');
  const exs = new Set();
  sessions.forEach(s=>s.exercises.forEach(e=>exs.add(e.exercise)));
  
  // Ordenar alfabéticamente para facilitar la búsqueda
  const sortedExs = [...exs].sort();
  
  sel.innerHTML = sortedExs.map(e=>{
    // Acortamos el nombre para que no rompa el diseño en móviles
    // pero mantenemos el valor original (value) para que la gráfica funcione
    let label = e.split('.')[0].split('"')[0].trim();
    if(label.length > 28) label = label.substring(0, 25) + '...';
    return `<option value="${e}">${label}</option>`;
  }).join('') || '<option>Sin datos</option>';
}

function drawProgress(){
  const ex = document.getElementById('exSel').value;
  const ctx = document.getElementById('cProgress').getContext('2d');
  const sessions = DB.data(CU.id).sessions || [];
  const pts = [];
  sessions.slice().reverse().forEach(s=>{
    const found = s.exercises.find(e=>e.exercise===ex);
    if(found){
      const maxW=Math.max(...found.sets.map(st=>st.weight||0));
      const maxR=Math.max(...found.sets.map(st=>st.reps||0));
      pts.push({x:s.date, y:maxW>0?maxW:maxR});
    }
  });
  if(charts.progress) charts.progress.destroy();
  charts.progress = new Chart(ctx, {
    type:'line', data: { labels: pts.map(p=>p.x), datasets: [{ data: pts.map(p=>p.y), borderColor:'#a855f7', tension:0.3, pointRadius:5 }] },
    options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:false,ticks:{color:'#77a'}}, x:{ticks:{color:'#77a'}} } }
  });
}

function drawPRs(sessions){
  const prKg={}, prKm={};
  sessions.forEach(s=>{
    const isOt = s.program === 'ot';
    s.exercises.forEach(ex=>{
      ex.sets.forEach(set=>{
        if(isOt){
          const km = parseFloat(set.reps)||0;
          if(km>0 && (!(ex.exercise in prKm) || km > prKm[ex.exercise])) prKm[ex.exercise] = km;
        } else {
          const w = parseFloat(set.weight)||0;
          if(w>0 && (!(ex.exercise in prKg) || w > prKg[ex.exercise])) prKg[ex.exercise] = w;
        }
      });
    });
  });
  const el = document.getElementById('prList');
  const rKg = Object.entries(prKg).sort((a,b)=>b[1]-a[1]);
  const rKm = Object.entries(prKm).sort((a,b)=>b[1]-a[1]);
  const h = [ ...rKg.map(([n,v])=>`<div class="pr-row"><span>${n}</span><span class="pr-val">🏋️ ${v} kg</span></div>`), ...rKm.map(([n,v])=>`<div class="pr-row"><span>${n}</span><span class="pr-val">🏃 ${v} km</span></div>`) ];
  el.innerHTML = h.length ? h.slice(0,10).join('') : '<p class="sub">Registra entrenos para ver récords</p>';
}

function drawRecent(sessions){
  const el = document.getElementById('recentList');
  el.innerHTML = sessions.slice(0,5).map(s=>{
    let subtitle = s.sessionName || s.session || '';
    if(s.program === 'ot' && s.exercises && s.exercises.length){
      // Build "Actividad · Xkm" summary for OTRO sessions
      subtitle = s.exercises.map(ex=>{
        const totalKm = ex.sets.reduce((a,st)=>a+(parseFloat(st.reps)||0), 0);
        return totalKm > 0 ? `${ex.exercise} · ${totalKm % 1 === 0 ? totalKm : totalKm.toFixed(1)} km` : ex.exercise;
      }).join(', ');
    }
    return `
    <div class="sess-card" onclick="editSession('${s.id}')">
      <div class="between"><h4>${s.programName || PROGRAMS[s.program]?.n || s.program}</h4><span class="sub">${new Date(s.date+'T00:00:00').toLocaleDateString()}</span></div>
      <p class="sm">${subtitle}</p>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">
        <div class="badge coral">${s.duration || '?'} min</div>
        ${s.mood ? `<span class="mood-badge" title="${MOOD_LABELS[s.mood]}">${MOODS[s.mood]}</span>` : ''}
        <button class="repeat-btn" onclick="event.stopPropagation();repeatWorkout('${s.id}')" title="Repetir">🔁</button>
      </div>
    </div>`;
  }).join('') || '<p class="sub">No hay sesiones aún</p>';
}

// ── LOG WORKOUT ──
function initLog(){
  document.getElementById('log-step1').style.display='block';
  document.getElementById('log-step2').style.display='none';
  document.getElementById('logTitle').textContent = "Registrar entreno";
  if(document.getElementById('btnCancelEdit')) document.getElementById('btnCancelEdit').style.display = 'none';
  
  const g = document.getElementById('progGrid');
  g.innerHTML = Object.entries(PROGRAMS).map(([k,v])=>`
    <div class="prog-card" id="pc-${k}" onclick="selProg('${k}')">
      <div class="pe">${v.e}</div><h3>${v.n}</h3><p class="pd">${v.d}</p>
    </div>
  `).join('');
  document.getElementById('wDate').valueAsDate = new Date();
  document.getElementById('wDur').value = '';
  selProg('1a');
}

function selProg(k){
  document.querySelectorAll('.prog-card').forEach(c=>c.classList.remove('sel'));
  if(document.getElementById('pc-'+k)) document.getElementById('pc-'+k).classList.add('sel');
  // Only reset exercises when NOT in edit/repeat mode
  if(editIdx < 0 && !repeatMode) {
    currentWorkout = { program:k, exercises:[] };
  } else {
    currentWorkout.program = k;
  }
}

function goStep2(){
  const k = currentWorkout.program;
  currentWorkout.sessionName = (PROGRAMS[k]?.s || [])[0] || 'Sesión única';
  currentWorkout.date = document.getElementById('wDate').value;
  currentWorkout.duration = parseInt(document.getElementById('wDur').value)||20;
  currentWorkout.notes = currentWorkout.notes || '';
  if(!currentWorkout.date) return alert("Selecciona fecha");
  document.getElementById('log-step1').style.display='none';
  document.getElementById('log-step2').style.display='block';
  // Scroll al inicio para ver los ejercicios desde el primero
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.getElementById('step2Title').textContent = PROGRAMS[k].n;
  document.getElementById('step2Sub').textContent = currentWorkout.sessionName + ' · ' + currentWorkout.date;
  document.getElementById('timerPanel').style.display = CU.showTimers ? 'flex' : 'none';
  const t = document.getElementById('blockTabs'); const b = document.getElementById('exBlocks');
  t.innerHTML = ''; b.innerHTML = '';
  const blocks = PROGRAMS[k].b;
  blocks.forEach((bn, idx)=>{
    t.innerHTML += `<button class="btab ${idx===0?'act':''}" onclick="selBlock(${idx})">${bn.split(' ')[1]||bn}</button>`;
    const div = document.createElement('div'); div.id = 'block-'+idx; div.className='ex-block'; div.style.display = idx===0?'block':'none';
    const exs = EJERCICIOS[bn] || [bn];
    div.innerHTML = exs.map((ex,eidx)=>`
      <div class="ex-row ${k==='ot'?'ot-grid':''}">
        <div class="ex-name">${ex}</div>
        <div class="sets-header"><span>#</span><span>${k==='ot'?'Dist (km)':'Reps'}</span><span>${k==='ot'?'Tiempo (min)':'Peso (kg)'}</span><span>Nota</span></div>
        <div id="sets-${idx}-${eidx}"></div>
        <button class="add-set" onclick="addSet(${idx},${eidx})">+ Añadir serie</button>
      </div>
    `).join('');
    b.appendChild(div);
  });
  if(editIdx>-1 || repeatMode) fillEditData();
}

function selBlock(i){
  document.querySelectorAll('.ex-block').forEach(b=>b.style.display='none');
  document.querySelectorAll('.btab').forEach(b=>b.classList.remove('act'));
  document.getElementById('block-'+i).style.display='block';
  document.querySelectorAll('.btab')[i].classList.add('act');
}

function addSet(bi,ei,data=null){
  const c = document.getElementById(`sets-${bi}-${ei}`);
  const si = c.children.length + 1;
  const row = document.createElement('div'); row.className = 'set-row';
  
  // Valores por defecto: 10 reps, 0 kg si es una serie nueva (data == null)
  const reps = data ? data.r : 10;
  const weight = data ? data.w : 0;
  const note = data ? data.n : '';

  row.innerHTML = `<div class="set-num">${si}</div>
    <input type="number" class="in-r" placeholder="0" value="${reps}">
    <input type="number" step="0.1" class="in-w" placeholder="0" value="${weight}">
    <input type="text" class="in-n" placeholder="—" value="${note}">`;
  c.appendChild(row);
}

function goStep1(){
  document.getElementById('log-step2').style.display='none';
  document.getElementById('log-step1').style.display='block';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function saveWorkout(){
  const exs = [];
  document.querySelectorAll('.ex-block').forEach((block,bi)=>{
    block.querySelectorAll('.ex-row').forEach((row,ei)=>{
      const name = row.querySelector('.ex-name').textContent;
      const sets = [];
      row.querySelectorAll('.set-row').forEach(sr=>{
        const w = sr.querySelector('.in-w').value; const r = sr.querySelector('.in-r').value; const n = sr.querySelector('.in-n').value;
        if(w || r) sets.push({ weight:parseFloat(w)||0, reps:parseFloat(r)||0, note:n });
      });
      if(sets.length) exs.push({ exercise:name, sets });
    });
  });
  if(!exs.length) return alert("Mínimo un ejercicio");
  currentWorkout.exercises = exs;
  const d = DB.data(CU.id);
  // Snapshot prev sessions for PR comparison BEFORE saving
  const prevSessions = editIdx > -1 ? d.sessions.filter((_,i) => i !== editIdx) : [...d.sessions];
  if(editIdx > -1) {
    lastSavedSessionId = d.sessions[editIdx].id;
    d.sessions[editIdx] = {...d.sessions[editIdx], ...currentWorkout}; editIdx = -1;
  } else {
    currentWorkout.id = 's'+Date.now();
    lastSavedSessionId = currentWorkout.id;
    d.sessions.unshift(currentWorkout);
  }
  DB.save(CU.id, d); stopStopwatch(); repeatMode = false;
  showPostWorkoutModal(detectNewPRs(exs, prevSessions, currentWorkout.program));
}

function detectNewPRs(exercises, prevSessions, program){
  const isOt = program === 'ot';
  const newPRs = [];
  exercises.forEach(ex => {
    const currentMax = Math.max(...ex.sets.map(st => isOt ? (parseFloat(st.reps)||0) : (parseFloat(st.weight)||0)));
    if(currentMax <= 0) return;
    let prevBest = 0, hadPrev = false;
    prevSessions.forEach(s => {
      const found = s.exercises.find(e => e.exercise === ex.exercise);
      if(found){ hadPrev = true; found.sets.forEach(st => { const v = isOt ? (parseFloat(st.reps)||0) : (parseFloat(st.weight)||0); if(v > prevBest) prevBest = v; }); }
    });
    if(hadPrev && currentMax > prevBest) newPRs.push({ exercise: ex.exercise, old: prevBest, new: currentMax, unit: isOt ? 'km' : 'kg' });
  });
  return newPRs;
}

function showPostWorkoutModal(prs){
  selectedMood = 0;
  document.querySelectorAll('.pw-mb').forEach(b => b.classList.remove('sel'));
  const hasPR = prs.length > 0;
  document.getElementById('pwBigEmoji').textContent = hasPR ? '🏆' : '💪';
  document.getElementById('pwTitle').textContent = hasPR ? '¡Nuevos récords! 🎉' : '¡Entreno guardado!';
  document.getElementById('pwSub').textContent = hasPR
    ? `${prs.length} récord${prs.length > 1 ? 's' : ''} personal${prs.length > 1 ? 'es' : ''} superado${prs.length > 1 ? 's' : ''}`
    : 'Sigue así, campeón/a 💫';
  const prSec = document.getElementById('pwPRSection');
  if(hasPR){
    prSec.style.display = 'block';
    const shortName = n => n.split('"')[0].split('.')[0].trim().split(' ').slice(0,5).join(' ');
    document.getElementById('pwPRList').innerHTML = prs.slice(0,3).map(pr =>
      `<div class="pw-pr-chip">🔥 ${shortName(pr.exercise)}<strong>${pr.old} → ${pr.new} ${pr.unit}</strong></div>`
    ).join('');
    launchConfetti();
  } else {
    prSec.style.display = 'none';
  }
  document.getElementById('postWorkoutModal').style.display = 'flex';
}

function selectMood(n){
  selectedMood = n;
  document.querySelectorAll('.pw-mb').forEach(b => b.classList.toggle('sel', parseInt(b.dataset.mood) === n));
}

function closePostWorkout(){
  document.getElementById('postWorkoutModal').style.display = 'none';
  if(selectedMood > 0 && lastSavedSessionId){
    const d = DB.data(CU.id);
    const s = d.sessions.find(x => x.id === lastSavedSessionId);
    if(s){ s.mood = selectedMood; DB.save(CU.id, d); }
  }
  showTab('dashboard');
}

function launchConfetti(){
  const colors = ['#a855f7','#f97316','#22c55e','#3b82f6','#f472b6','#fbbf24','#60a5fa'];
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden';
  document.body.appendChild(wrap);
  for(let i=0; i<65; i++){
    const el = document.createElement('div');
    const size = Math.random()*9+4;
    el.style.cssText = `position:absolute;top:-12px;left:${Math.random()*100}%;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'3px'};animation:confettiFall ${Math.random()*2.5+2}s ${Math.random()*1.5}s ease-in forwards`;
    wrap.appendChild(el);
  }
  setTimeout(() => wrap.remove(), 5500);
}

// ── TIMER ──
let swT=0, swI=null;
function toggleStopwatch(){ 
  if(swI){ clearInterval(swI); swI=null; document.getElementById('btnSwToggle').textContent='▶️'; }
  else { swI=setInterval(()=>{ swT++; const f=fmtT(swT); document.getElementById('swDisplay').textContent=f; document.getElementById('navTimer').textContent=f; document.getElementById('navTimer').style.display='block'; },1000); document.getElementById('btnSwToggle').textContent='⏸️'; } 
}
function resetStopwatch(){ clearInterval(swI); swI=null; swT=0; document.getElementById('swDisplay').textContent='00:00:00'; document.getElementById('navTimer').style.display='none'; document.getElementById('btnSwToggle').textContent='▶️'; }
function stopStopwatch(){ clearInterval(swI); swI=null; swT=0; document.getElementById('navTimer').style.display='none'; }
function fmtT(s){ return new Date(s*1000).toISOString().substr(11,8); }
function startRest(s){
  let t=s; const el=document.getElementById('restDisplay'); el.textContent=t+'s';
  const i=setInterval(()=>{ t--; el.textContent=t+'s'; if(t<=0){ clearInterval(i); el.textContent='LISTO'; if(navigator.vibrate) navigator.vibrate([200,100,200]); } },1000);
}

// ── HISTORY ──
function drawHistory(){
  const d = DB.data(CU.id);
  // Ordenar por fecha descendente (más reciente arriba)
  const sess = (d.sessions || []).sort((a,b)=>b.date.localeCompare(a.date));
  const sel = document.getElementById('histFilter');
  const cur = sel.value;

  // Poblar filtro con programas que existen en las sesiones
  const progs = [...new Set(sess.map(s=>s.program))];
  let h = '<option value="">Todos los programas</option>';
  progs.sort().forEach(p=>{
    const name = PROGRAMS[p]?.n || p;
    h += `<option value="${p}" ${p===cur?'selected':''}>${name}</option>`;
  });
  if(sel.innerHTML !== h) sel.innerHTML = h;

  const filt = sel.value;
  const filtered = filt ? sess.filter(s=>s.program===filt) : sess;
  document.getElementById('histCount').textContent = `${filtered.length} sesiones`;
  document.getElementById('histList').innerHTML = filtered.map(s=>`
    <div class="card">
      <div class="between mb14">
        <div><h3>${s.programName || PROGRAMS[s.program]?.n || s.program}</h3><p class="sub">${new Date(s.date+'T00:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p></div>
        <div class="flex">${s.mood ? `<span class="mood-badge" title="${MOOD_LABELS[s.mood]}">${MOODS[s.mood]}</span>` : ''}<button class="btn btn-sec btn-sm" onclick="repeatWorkout('${s.id}')" title="Repetir">🔁</button><button class="btn btn-sec btn-sm" onclick="editSession('${s.id}')">✏️</button><button class="btn btn-red btn-sm" onclick="deleteSession('${s.id}')">🗑️</button></div>
      </div>
      ${s.program !== 'ot' ? `<p class="sub"><b>${s.sessionName || s.session || ''}</b> • ${s.duration || '?'} min</p>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px" class="mt14">
        ${s.exercises.map(ex=>`<div style="font-size:.75rem;background:var(--card2);padding:8px;border-radius:10px"><span style="color:var(--p2);font-weight:700">${ex.exercise}</span><br>${ex.sets.map(st=> s.program==='ot' ? `${st.reps}km/${st.weight}min` : `${st.reps}x${st.weight}kg`).join(' · ')}</div>`).join('')}
      </div>
    </div>
  `).join('') || '<p class="empty">Vacío</p>';
}
function deleteSession(id){ if(confirm("¿Borrar?")){ const d=DB.data(CU.id); d.sessions=d.sessions.filter(s=>s.id!==id); DB.save(CU.id,d); drawHistory(); } }
function editSession(id){
  const d=DB.data(CU.id);
  editIdx = d.sessions.findIndex(s=>s.id===id);
  currentWorkout = JSON.parse(JSON.stringify(d.sessions[editIdx])); // deep copy to preserve exercises
  showTab('log');
}
function initLogForEdit(){
  document.getElementById('log-step1').style.display='block';
  document.getElementById('log-step2').style.display='none';
  document.getElementById('logTitle').textContent = "Editar entreno";
  const btn = document.getElementById('btnCancelEdit');
  if(btn){ btn.textContent = '❌ Cancelar edición'; btn.style.display = 'block'; }

  const g = document.getElementById('progGrid');
  g.innerHTML = Object.entries(PROGRAMS).map(([k,v])=>`
    <div class="prog-card" id="pc-${k}" onclick="selProg('${k}')">
      <div class="pe">${v.e}</div><h3>${v.n}</h3><p class="pd">${v.d}</p>
    </div>
  `).join('');

  // Mark the correct program as selected WITHOUT resetting exercises
  document.querySelectorAll('.prog-card').forEach(c=>c.classList.remove('sel'));
  const k = currentWorkout.program;
  if(document.getElementById('pc-'+k)) document.getElementById('pc-'+k).classList.add('sel');

  // Fill step1 form with saved values
  document.getElementById('wDate').value = currentWorkout.date;
  document.getElementById('wDur').value = currentWorkout.duration;
}
function cancelEdit(){ const wasRepeat=repeatMode; editIdx=-1; repeatMode=false; showTab(wasRepeat?'dashboard':'history'); }
function fillEditData(){
  const allBlocks = Array.from(document.querySelectorAll('.ex-block'));
  currentWorkout.exercises.forEach(ex=>{
    document.querySelectorAll('.ex-row').forEach((row)=>{
      if(row.querySelector('.ex-name').textContent.trim() === ex.exercise.trim()){
        const bi = allBlocks.findIndex(b=>b.contains(row));
        const blockRows = allBlocks[bi] ? Array.from(allBlocks[bi].querySelectorAll('.ex-row')) : [];
        const ei = blockRows.indexOf(row);
        if(bi >= 0 && ei >= 0){
          ex.sets.forEach(st=>addSet(bi, ei, {w:st.weight, r:st.reps, n:st.note||''}));
        }
      }
    });
  });
}

function repeatWorkout(id){
  const d = DB.data(CU.id);
  const sess = d.sessions.find(s => s.id === id);
  if(!sess) return;
  currentWorkout = JSON.parse(JSON.stringify(sess));
  currentWorkout.date = new Date().toISOString().split('T')[0];
  delete currentWorkout.id; delete currentWorkout.mood;
  repeatMode = true; editIdx = -1;
  showTab('log');
}

function initLogForRepeat(){
  document.getElementById('log-step1').style.display = 'block';
  document.getElementById('log-step2').style.display = 'none';
  document.getElementById('logTitle').textContent = '🔁 Repetir entreno';
  const btn = document.getElementById('btnCancelEdit');
  if(btn){ btn.textContent = '❌ Cancelar'; btn.style.display = 'block'; }
  const g = document.getElementById('progGrid');
  g.innerHTML = Object.entries(PROGRAMS).map(([k,v])=>`
    <div class="prog-card" id="pc-${k}" onclick="selProg('${k}')">
      <div class="pe">${v.e}</div><h3>${v.n}</h3><p class="pd">${v.d}</p>
    </div>
  `).join('');
  document.querySelectorAll('.prog-card').forEach(c=>c.classList.remove('sel'));
  const k = currentWorkout.program;
  if(document.getElementById('pc-'+k)) document.getElementById('pc-'+k).classList.add('sel');
  document.getElementById('wDate').valueAsDate = new Date();
  document.getElementById('wDur').value = currentWorkout.duration || '';
}

function drawWeeklyGoal(sessions){
  const el = document.getElementById('weekGoalCard');
  if(!el) return;
  const user = DB.getUsers().find(u => u.id === CU.id);
  const goal = parseInt(user?.weekGoal) || 0;
  if(!goal){ el.style.display='none'; return; }
  el.style.display='';
  const now = new Date();
  const dow = now.getDay();
  const diffToMonday = dow===0 ? 6 : dow-1;
  const ws = new Date(now); ws.setDate(now.getDate()-diffToMonday); ws.setHours(0,0,0,0);
  const weekDates = [...new Set(sessions.filter(s=>new Date(s.date+'T00:00:00')>=ws).map(s=>s.date))];
  const done = weekDates.length;
  const pct = Math.min(100, Math.round((done/goal)*100));
  const remaining = Math.max(0, goal-done);
  const dayNames = ['L','M','X','J','V','S','D'];
  const dayDots = dayNames.map((d,i)=>{
    const dd = new Date(ws); dd.setDate(ws.getDate()+i);
    const dateStr = dd.toISOString().split('T')[0];
    let cls='wg-day';
    if(weekDates.includes(dateStr)) cls+=' done';
    else if(i===diffToMonday) cls+=' today';
    return `<div class="${cls}">${d}</div>`;
  }).join('');
  const text = done>=goal ? '¡Meta semanal conseguida! 🎉' : remaining===1 ? '¡1 día más y lo consigues!' : `Faltan ${remaining} días`;
  document.getElementById('wgCount').textContent = `${done}/${goal}`;
  document.getElementById('wgText').textContent = text;
  const fill = document.getElementById('wgBarFill');
  fill.style.width = pct+'%';
  fill.style.background = done>=goal ? 'linear-gradient(135deg,#22c55e,#4ade80)' : 'linear-gradient(135deg,var(--p1),var(--coral))';
  document.getElementById('wgDays').innerHTML = dayDots;
}

// ── SETTINGS ──
function initSettings(){
  document.getElementById('sName').value=CU.name; document.getElementById('sTheme').value=CU.theme; document.getElementById('sShowTimers').checked=CU.showTimers;
  const user = DB.getUsers().find(u=>u.id===CU.id);
  document.getElementById('sSex').value=user.sex||''; document.getElementById('sAge').value=user.age||''; document.getElementById('sHeight').value=user.height||''; document.getElementById('sWeight').value=user.weight||'';
  const wgEl=document.getElementById('sWeekGoal'); if(wgEl) wgEl.value=user.weekGoal||'';
  updateHealthUI();
}
function saveSettings(){
  CU.name=document.getElementById('sName').value; CU.theme=document.getElementById('sTheme').value; CU.showTimers=document.getElementById('sShowTimers').checked;
  const u=DB.getUsers(); const i=u.findIndex(x=>x.id===CU.id);
  u[i]={...u[i],...CU,sex:document.getElementById('sSex').value,age:document.getElementById('sAge').value,height:document.getElementById('sHeight').value,weight:document.getElementById('sWeight').value,weekGoal:parseInt(document.getElementById('sWeekGoal')?.value||'0')||0};
  DB.setUsers(u); alert("Guardado"); location.reload();
}
function updateHealthUI(){
  const s=document.getElementById('sSex').value, a=parseInt(document.getElementById('sAge').value), h=parseInt(document.getElementById('sHeight').value), w=parseFloat(document.getElementById('sWeight').value);
  if(h && w) document.getElementById('bmiVal').textContent=(w/((h/100)**2)).toFixed(1);
  if(s && a && h && w){ let bmr=(10*w)+(6.25*h)-(5*a); document.getElementById('bmrVal').textContent=Math.round(s==='M'?bmr+5:bmr-161); }
}
function exportData(){ const d=DB.data(CU.id); const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`backup_${CU.name}.json`; a.click(); }
function importData(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const j = JSON.parse(ev.target.result);

      // ── Detectar formato: viejo (_tt_export) o nuevo ({sessions:[]})
      let rawSessions = null;
      if(j._tt_export && Array.isArray(j.sessions)) {
        // Formato antiguo del monolítico HTML
        rawSessions = j.sessions;
      } else if(Array.isArray(j.sessions)) {
        // Formato nuevo modular
        rawSessions = j.sessions;
      }
      if(!rawSessions) return alert('Formato de archivo no reconocido.');

      // ── Normalizar campos para compatibilidad hacia atrás
      const normalized = rawSessions.map(s => ({
        ...s,
        // Unificar nombre de sesión: viejo='session', nuevo='sessionName'
        sessionName: s.sessionName || s.session || 'Sesión',
        // Conservar nombre legible del programa por si el ID ya no existe
        programName: s.programName || PROGRAMS[s.program]?.n || s.program || 'Programa',
        programEm:   s.programEm   || PROGRAMS[s.program]?.e || '💪',
        // Garantizar que exercises existe
        exercises: Array.isArray(s.exercises) ? s.exercises : []
      }));

      // ── Fusionar (merge): no sobreescribir, solo añadir los que no existen
      const d = DB.data(CU.id);
      const existing = new Set(d.sessions.map(x => x.id));
      let added = 0;
      normalized.forEach(s => { if(!existing.has(s.id)){ d.sessions.push(s); added++; } });
      d.sessions.sort((a,b) => b.date.localeCompare(a.date));
      DB.save(CU.id, d);

      alert(`✅ Importación completada: ${added} sesión${added!==1?'es':''} nueva${added!==1?'s':''} añadida${added!==1?'s':''}${added===0?' (todas ya existían)':''}`);
      location.reload();
    } catch(err) {
      alert('Error al leer el archivo. ¿Es un JSON válido exportado desde TrisTras?');
    }
  };
  r.readAsText(f);
}
function resetData(){ if(confirm("¿BORRAR TODO?")) { DB.save(CU.id,{sessions:[]}); location.reload(); } }
