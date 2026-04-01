/* ══════════════════════════════════════════════════════════════════
   TrisTras — App Logic (v1.2)
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
  save: (id, d) => localStorage.setItem('tt_data_'+id, JSON.stringify(d))
};

// ── CATALOG & PROGRAMS ──
const PROGRAMS = {
  'fnt': { n:'Fuerza Nivel Tierra', d:'Base sólida de fuerza corporal', e:['🦵 Tren Inferior','💪 Tren Superior','🍫 Core / Abdomen'] },
  'fni': { n:'Fuerza Nivel Infierno', d:'Resistencia muscular extrema', e:['🔥 Burn 1','🔥 Burn 2', '🔥 Burn 3'] },
  'fnv': { n:'Fuerza Nivel Vida', d:'Movilidad y salud integral', e:['🧘 Movilidad','🏃 Cardio suave','🛡️ Resiliencia'] },
  'ot':  { n:'OTRO', d:'Cardio, Deporte o Libre', e:['🏃 Correr','🚶 Caminar','🚴 Ciclismo','⚽ Deporte','🏊 Natación'] }
};

const EJERCICIOS = {
  '🦵 Tren Inferior': ['Sentadilla 90º','Sentadilla sumo','Zancadas alternas','Puente de glúteo','Subida al cajón/silla'],
  '💪 Tren Superior': ['Flexiones rodillas/suelo','Fondos tríceps silla','Remo con peso','Plancha con toque hombro','Press militar'],
  '🍫 Core / Abdomen': ['Crunch abdominal','Plancha frontal','Plancha lateral','Bicho muerto','Escaladores'],
  '🔥 Burn 1': ['Burpees','Mountain Climbers','Sentadilla salto','Flexiones diamante','Superman'],
  '🔥 Burn 2': ['Zancada salto','Plancha comando','Abdominales tijera','Jumping Jacks','Flexiones declinadas'],
  '🔥 Burn 3': ['Bear crawl (Paso oso)','Sentadilla isométrica','Hollow hold','Flexiones explosivas','Sprint en el sitio'],
  '🧘 Movilidad': ['Gato-Camello','Perro boca abajo','Aperturas torácicas','Rotación cadera','Estiramiento psoas'],
  '🏃 Cardio suave': ['Caminar ritmo ligero','Trote suave'],
  '🛡️ Resiliencia': ['Plancha estática','V-Up','Isometría piernas'],
  '🏃 Correr': ['Running'], '🚶 Caminar': ['Caminata'], '🚴 Ciclismo': ['Bici / Spin'], '⚽ Deporte': ['Fútbol','Pádel','Tenis','Yoga'], '🏊 Natación': ['Natación']
};

const METS = { 'fnt':6.0, 'fni':8.5, 'fnv':4.0, 'ot':7.0 };

// ── APP STATE ──
let hmDate = new Date();
let currentWorkout = null;
let editIdx = -1;
let calPeriod = 'week';
let charts = {};

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
  c.innerHTML = u.map(x=>`<div class="chip" onclick="login('${x.id}')">${x.name}</div>`).join('') || '<p class="sub">No hay usuarios aún</p>';
}

function createUser(){
  const n = document.getElementById('newName').value.trim();
  const p = document.getElementById('newPin').value.trim();
  if(!n) return alert("Escribe un nombre");
  const id=n.toLowerCase()+Math.floor(Math.random()*1000);
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
    document.getElementById('pinInput').focus();
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
  
  document.getElementById('navName').textContent = CU.name;
  document.getElementById('navAvatar').textContent = CU.name[0].toUpperCase();
  document.getElementById('greeting').textContent = `¡Hola, ${CU.name}! 👋`;
  
  showTab('dashboard');
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
  document.getElementById('sTheme').value = t;
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
  document.getElementById('nt-'+t).classList.add('act');
  document.getElementById('mn-'+t).classList.add('act');
  if(t==='dashboard') drawDashboard();
  if(t==='log' && editIdx<0) initLog();
  if(t==='history') drawHistory();
  if(t==='settings') initSettings();
  window.scrollTo(0,0);
}

// ── DASHBOARD ──
function drawDashboard(){
  const d = DB.data(CU.id);
  const sessions = d.sessions || [];
  
  // Stats
  document.getElementById('s-total').textContent = sessions.length;
  document.getElementById('s-weeks').textContent = '—'; // Placeholder logic
  
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthMins = sessions.filter(s=>new Date(s.date)>=startMonth).reduce((a,c)=>a+(c.duration||0),0);
  document.getElementById('s-mins').textContent = thisMonthMins;
  
  const totalMins = sessions.reduce((a,c)=>a+(c.duration||0),0);
  document.getElementById('s-hours').textContent = (totalMins/60).toFixed(1);
  
  const streak = calcStreak(sessions);
  document.getElementById('s-streak').textContent = streak;
  document.getElementById('s-best-streak').textContent = Math.max(streak, parseInt(localStorage.getItem('tt_best_streak_'+CU.id)||0));
  localStorage.setItem('tt_best_streak_'+CU.id, document.getElementById('s-best-streak').textContent);
  
  // Constancia 90 días
  document.getElementById('s-consist').textContent = calcConsistency(sessions) + '%';

  // Récord de distancia (Máximo individual en una serie)
  let maxKm = 0;
  sessions.forEach(s=>{
    if(s.program==='ot') s.exercises.forEach(ex=>ex.sets.forEach(st=>{
      const val = parseFloat(st.reps)||0;
      if(val > maxKm) maxKm = val;
    }));
  });
  document.getElementById('s-km').textContent = maxKm % 1 === 0 ? maxKm : maxKm.toFixed(1);

  drawWeekly(sessions);
  fillExSel(sessions);
  drawProgress();
  drawPRs(sessions);
  drawRecent(sessions);
  drawMonthlyHeatmap();
}

function calcStreak(sessions){
  if(!sessions.length) return 0;
  const dates = [...new Set(sessions.map(s=>s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now()-864e5).toISOString().split('T')[0];
  if(dates[0]!==today && dates[0]!==yesterday) return 0;
  let s=1;
  for(let i=0; i<dates.length-1; i++){
    const d1=new Date(dates[i]), d2=new Date(dates[i+1]);
    if((d1-d2)/864e5 <= 1.1) s++; else break;
  }
  return s;
}

function calcConsistency(sessions){
  if(!sessions.length) return 0;
  const ninetyDaysAgo = new Date(Date.now() - 90*864e5).toISOString().split('T')[0];
  const activeDays = [...new Set(sessions.filter(s=>s.date>=ninetyDaysAgo).map(s=>s.date))].length;
  // Ideal: 3 entrenos/semana = 38 días en 90 días
  return Math.min(100, Math.round((activeDays / 38) * 100));
}

// ── HEATMAP MEJORADO ──
function navHeatmap(dir) {
  if (dir === 0) hmDate = new Date();
  else hmDate.setMonth(hmDate.getMonth() + dir);
  drawMonthlyHeatmap();
}

function drawMonthlyHeatmap() {
  const container = document.getElementById('hmGrid');
  const monthLab = document.getElementById('hmMonth');
  if (!container) return;

  const sessions = DB.data(CU.id).sessions || [];
  const year = hmDate.getFullYear();
  const month = hmDate.getMonth();
  
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  monthLab.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1); // Lunes=0

  container.innerHTML = '';
  const dayNames = ['L','M','X','J','V','S','D'];
  dayNames.forEach(d => container.innerHTML += `<div style="text-align:center;font-size:0.6rem;color:var(--muted);font-weight:800;padding-bottom:5px">${d}</div>`);

  for (let i = 0; i < startOffset; i++) container.innerHTML += '<div></div>';

  const dailyData = {};
  sessions.forEach(s => {
    const d = new Date(s.date);
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
    let cls = 'hm-day';
    let tip = '';
    
    if (data) {
      cls += ' train';
      if (data.count <= 3) cls += ' lv1';
      else if (data.count <= 6) cls += ' lv2';
      else if (data.count <= 10) cls += ' lv3';
      else cls += ' lv4';
      tip = `${data.progs.join(', ')} (${data.count} exs)`;
    }
    
    if (isThisMonth && d === today.getDate()) cls += ' today';

    const el = document.createElement('div');
    el.className = cls;
    el.textContent = d;
    el.style.animationDelay = (d * 0.01) + 's';
    if(tip) el.setAttribute('data-tip', tip);
    
    el.onclick = () => {
      if(data) alert(`Día ${d}: ${tip}`);
    };

    container.appendChild(el);
  }
}

// ── CHARTS ──
function drawWeekly(sessions){
  const ctx = document.getElementById('cWeekly').getContext('2d');
  const weeks = [];
  for(let i=7; i>=0; i--){
    const d = new Date(); d.setDate(d.getDate() - (i*7));
    const start = new Date(d); start.setDate(d.getDate() - d.getDay() + 1); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    weeks.push({
      label: `S${getWeekNumber(start)}`,
      count: sessions.filter(s=>{ const sd=new Date(s.date); return sd>=start && sd<=end; }).length
    });
  }
  if(charts.weekly) charts.weekly.destroy();
  charts.weekly = new Chart(ctx, {
    type:'bar',
    data: { labels: weeks.map(w=>w.label), datasets: [{ data: weeks.map(w=>w.count), backgroundColor: getComputedStyle(document.body).getPropertyValue('--p1'), borderRadius:6 }] },
    options: { maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{stepSize:1,color:'#77a'}}, x:{ticks:{color:'#77a'}} } }
  });
  drawCalChart(sessions);
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
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
      const ds=d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('es-ES',{weekday:'short'}));
      data.push(sumCals(sessions.filter(s=>s.date===ds), weight));
    }
  } else if(calPeriod==='lastweek'){
    for(let i=13;i>=7;i--){
      const d=new Date(now); d.setDate(d.getDate()-i);
      const ds=d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('es-ES',{weekday:'short'}));
      data.push(sumCals(sessions.filter(s=>s.date===ds), weight));
    }
  } else if(calPeriod==='4weeks'){
    for(let i=3;i>=0;i--){
      const end=new Date(now); end.setDate(end.getDate()-(i*7));
      const start=new Date(end); start.setDate(start.getDate()-6);
      labels.push(`Sem -${i}`);
      data.push(sumCals(sessions.filter(s=>{const d=new Date(s.date); return d>=start && d<=end}), weight));
    }
  } else {
    for(let i=11;i>=0;i--){
      const d=new Date(now.getFullYear(), now.getMonth()-i, 1);
      labels.push(d.toLocaleDateString('es-ES',{month:'short'}));
      data.push(sumCals(sessions.filter(s=>{const sd=new Date(s.date); return sd.getMonth()===d.getMonth() && sd.getFullYear()===d.getFullYear()}), weight));
    }
  }

  const total = data.reduce((a,b)=>a+b,0);
  document.getElementById('calBurnInfo').textContent = `Total del periodo: ${Math.round(total)} Kcal estimadas`;

  if(charts.cal) charts.cal.destroy();
  charts.cal = new Chart(ctx, {
    type:'line',
    data: { labels, datasets: [{ data, borderColor: getComputedStyle(document.body).getPropertyValue('--coral'), backgroundColor:'rgba(249,115,22,0.1)', fill:true, tension:0.4, pointRadius:4 }] },
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
  sel.innerHTML = [...exs].map(e=>`<option value="${e}">${e}</option>`).join('') || '<option>Sin ejercicios</option>';
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
    type:'line',
    data: { labels: pts.map(p=>p.x), datasets: [{ data: pts.map(p=>p.y), borderColor:getComputedStyle(document.body).getPropertyValue('--p1'), tension:0.3, pointRadius:5 }] },
    options: { maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:false,ticks:{color:'#77a'}}, x:{ticks:{color:'#77a'}} } }
  });
}

function drawPRs(sessions){
  const prsKg={};   
  const prsKm={};   

  sessions.forEach(s=>{
    const isOt = s.program === 'ot';
    s.exercises.forEach(ex=>{
      ex.sets.forEach(set=>{
        if(isOt){
          const km = parseFloat(set.reps)||0;
          if(km>0 && (!(ex.exercise in prsKm) || km > prsKm[ex.exercise]))
            prsKm[ex.exercise] = km;
        } else {
          const w = parseFloat(set.weight)||0;
          if(w>0 && (!(ex.exercise in prsKg) || w > prsKg[ex.exercise]))
            prsKg[ex.exercise] = w;
        }
      });
    });
  });

  const el = document.getElementById('prList');
  const rowsKg = Object.entries(prsKg).sort((a,b)=>b[1]-a[1]);
  const rowsKm = Object.entries(prsKm).sort((a,b)=>b[1]-a[1]);
  
  const allHtml = [
    ...rowsKg.map(([n,v])=>`<div class="pr-row"><span>${n}</span><span class="pr-val">🏋️ ${v} kg</span></div>`),
    ...rowsKm.map(([n,v])=>`<div class="pr-row"><span>${n}</span><span class="pr-val">🏃 ${v} km</span></div>`)
  ];
  el.innerHTML = allHtml.length
    ? allHtml.slice(0,10).join('')
    : '<p class="sub">Registra entrenamientos con peso o distancia para ver tus récords</p>';
}

function drawRecent(sessions){
  const el = document.getElementById('recentList');
  el.innerHTML = sessions.slice(0,5).map(s=>`
    <div class="sess-card" onclick="editSession('${s.id}')">
      <div class="between">
        <h4>${PROGRAMS[s.program]?.n || s.program}</h4>
        <span class="sub">${new Date(s.date).toLocaleDateString()}</span>
      </div>
      <p class="sm">${s.sessionName}</p>
      <div class="badge coral">${s.duration} min</div>
    </div>
  `).join('') || '<p class="sub">No hay entrenos recientes</p>';
}

// ── WORKOUT LOGGING ──
function initLog(){
  const g = document.getElementById('progGrid');
  g.innerHTML = Object.entries(PROGRAMS).map(([k,v])=>`
    <div class="prog-card" id="pc-${k}" onclick="selProg('${k}')">
      <div class="pe">${k==='fnt'?'🌍':k==='fni'?'🔥':k==='fnv'?'🧘':'🏷️'}</div>
      <h3>${v.n}</h3>
      <p class="pd">${v.d}</p>
    </div>
  `).join('');
  document.getElementById('wDate').valueAsDate = new Date();
  document.getElementById('wDur').value = '';
  document.getElementById('wNotes').value = '';
  selProg('fnt');
}

function selProg(k){
  document.querySelectorAll('.prog-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('pc-'+k).classList.add('sel');
  currentWorkout = { program:k, exercises:[] };
  const s = document.getElementById('sessSelect');
  if(k==='ot'){
    s.innerHTML = EJERCICIOS['🏃 Correr'].concat(EJERCICIOS['🚶 Caminar']).map(e=>`<option>${e}</option>`).join('');
  } else {
    s.innerHTML = [1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<option>Sesión ${n}</option>`).join('');
  }
}

function goStep2(){
  const k = currentWorkout.program;
  currentWorkout.sessionName = document.getElementById('sessSelect').value;
  currentWorkout.date = document.getElementById('wDate').value;
  currentWorkout.duration = parseInt(document.getElementById('wDur').value)||20;
  currentWorkout.notes = document.getElementById('wNotes').value;
  
  if(!currentWorkout.date) return alert("Selecciona una fecha");

  document.getElementById('log-step1').style.display='none';
  document.getElementById('log-step2').style.display='block';
  document.getElementById('step2Title').textContent = PROGRAMS[k].n;
  document.getElementById('step2Sub').textContent = currentWorkout.sessionName;
  
  document.getElementById('timerPanel').style.display = CU.showTimers ? 'flex' : 'none';

  const t = document.getElementById('blockTabs');
  const b = document.getElementById('exBlocks');
  t.innerHTML = ''; b.innerHTML = '';

  const blocks = k==='ot' ? [EJERCICIOS['🏃 Correr'][0], EJERCICIOS['🚶 Caminar'][0], EJERCICIOS['🚴 Ciclismo'][0], EJERCICIOS['⚽ Deporte'][0]] : PROGRAMS[k].e;
  
  blocks.forEach((bn, idx)=>{
    t.innerHTML += `<button class="btab ${idx===0?'act':''}" onclick="selBlock(${idx})">${bn.split(' ')[1]||bn}</button>`;
    const div = document.createElement('div');
    div.id = 'block-'+idx; div.className='ex-block'; div.style.display = idx===0?'block':'none';
    const exs = EJERCICIOS[bn] || [bn];
    div.innerHTML = exs.map((ex,eidx)=>`
      <div class="ex-row ${k==='ot'?'ot-grid':''}">
        <div class="ex-name">${ex}</div>
        <div class="sets-header">
          <span>#</span>
          <span>${k==='ot'?'Distancia':'Peso'}</span>
          <span>${k==='ot'?'Minutos':'Reps'}</span>
          <span>RPE</span>
          ${k==='ot'?'<span>Tipo</span>':''}
        </div>
        <div id="sets-${idx}-${eidx}"></div>
        <button class="add-set" onclick="addSet(${idx},${eidx},'${ex}')">+ Añadir serie</button>
      </div>
    `).join('');
    b.appendChild(div);
  });
  
  if(editIdx>-1) fillEditData();
}

function selBlock(i){
  document.querySelectorAll('.ex-block').forEach(b=>b.style.display='none');
  document.querySelectorAll('.btab').forEach(b=>b.classList.remove('act'));
  document.getElementById('block-'+i).style.display='block';
  document.querySelectorAll('.btab')[i].classList.add('act');
}

function addSet(bi,ei,exName,data=null){
  const c = document.getElementById(`sets-${bi}-${ei}`);
  const si = c.children.length + 1;
  const row = document.createElement('div');
  row.className = 'set-row';
  row.innerHTML = `
    <div class="set-num">${si}</div>
    <input type="number" step="0.1" class="in-w" placeholder="0" value="${data?.w||''}">
    <input type="number" class="in-r" placeholder="0" value="${data?.r||''}">
    <select class="in-rpe">
      ${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${data?.rpe==n?'selected':''}>${n}</option>`).join('')}
    </select>
    ${currentWorkout.program==='ot' ? `<select class="in-type"><option>Fijo</option><option>Intervalos</option></select>` : ''}
  `;
  c.appendChild(row);
}

function goStep1(){ document.getElementById('log-step2').style.display='none'; document.getElementById('log-step1').style.display='block'; }

function saveWorkout(){
  const exs = [];
  document.querySelectorAll('.ex-block').forEach((block,bi)=>{
    block.querySelectorAll('.ex-row').forEach((row,ei)=>{
      const name = row.querySelector('.ex-name').textContent;
      const sets = [];
      row.querySelectorAll('.set-row').forEach(sr=>{
        const w = sr.querySelector('.in-w').value;
        const r = sr.querySelector('.in-r').value;
        if(w || r) sets.push({ weight:parseFloat(w)||0, reps:parseInt(r)||0, rpe:parseInt(sr.querySelector('.in-rpe').value) });
      });
      if(sets.length) exs.push({ exercise:name, sets });
    });
  });
  
  if(!exs.length) return alert("Registra al menos un ejercicio");
  
  currentWorkout.exercises = exs;
  const d = DB.data(CU.id);
  if(editIdx > -1) { d.sessions[editIdx] = {...d.sessions[editIdx], ...currentWorkout}; editIdx=-1; }
  else { currentWorkout.id = Date.now().toString(); d.sessions.unshift(currentWorkout); }
  
  DB.save(CU.id, d);
  alert("¡Entrenamiento guardado! 💪");
  showTab('dashboard');
}

// ── TIMER & REST ──
let swTime=0, swInt=null, restTime=0, restInt=null;
function toggleStopwatch(){
  const btn = document.getElementById('btnSwToggle');
  const nav = document.getElementById('navTimer');
  if(swInt){
    clearInterval(swInt); swInt=null; btn.textContent='▶️';
  } else {
    swTime = swTime || 0;
    swInt = setInterval(()=>{
      swTime++; 
      const clock = fmtTime(swTime);
      document.getElementById('swDisplay').textContent = clock;
      nav.textContent = clock;
      nav.style.display = 'block';
    },1000);
    btn.textContent='⏸️';
  }
}
function resetStopwatch(){ clearInterval(swInt); swInt=null; swTime=0; document.getElementById('swDisplay').textContent='00:00:00'; document.getElementById('navTimer').style.display='none'; document.getElementById('btnSwToggle').textContent='▶️'; }
function fmtTime(s){ return new Date(s*1000).toISOString().substr(11,8); }

function startRest(s){
  clearInterval(restInt); restTime=s;
  const el = document.getElementById('restDisplay');
  el.textContent = restTime+'s';
  restInt = setInterval(()=>{
    restTime--; el.textContent = restTime+'s';
    if(restTime<=0){ clearInterval(restInt); el.textContent='¡LISTO!'; if(navigator.vibrate) navigator.vibrate([200,100,200]); }
  },1000);
}

// ── HISTORY ──
function drawHistory(){
  const sessions = DB.data(CU.id).sessions || [];
  const el = document.getElementById('histList');
  const filter = document.getElementById('histFilter');
  if(!filter.options.length > 1){
    const progs = [...new Set(sessions.map(s=>s.program))];
    filter.innerHTML = '<option value="">Todos los programas</option>' + progs.map(p=>`<option value="${p}">${PROGRAMS[p]?.n || p}</option>`).join('');
  }
  
  const f = filter.value;
  const filtered = f ? sessions.filter(s=>s.program===f) : sessions;
  
  document.getElementById('histCount').textContent = `${filtered.length} sesiones registradas`;
  
  el.innerHTML = filtered.map((s,idx)=>`
    <div class="card mb14">
      <div class="between mb14">
        <div><h3>${PROGRAMS[s.program]?.n || s.program}</h3><p class="sub">${new Date(s.date).toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'})}</p></div>
        <div class="flex">
          <button class="btn btn-sec btn-sm" onclick="editSession('${s.id}')">✏️</button>
          <button class="btn btn-red btn-sm" onclick="deleteSession('${s.id}')">🗑️</button>
        </div>
      </div>
      <p class="sub mb14"><b>${s.sessionName}</b> • ${s.duration} min • ${s.exercises.length} exs</p>
      ${s.notes?`<div style="font-size:.78rem;background:var(--card2);padding:10px;border-radius:8px;margin-bottom:12px;border-left:3px solid var(--p2)">"${s.notes}"</div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${s.exercises.map(ex=>`
          <div style="font-size:.78rem;background:var(--card2);padding:10px;border-radius:10px">
            <span style="font-weight:700;color:var(--p2)">${ex.exercise}</span>
            <div style="color:var(--muted);margin-top:4px">${ex.sets.map(st=>`${st.weight||st.reps}${s.program==='ot'?'km':'kg'}`).join(' · ')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('') || '<div class="empty"><div class="empty-icon">📂</div><p>No hay entrenos aún</p></div>';
}

function deleteSession(id){
  if(!confirm("¿Borrar este entreno?")) return;
  const d = DB.data(CU.id);
  d.sessions = d.sessions.filter(s=>s.id!==id);
  DB.save(CU.id, d);
  drawHistory();
}

function editSession(id){
  const d = DB.data(CU.id);
  editIdx = d.sessions.findIndex(s=>s.id===id);
  currentWorkout = {...d.sessions[editIdx]};
  showTab('log');
  document.getElementById('logTitle').textContent = "Editando entreno";
  document.getElementById('btnCancelEdit').style.display='inline-flex';
  
  document.getElementById('sessSelect').innerHTML = `<option>${currentWorkout.sessionName}</option>`;
  document.getElementById('wDate').value = currentWorkout.date;
  document.getElementById('wDur').value = currentWorkout.duration;
  document.getElementById('wNotes').value = currentWorkout.notes;
}

function fillEditData(){
  currentWorkout.exercises.forEach(ex=>{
    document.querySelectorAll('.ex-row').forEach((row,ri)=>{
      if(row.querySelector('.ex-name').textContent === ex.exercise){
        const bi = ri < 5 ? 0 : ri < 10 ? 1 : 2; // Rough mapping
        ex.sets.forEach(st=>addSet(bi, ri%5, ex.exercise, {w:st.weight, r:st.reps, rpe:st.rpe}));
      }
    });
  });
}

function cancelEdit(){ editIdx=-1; document.getElementById('logTitle').textContent="Registrar entreno"; document.getElementById('btnCancelEdit').style.display='none'; showTab('dashboard'); }

// ── SETTINGS & HEALTH ──
function initSettings(){
  document.getElementById('sName').value = CU.name;
  document.getElementById('sTheme').value = CU.theme;
  document.getElementById('sShowTimers').checked = CU.showTimers;
  document.getElementById('sPin').value = CU.pin || '';
  
  const user = DB.getUsers().find(u=>u.id===CU.id);
  document.getElementById('sSex').value = user.sex || '';
  document.getElementById('sAge').value = user.age || '';
  document.getElementById('sHeight').value = user.height || '';
  document.getElementById('sWeight').value = user.weight || '';
  updateHealthUI();
}

function saveSettings(){
  CU.name = document.getElementById('sName').value.trim();
  CU.theme = document.getElementById('sTheme').value;
  CU.showTimers = document.getElementById('sShowTimers').checked;
  CU.pin = document.getElementById('sPin').value.trim() || null;
  
  const u = DB.getUsers();
  const i = u.findIndex(x=>x.id===CU.id);
  u[i] = { ...u[i], ...CU, 
    sex: document.getElementById('sSex').value,
    age: document.getElementById('sAge').value,
    height: document.getElementById('sHeight').value,
    weight: document.getElementById('sWeight').value
  };
  DB.setUsers(u);
  alert("Ajustes guardados");
  location.reload();
}

function updateHealthUI(){
  const s = document.getElementById('sSex').value;
  const a = parseInt(document.getElementById('sAge').value);
  const h = parseInt(document.getElementById('sHeight').value);
  const w = parseFloat(document.getElementById('sWeight').value);
  
  if(h && w) document.getElementById('bmiVal').textContent = (w / ((h/100)**2)).toFixed(1);
  if(s && a && h && w){
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = s==='M' ? bmr + 5 : bmr - 161;
    document.getElementById('bmrVal').textContent = Math.round(bmr);
  }
}

// ── DATA MGMT ──
function exportData(){
  const data = DB.data(CU.id);
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=`tristras_backup_${CU.name}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

let importPending = null;
function importData(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const json = JSON.parse(ev.target.result);
      if(!json.sessions) throw new Error();
      importPending = json;
      document.getElementById('importPreview').style.display='block';
      document.getElementById('importInfo').innerHTML = `Se han encontrado <b>${json.sessions.length} entrenamientos</b>.<br>¿Quieres fusionarlos con tus datos actuales?`;
    } catch(err) { alert("Archivo no válido"); }
  };
  reader.readAsText(file);
}

function confirmImport(){
  const d = DB.data(CU.id);
  const existingIds = d.sessions.map(s=>s.id);
  const newSess = importPending.sessions.filter(s=>!existingIds.includes(s.id));
  d.sessions = d.sessions.concat(newSess).sort((a,b)=>new Date(b.date)-new Date(a.date));
  DB.save(CU.id, d);
  alert(`Importación completada. Se añadieron ${newSess.length} sesiones.`);
  location.reload();
}
function cancelImport(){ document.getElementById('importPreview').style.display='none'; importPending=null; }

function resetData(){
  if(confirm("¿ESTAS SEGURO? Se borrarán todos tus entrenamientos para siempre.")) {
    DB.save(CU.id, {sessions:[]}); location.reload();
  }
}
