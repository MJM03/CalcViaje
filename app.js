
(function(){
'use strict';

var STORAGE='calcviaje_v2';
var THEME='calcviaje_theme';
var filter='all';

function uid(){
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
}
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function today(){ return new Date().toISOString().slice(0,10); }

var demo = {
  trip:{name:'Cusco 2026',destination:'Cusco, Perú',startDate:'2026-08-12',endDate:'2026-08-17',budget:7500,currency:'PEN'},
  categories:[],
  travelers:[],
  expenses:[],
  activities:[]
};

demo.categories=[
  {id:uid(),name:'Transporte',icon:'✈️',budget:2200},
  {id:uid(),name:'Hospedaje',icon:'🏨',budget:1900},
  {id:uid(),name:'Comida',icon:'🍽️',budget:1300},
  {id:uid(),name:'Movilidad',icon:'🚕',budget:650},
  {id:uid(),name:'Actividades',icon:'🎟️',budget:900},
  {id:uid(),name:'Emergencias',icon:'🛟',budget:550}
];
demo.travelers=[
  {id:uid(),name:'Augusto',initials:'AU',type:'adult'},
  {id:uid(),name:'María',initials:'MA',type:'adult'},
  {id:uid(),name:'Luis',initials:'LU',type:'adult'},
  {id:uid(),name:'Ana',initials:'AN',type:'adult'}
];
demo.expenses=[
  {id:uid(),description:'Vuelos ida y vuelta',amount:2050,categoryId:demo.categories[0].id,status:'paid',date:'2026-07-10',travelerId:demo.travelers[0].id,note:'Promoción aérea'},
  {id:uid(),description:'Hotel 5 noches',amount:1680,categoryId:demo.categories[1].id,status:'reserved',date:'2026-07-12',travelerId:demo.travelers[1].id,note:'Incluye desayuno'},
  {id:uid(),description:'Tour Valle Sagrado',amount:460,categoryId:demo.categories[4].id,status:'planned',date:'2026-08-14',travelerId:demo.travelers[0].id,note:''},
  {id:uid(),description:'Traslado aeropuerto',amount:90,categoryId:demo.categories[3].id,status:'paid',date:'2026-07-14',travelerId:demo.travelers[2].id,note:''}
];
demo.activities=[
  {id:uid(),title:'Llegada y check-in',date:'2026-08-12',time:'11:30',cost:0,icon:'🏨',location:'Centro histórico'},
  {id:uid(),title:'Machu Picchu',date:'2026-08-14',time:'06:00',cost:460,icon:'⛰️',location:'Aguas Calientes'}
];

function load(){
  try{
    var raw=localStorage.getItem(STORAGE);
    return raw ? JSON.parse(raw) : clone(demo);
  }catch(e){ return clone(demo); }
}
var state=load();

function save(){ try{ localStorage.setItem(STORAGE,JSON.stringify(state)); }catch(e){} }
function q(id){ return document.getElementById(id); }
function qa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function money(n){
  try{
    return new Intl.NumberFormat('es-PE',{style:'currency',currency:state.trip.currency||'PEN',maximumFractionDigits:2}).format(Number(n||0));
  }catch(e){ return 'S/ ' + Number(n||0).toFixed(2); }
}
function days(a,b){
  var x=new Date(a+'T12:00:00'), y=new Date(b+'T12:00:00');
  return Math.max(1,Math.round((y-x)/86400000)+1);
}
function fmtDate(v){
  if(!v)return 'Sin fecha';
  try{return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v+'T12:00:00'));}
  catch(e){return v;}
}
function totals(){
  var paid=0,reserved=0,planned=0;
  state.expenses.forEach(function(e){
    var a=Number(e.amount||0);
    if(e.status==='paid')paid+=a;
    else if(e.status==='reserved')reserved+=a;
    else planned+=a;
  });
  var committed=reserved+planned;
  var available=Number(state.trip.budget||0)-paid-committed;
  var savings=0;
  state.categories.forEach(function(c){
    var used=0;
    state.expenses.forEach(function(e){if(e.categoryId===c.id)used+=Number(e.amount||0);});
    savings+=Math.max(0,Number(c.budget||0)-used);
  });
  return {paid:paid,reserved:reserved,planned:planned,committed:committed,available:available,savings:savings};
}
function cm(c){
  var used=0,paid=0;
  state.expenses.forEach(function(e){
    if(e.categoryId===c.id){
      used+=Number(e.amount||0);
      if(e.status==='paid')paid+=Number(e.amount||0);
    }
  });
  var rem=Number(c.budget||0)-used;
  var pct=c.budget?Math.max(0,Math.min(100,used/Number(c.budget)*100)):0;
  return {used:used,paid:paid,remaining:rem,percent:pct};
}
function statusLabel(s){return s==='paid'?'Pagado':s==='reserved'?'Reservado':'Estimado';}
function typeLabel(t){return t==='adult'?'Adulto':t==='child'?'Niño':'Bebé';}

function render(){
  var t=totals();
  var totalDays=days(state.trip.startDate,state.trip.endDate);
  var end=new Date(state.trip.endDate+'T23:59:59');
  var remainDays=Math.max(1,Math.ceil((end-new Date())/86400000));
  var pct=state.trip.budget?Math.max(0,Math.min(100,t.paid/Number(state.trip.budget)*100)):0;

  q('activeTripName').textContent=state.trip.name;
  q('activeTripMeta').textContent=state.travelers.length+' viajeros · '+totalDays+' días';
  q('freeBudget').textContent=money(t.available);
  q('dailyBudgetText').textContent=money(Math.max(0,t.available)/remainDays)+' por día restante';
  q('metricBudget').textContent=money(state.trip.budget);
  q('metricSpent').textContent=money(t.paid);
  q('metricCommitted').textContent=money(t.committed);
  q('metricSavings').textContent=money(Math.max(0,t.savings));
  q('heroProgressBar').style.width=pct+'%';
  q('usedPct').textContent=Math.round(pct)+'% usado';
  q('leftPct').textContent=Math.max(0,100-Math.round(pct))+'% libre';
  q('budgetHealthBadge').textContent=t.available<0?'Excedido':pct>75?'Atención':'Saludable';

  var assigned=0; state.categories.forEach(function(c){assigned+=Number(c.budget||0);});
  q('assignedTotal').textContent=money(assigned);
  q('unassignedTotal').textContent=money(Number(state.trip.budget||0)-assigned);
  q('travelerCount').textContent=state.travelers.length;
  q('perPersonBudget').textContent=money(state.travelers.length?Number(state.trip.budget||0)/state.travelers.length:0);

  renderInsights(t,remainDays);
  renderCategories();
  renderExpenses();
  renderTravelers();
  renderActivities();
  hydrate();
  fillTripForm();
  save();
}

function renderInsights(t,remainDays){
  var arr=[];
  if(t.available>=0){
    arr.push({icon:'↗',title:'Presupuesto bajo control',text:'Mantienes '+money(t.available)+' libres después de considerar gastos pagados y comprometidos.'});
  }else{
    arr.push({icon:'!',title:'Presupuesto excedido',text:'Te has excedido en '+money(Math.abs(t.available))+'. Revisa las categorías o los gastos pendientes.'});
  }
  var risky=null;
  state.categories.forEach(function(c){
    var m=cm(c), over=m.used-Number(c.budget||0);
    if(over>0 && (!risky || over>risky.over)) risky={c:c,over:over};
  });
  if(risky){
    arr.push({icon:'⚠',title:risky.c.name+' superó su límite',text:'La categoría excede el presupuesto por '+money(risky.over)+'.'});
  }else if(state.categories.length){
    var best=state.categories[0], bm=cm(best);
    state.categories.forEach(function(c){var m=cm(c);if(m.remaining>bm.remaining){best=c;bm=m;}});
    arr.push({icon:'✓',title:'Mayor margen en '+best.name,text:'Todavía tienes '+money(Math.max(0,bm.remaining))+' disponibles en esta categoría.'});
  }
  arr.push({icon:'◷',title:'Límite diario recomendado',text:'Puedes usar aproximadamente '+money(Math.max(0,t.available)/remainDays)+' por día restante.'});
  q('insightList').innerHTML=arr.map(function(i){return '<article class="insight"><div class="insight-icon">'+i.icon+'</div><div><b>'+i.title+'</b><p>'+i.text+'</p></div></article>';}).join('');
}
function categoryHTML(c,full){
  var m=cm(c);
  var diff=m.remaining>=0?'Ahorro '+money(m.remaining):'Exceso '+money(Math.abs(m.remaining));
  return '<article class="category-card"><div class="category-head"><div class="category-left"><div class="category-icon">'+c.icon+'</div><div><h4>'+c.name+'</h4><small>'+money(m.used)+' de '+money(c.budget)+'</small></div></div><div class="category-right"><strong>'+Math.round(m.percent)+'%</strong><small>utilizado</small></div></div><div class="mini-progress"><div style="width:'+m.percent+'%"></div></div><div class="category-foot"><span>Pagado: '+money(m.paid)+'</span><span class="'+(m.remaining>=0?'good':'bad')+'">'+diff+'</span></div>'+(full?'<div style="display:flex;justify-content:flex-end"><button class="delete-btn" data-delete-category="'+c.id+'">×</button></div>':'')+'</article>';
}
function renderCategories(){
  var sorted=state.categories.slice().sort(function(a,b){return cm(b).percent-cm(a).percent;});
  q('homeCategories').innerHTML=sorted.slice(0,4).map(function(c){return categoryHTML(c,false);}).join('')||'<div class="empty">Todavía no hay categorías.</div>';
  q('budgetList').innerHTML=sorted.map(function(c){return categoryHTML(c,true);}).join('')||'<div class="empty">Agrega tu primera categoría.</div>';
}
function expenseHTML(e,full){
  var c=null,t=null;
  state.categories.forEach(function(x){if(x.id===e.categoryId)c=x;});
  state.travelers.forEach(function(x){if(x.id===e.travelerId)t=x;});
  return '<article class="expense-card"><div class="expense-icon">'+(c?c.icon:'💳')+'</div><div class="expense-main"><b>'+e.description+'</b><small>'+(c?c.name:'Sin categoría')+' · '+(t?t.name:'Sin asignar')+' · '+fmtDate(e.date)+'</small></div><div class="expense-side"><strong>'+money(e.amount)+'</strong><small class="status-'+e.status+'">'+statusLabel(e.status)+'</small>'+(full?'<br><button class="delete-btn" data-delete-expense="'+e.id+'">×</button>':'')+'</div></article>';
}
function renderExpenses(){
  var sorted=state.expenses.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  q('homeExpenses').innerHTML=sorted.slice(0,5).map(function(e){return expenseHTML(e,false);}).join('')||'<div class="empty">Aún no hay gastos.</div>';
  var list=filter==='all'?sorted:sorted.filter(function(e){return e.status===filter;});
  q('expenseList').innerHTML=list.map(function(e){return expenseHTML(e,true);}).join('')||'<div class="empty">No hay movimientos para este filtro.</div>';
}
function renderTravelers(){
  q('travelerList').innerHTML=state.travelers.map(function(t){
    var paid=0; state.expenses.forEach(function(e){if(e.travelerId===t.id&&e.status==='paid')paid+=Number(e.amount||0);});
    return '<article class="traveler-card"><div class="traveler-left"><div class="avatar">'+t.initials+'</div><div><b>'+t.name+'</b><small>'+typeLabel(t.type)+'</small></div></div><div class="traveler-side"><strong>'+money(paid)+'</strong><small>pagado</small><br><button class="delete-btn" data-delete-traveler="'+t.id+'">×</button></div></article>';
  }).join('')||'<div class="empty">Agrega a las personas del viaje.</div>';
}
function renderActivities(){
  var months=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  var sorted=state.activities.slice().sort(function(a,b){return new Date(a.date+'T'+a.time)-new Date(b.date+'T'+b.time);});
  q('activityList').innerHTML=sorted.map(function(a){
    var d=new Date(a.date+'T12:00:00');
    return '<article class="activity-card"><div class="activity-date"><b>'+d.getDate()+'</b><small>'+months[d.getMonth()]+'</small></div><div class="activity-main"><b>'+a.icon+' '+a.title+'</b><small>'+a.time+(a.location?' · '+a.location:'')+'</small></div><div class="activity-cost">'+(Number(a.cost)>0?'<strong>'+money(a.cost)+'</strong>':'')+'<br><button class="delete-btn" data-delete-activity="'+a.id+'">×</button></div></article>';
  }).join('')||'<div class="empty">Agrega actividades para armar tu itinerario.</div>';
}
function hydrate(){
  q('expenseCategory').innerHTML=state.categories.map(function(c){return '<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>';}).join('');
  q('expenseTraveler').innerHTML='<option value="">Sin asignar</option>'+state.travelers.map(function(t){return '<option value="'+t.id+'">'+t.name+'</option>';}).join('');
}
function fillTripForm(){
  var f=q('tripForm');
  ['name','destination','startDate','endDate','budget','currency'].forEach(function(k){if(f.elements[k])f.elements[k].value=state.trip[k];});
}
function nav(view){
  qa('.screen').forEach(function(s){s.classList.toggle('active',s.id==='screen-'+view);});
  qa('.nav-item').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')===view);});
  q('pageTitle').textContent=view==='home'?'Inicio':view==='budget'?'Presupuesto':view==='expenses'?'Gastos':view==='travelers'?'Viajeros':view==='plan'?'Plan':'Ajustes';
  window.scrollTo(0,0);
}
function openModal(id){
  var m=q(id); if(m)m.classList.add('open');
  document.body.style.overflow='hidden';
  if(id==='expenseModal')q('expenseForm').elements.date.value=today();
  if(id==='activityModal')q('activityForm').elements.date.value=state.trip.startDate;
}
function closeAll(){qa('.modal.open').forEach(function(m){m.classList.remove('open');});document.body.style.overflow='';}
function toast(msg){var el=q('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(function(){el.classList.remove('show');},2200);}

document.addEventListener('click',function(e){
  var n=e.target.closest('[data-nav]'); if(n)nav(n.getAttribute('data-nav'));
  var o=e.target.closest('[data-open]'); if(o)openModal(o.getAttribute('data-open'));
  if(e.target.closest('[data-close]'))closeAll();

  var dx=e.target.closest('[data-delete-expense]');
  if(dx&&confirm('¿Eliminar este gasto?')){state.expenses=state.expenses.filter(function(x){return x.id!==dx.getAttribute('data-delete-expense');});render();toast('Gasto eliminado');}
  var dc=e.target.closest('[data-delete-category]');
  if(dc){
    var cid=dc.getAttribute('data-delete-category');
    var used=state.expenses.some(function(x){return x.categoryId===cid;});
    if(used)toast('No puedes eliminar una categoría con gastos');
    else if(confirm('¿Eliminar esta categoría?')){state.categories=state.categories.filter(function(x){return x.id!==cid;});render();}
  }
  var dt=e.target.closest('[data-delete-traveler]');
  if(dt){
    var tid=dt.getAttribute('data-delete-traveler');
    var linked=state.expenses.some(function(x){return x.travelerId===tid;});
    if(linked)toast('No puedes eliminar una persona con gastos');
    else if(confirm('¿Eliminar esta persona?')){state.travelers=state.travelers.filter(function(x){return x.id!==tid;});render();}
  }
  var da=e.target.closest('[data-delete-activity]');
  if(da&&confirm('¿Eliminar esta actividad?')){state.activities=state.activities.filter(function(x){return x.id!==da.getAttribute('data-delete-activity');});render();}
});

qa('.filter').forEach(function(b){
  b.addEventListener('click',function(){
    filter=b.getAttribute('data-filter');
    qa('.filter').forEach(function(x){x.classList.toggle('active',x===b);});
    renderExpenses();
  });
});

q('tripForm').addEventListener('submit',function(e){
  e.preventDefault();var f=e.currentTarget;
  state.trip={name:f.elements.name.value,destination:f.elements.destination.value,startDate:f.elements.startDate.value,endDate:f.elements.endDate.value,budget:Number(f.elements.budget.value||0),currency:f.elements.currency.value};
  closeAll();render();toast('Viaje actualizado');
});
q('categoryForm').addEventListener('submit',function(e){
  e.preventDefault();var f=e.currentTarget;
  state.categories.push({id:uid(),name:f.elements.name.value,budget:Number(f.elements.budget.value||0),icon:f.elements.icon.value||'🧳'});
  f.reset();f.elements.icon.value='🧳';closeAll();render();toast('Categoría agregada');
});
q('expenseForm').addEventListener('submit',function(e){
  e.preventDefault();var f=e.currentTarget;
  state.expenses.push({id:uid(),description:f.elements.description.value,amount:Number(f.elements.amount.value||0),categoryId:f.elements.categoryId.value,status:f.elements.status.value,date:f.elements.date.value,travelerId:f.elements.travelerId.value,note:f.elements.note.value});
  f.reset();closeAll();render();toast('Gasto registrado');
});
q('travelerForm').addEventListener('submit',function(e){
  e.preventDefault();var f=e.currentTarget;
  state.travelers.push({id:uid(),name:f.elements.name.value,type:f.elements.type.value,initials:f.elements.initials.value.toUpperCase()});
  f.reset();closeAll();render();toast('Viajero agregado');
});
q('activityForm').addEventListener('submit',function(e){
  e.preventDefault();var f=e.currentTarget;
  state.activities.push({id:uid(),title:f.elements.title.value,date:f.elements.date.value,time:f.elements.time.value,cost:Number(f.elements.cost.value||0),icon:f.elements.icon.value||'📍',location:f.elements.location.value});
  f.reset();closeAll();render();toast('Actividad agregada');
});

q('themeToggle').addEventListener('click',function(){
  var dark=!document.body.classList.contains('dark');
  document.body.classList.toggle('dark',dark);
  q('themeToggle').textContent=dark?'☀':'☾';
  localStorage.setItem(THEME,dark?'dark':'light');
});
q('exportBtn').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');
  a.href=url;a.download='calcviaje-respaldo.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);toast('Respaldo exportado');
});
q('importInput').addEventListener('change',function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(){
    try{
      var data=JSON.parse(reader.result);
      if(!data.trip||!Array.isArray(data.categories)||!Array.isArray(data.expenses))throw new Error();
      state=data;if(!state.activities)state.activities=[];render();toast('Respaldo importado');
    }catch(err){toast('Archivo no válido');}
    e.target.value='';
  };
  reader.readAsText(file);
});
q('resetBtn').addEventListener('click',function(){
  if(confirm('¿Restablecer todos los datos de la demo?')){state=clone(demo);localStorage.removeItem(STORAGE);render();toast('Demo restablecida');}
});

if(localStorage.getItem(THEME)==='dark'){document.body.classList.add('dark');q('themeToggle').textContent='☀';}
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){});});}
window.addEventListener('load',function(){setTimeout(function(){q('splash').classList.add('hidden');},700);});
render();
})();
