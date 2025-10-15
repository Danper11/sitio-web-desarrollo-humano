// ---------------- KPIs (Calculadora) ----------------
const kpiRec   = document.getElementById('kpi-reciclaje');
const kpiCosto = document.getElementById('kpi-costo');
const kpiCO2   = document.getElementById('kpi-co2');

const form        = document.getElementById('impact-form');
const inputKg     = document.getElementById('kg');
const inputRec    = document.getElementById('rec');
const inputCosto  = document.getElementById('costo');
const inputFactor = document.getElementById('factor');

const resAhorro = document.getElementById('res-ahorro');
const resCO2    = document.getElementById('res-co2');
const resKgRec  = document.getElementById('res-kg-rec');
const resetCalc = document.getElementById('reset-calc');

function formatMoney(n){
  return n.toLocaleString('es-MX', { style:'currency', currency:'MXN', maximumFractionDigits:2 });
}
function formatKg(n){
  return `${n.toLocaleString('es-MX', { maximumFractionDigits:1 })} kg`;
}

function compute(){
  const kg     = Math.max(0, Number(inputKg.value || 0));
  const rec    = Math.min(100, Math.max(0, Number(inputRec.value || 0)));
  const costo  = Math.max(0, Number(inputCosto.value || 0));
  const factor = Math.max(0, Number(inputFactor.value || 0));

  const kgRecSem = kg * (rec/100);
  const kgRecMes = kgRecSem * 4; // 4 semanas aprox.
  const ahorroMes = kgRecMes * costo; // costo de disposición evitado
  const co2Mes    = kgRecMes * factor;

  resAhorro.textContent = formatMoney(ahorroMes);
  resCO2.textContent    = formatKg(co2Mes);
  resKgRec.textContent  = formatKg(kgRecMes);

  // KPIs del hero
  kpiRec.textContent   = `${rec}%`;
  kpiCosto.textContent = formatMoney(ahorroMes);
  kpiCO2.textContent   = formatKg(co2Mes);
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  compute();
});
resetCalc?.addEventListener('click', () => {
  inputKg.value = 50;
  inputRec.value = 30;
  inputCosto.value = 2.50;
  inputFactor.value = 0.6;
  compute();
});
compute(); // primera corrida

// ---------------- Simulador de separación ----------------
const ITEMS = [
  {name:'Periódico',           bin:'papel',     emoji:'📄'},
  {name:'Cuaderno',            bin:'papel',     emoji:'📘'},
  {name:'Caja de cartón',      bin:'papel',     emoji:'📦'},
  {name:'Botella PET',         bin:'plastico',  emoji:'🧴'},
  {name:'Bolsa',               bin:'plastico',  emoji:'🛍️'},
  {name:'Vaso desechable',     bin:'plastico',  emoji:'🥤'},
  {name:'Frasco',              bin:'vidrio',    emoji:'🍯'},
  {name:'Botella',             bin:'vidrio',    emoji:'🍾'},
  {name:'Vaso de vidrio',      bin:'vidrio',    emoji:'🧪'},
  {name:'Cáscara de manzana',  bin:'organico',  emoji:'🍎'},
  {name:'Cáscara de plátano',  bin:'organico',  emoji:'🍌'},
  {name:'Restos de ensalada',  bin:'organico',  emoji:'🥗'},
  {name:'Lata de refresco',    bin:'metal',     emoji:'🥫'},
  {name:'Tapa metálica',       bin:'metal',     emoji:'🧲'},
  {name:'Lata de atún',        bin:'metal',     emoji:'🐟'}
];

const itemEl   = document.getElementById('item');
const bins     = Array.from(document.querySelectorAll('.bin'));
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start');
const timeEl   = document.getElementById('time');
const scoreEl  = document.getElementById('score');
const streakEl = document.getElementById('streak');

let timer = null, timeLeft = 60, score = 0, streak = 0, current = null;

function pick(){ return ITEMS[Math.floor(Math.random()*ITEMS.length)]; }
function render(){ itemEl.innerHTML = `<span aria-hidden="true">${current.emoji}</span> ${current.name}`; itemEl.dataset.bin = current.bin; }
function resetBins(){ bins.forEach(b=>b.classList.remove('accept','reject')); }
function setFeedback(text, ok){ feedback.textContent = text; feedback.className = `feedback ${ok?'ok':'no'}`; }

function next(){ current = pick(); render(); resetBins(); setFeedback('', true); }

function start(){
  clearInterval(timer); timeLeft = 60; score = 0; streak = 0;
  timeEl.textContent = timeLeft; scoreEl.textContent = score; streakEl.textContent = streak;
  next();
  timer = setInterval(()=>{
    timeLeft--; timeEl.textContent = timeLeft;
    if(timeLeft<=0){ clearInterval(timer); end(); }
  }, 1000);
}
function end(){
  setFeedback(`Fin de ronda · Puntaje: ${score} · Mejor racha: ${streak}`, true);
}

function handle(bin){
  const ok = bin === itemEl.dataset.bin;
  if(ok){ score += 10; streak += 1; setFeedback('Correcto', true); }
  else  { streak = 0; setFeedback('Incorrecto', false); }
  scoreEl.textContent = score; streakEl.textContent = streak;
  next();
}

// Drag & drop
itemEl.addEventListener('dragstart', e=>{
  e.dataTransfer.setData('text/plain', itemEl.dataset.bin);
  itemEl.setAttribute('aria-grabbed','true');
});
itemEl.addEventListener('dragend', ()=> itemEl.setAttribute('aria-grabbed','false'));

bins.forEach(bin=>{
  bin.addEventListener('dragover', e=>{ e.preventDefault(); bin.classList.add('accept'); });
  bin.addEventListener('dragleave', ()=> bin.classList.remove('accept'));
  bin.addEventListener('drop', e=>{
    e.preventDefault();
    const target = bin.getAttribute('data-bin');
    handle(target);
    bin.classList.remove('accept');
  });
});

// Teclado: 1–5 desde el ítem con foco
itemEl.addEventListener('keydown', e=>{
  const map = { '1':'papel','2':'plastico','3':'vidrio','4':'organico','5':'metal' };
  if(map[e.key]){
    const bin = map[e.key];
    const el  = bins.find(b=>b.dataset.bin===bin);
    if(el){ el.classList.add('accept'); setTimeout(()=>el.classList.remove('accept'), 150); }
    handle(bin);
  }
});

// Teclado: Enter/Espacio sobre el contenedor con foco
bins.forEach(bin=> bin.addEventListener('keydown', e=>{
  if(e.key==='Enter' || e.key===' '){ handle(bin.dataset.bin); }
}));

startBtn?.addEventListener('click', start);

// ---------------- Personas que impulsan el cambio ----------------
const PEOPLE = [
  {
    nombre: "Wangari Maathai",
    pais: "Kenia",
    enfoque: "Conservación",
    rol: "Fundadora del Green Belt Movement",
    resumen: "Impulsó la restauración ambiental y liderazgo comunitario, con plantación de millones de árboles.",
    enlace: "https://www.greenbeltmovement.org/"
  },
  {
    nombre: "Greta Thunberg",
    pais: "Suecia",
    enfoque: "Activismo",
    rol: "Fundadora de Fridays for Future",
    resumen: "Catalizó movilizaciones estudiantiles globales para exigir acción climática basada en ciencia.",
    enlace: "https://fridaysforfuture.org/"
  },
  {
    nombre: "Boyan Slat",
    pais: "Países Bajos",
    enfoque: "Innovación",
    rol: "Fundador de The Ocean Cleanup",
    resumen: "Desarrolla sistemas para reducir la contaminación plástica en océanos y ríos.",
    enlace: "https://theoceancleanup.com/"
  },
  {
    nombre: "Ellen MacArthur",
    pais: "Reino Unido",
    enfoque: "Economía circular",
    rol: "Fundación Ellen MacArthur",
    resumen: "Promueve modelos de negocio circulares y métricas para rediseñar flujos de materiales.",
    enlace: "https://ellenmacarthurfoundation.org/"
  },
  {
    nombre: "Berta Cáceres",
    pais: "Honduras",
    enfoque: "Activismo",
    rol: "Defensora socioambiental",
    resumen: "Referente latinoamericana en la defensa de ríos y territorios indígenas.",
    enlace: "https://en.wikipedia.org/wiki/Berta_C%C3%A1ceres"
  },
  {
    nombre: "Chico Mendes",
    pais: "Brasil",
    enfoque: "Conservación",
    rol: "Líder seringueiro",
    resumen: "Defendió el bosque amazónico vinculando economía local y protección ambiental.",
    enlace: "https://en.wikipedia.org/wiki/Chico_Mendes"
  },
  {
    nombre: "Isatou Ceesay",
    pais: "Gambia",
    enfoque: "Economía circular",
    rol: "Emprendedora social",
    resumen: "Transformó el reciclaje de bolsas plásticas en ingresos para mujeres.",
    enlace: "https://en.wikipedia.org/wiki/Isatou_Ceesay"
  },
  {
    nombre: "Katharine Hayhoe",
    pais: "Canadá/EE. UU.",
    enfoque: "Comunicación científica",
    rol: "Climatóloga y divulgadora",
    resumen: "Conecta evidencia científica con audiencias diversas para acciones climáticas concretas.",
    enlace: "https://www.katharinehayhoe.com/"
  }
];

const peopleList   = document.getElementById('people-list');
const peopleEmpty  = document.getElementById('people-empty');
const searchInput  = document.getElementById('search-person');
const enfoqueSelect= document.getElementById('filter-enfoque');

function initials(name){
  const parts = name.split(' ').filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[parts.length-1]?.[0] || '');
}

function personCard(p){
  const card = document.createElement('article');
  card.className = 'person-card';
  card.innerHTML = `
    <div class="person-avatar" aria-hidden="true">${initials(p.nombre).toUpperCase()}</div>
    <div>
      <h3>${p.nombre}</h3>
      <div class="person-meta">
        <span class="badge">${p.enfoque}</span>
        <span class="badge">${p.pais}</span>
        <span class="badge">${p.rol}</span>
      </div>
      <p>${p.resumen}</p>
      <div class="person-actions">
        <a href="${p.enlace}" target="_blank" rel="noopener">Ver más</a>
      </div>
    </div>
  `;
  return card;
}

function renderPeople(){
  const q = (searchInput?.value || '').toLowerCase().trim();
  const f = (enfoqueSelect?.value || '').toLowerCase();

  const filtered = PEOPLE.filter(p=>{
    const matchText = `${p.nombre} ${p.pais} ${p.enfoque} ${p.rol} ${p.resumen}`.toLowerCase().includes(q);
    const matchFocus = f ? p.enfoque.toLowerCase() === f : true;
    return matchText && matchFocus;
  });

  peopleList.innerHTML = '';
  if(filtered.length === 0){
    peopleEmpty.classList.remove('hidden');
    return;
  }
  peopleEmpty.classList.add('hidden');
  filtered.forEach(p => peopleList.appendChild(personCard(p)));
}

searchInput?.addEventListener('input', renderPeople);
enfoqueSelect?.addEventListener('change', renderPeople);
renderPeople();

console.log('AventuRRRa listo — versión profesional + personas que impulsan el cambio.');