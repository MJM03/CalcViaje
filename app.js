(function(){
'use strict';
var STORAGE='calcviaje_v3',THEME='calcviaje_theme';
function uid(){return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
function clone(o){return JSON.parse(JSON.stringify(o))}
function q(id){return document.getElementById(id)}
function qa(sel){return Array.prototype.slice.call(document.querySelectorAll(sel))}
function dateList(a,b){var out=[],d=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00');while(d<=e){out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}return out}
function days(a,b){return dateList(a,b).length}
function labelDate(v){return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'long'}).format(new Date(v+'T12:00:00'))}
function shortDate(v){return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short'}).format(new Date(v+'T12:00:00'))}
var demo={trip:{name:'Cusco 2026',destination:'Cusco, Perú',startDate:'2026-08-12',endDate:'2026-08-17',budget:7500,currency:'PEN'},plan:{hotel:300,foodPerPerson:90,transport:100,activities:150,shopping:40,other:30},travelers:[],expenses:[]};
demo.travelers=[{id:uid(),name:'Augusto',initials:'AU',type:'adult'},{id:uid(),name:'María',initials:'MA',type:'adult'},{id:uid(),name:'Luis',initials:'LU',type:'adult'},{id:uid(),name:'Ana',initials:'AN',type:'adult'}];
demo.expenses=[
{id:uid(),date:'2026-08-12',category:'hotel',amount:280,description:'Hotel día 1',travelerId:demo.travelers[0].id},
{id:uid(),date:'2026-08-12',category:'breakfast',amount:72,description:'Desayuno',travelerId:demo.travelers[1].id},
{id:uid(),date:'2026-08-12',category:'lunch',amount:140,description:'Almuerzo',travelerId:demo.travelers[2].id},
{id:uid(),date:'2026-08-12',category:'dinner',amount:110,description:'Cena',travelerId:demo.travelers[0].id},
{id:uid(),date:'2026-08-12',category:'transport',amount:80,description:'Taxi y movilidad',travelerId:demo.travelers[3].id},
{id:uid(),date:'2026-08-13',category:'hotel',amount:300,description:'Hotel día 2',travelerId:demo.travelers[0].id},
{id:uid(),date:'2026-08-13',category:'breakfast',amount:60,description:'Desayuno',travelerId:demo.travelers[1].id},
{id:uid(),date:'2026-08-13',category:'lunch',amount:120,description:'Almuerzo',travelerId:demo.travelers[2].id}
];
var state=load(),selectedIndex=0;
function load(){try{var r=localStorage.getItem(STORAGE);return r?JSON.parse(r):clone(demo)}catch(e){return clone(demo)}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function money(n){try{return new Intl.NumberFormat('es-PE',{style:'currency',currency:state.trip.currency||'PEN',maximumFractionDigits:2}).format(Number(n||0))}catch(e){return 'S/ '+Number(n||0).toFixed(2)}}
function categories(){return[
{key:'hotel',name:'Hotel',icon:'🏨',budget:state.plan.hotel},
{key:'food',name:'Comida',icon:'🍽️',budget:state.plan.foodPerPerson*state.travelers.length},
{key:'transport',name:'Transporte',icon:'🚕',budget:state.plan.transport},
{key:'activities',name:'Actividades',icon:'🎟️',budget:state.plan.activities},
{key:'shopping',name:'Compras',icon:'🛍️',budget:state.plan.shopping},
{key:'other',name:'Otros',icon:'🧳',budget:state.plan.other}
]}
function expenseGroup(cat){if(cat==='food')return['breakfast','lunch','dinner','snacks'];return[cat]}
function dayBudget(){return categories().reduce(function(s,c){return s+Number(c.budget||0)},0)}
function daySpent(date,cat){var keys=cat?expenseGroup(cat):null,total=0;state.expenses.forEach(function(e){if(e.date===date&&(!keys||keys.indexOf(e.category)>=0))total+=Number(e.amount||0)});return total}
function tripMetrics(){
 var dates=dateList(state.trip.startDate,state.trip.endDate),daily=dayBudget(),totalPlanned=daily*dates.length,totalBudget=Number(state.trip.budget||0);
 var elapsed=0,real=0,confirmed=0;
 dates.forEach(function(d){var spent=daySpent(d);if(spent>0){elapsed++;real+=spent;confirmed+=daily-spent}});
 var remainingDays=dates.length-elapsed;
 var avg=elapsed?confirmed/elapsed:0;
 var projected=confirmed+avg*remainingDays;
 var pending=daily*remainingDays;
 var remaining=totalBudget-real;
 return{dates:dates,daily:daily,totalPlanned:totalPlanned,totalBudget:totalBudget,elapsed:elapsed,real:real,confirmed:confirmed,avg:avg,remainingDays:remainingDays,projected:projected,pending:pending,remaining:remaining}
}
function render(){
 var m=tripMetrics(),pp=state.travelers.length?m.projected/state.travelers.length:0;
 q('tripName').textContent=state.trip.name;q('tripMeta').textContent=state.travelers.length+' personas · '+m.dates.length+' días';
 q('projectedSavings').textContent=money(m.projected);q('projectedPerPerson').textContent=money(pp)+' por persona';
 q('confirmedSavings').textContent=money(m.confirmed);q('remainingBudget').textContent=money(m.remaining);
 q('totalBudget').textContent=money(m.totalBudget);q('realSpent').textContent=money(m.real);q('pendingBudget').textContent=money(m.pending);q('avgDailySavings').textContent=money(m.avg);
 q('healthBadge').textContent=m.projected<0?'Excedido':m.projected<m.totalBudget*.05?'Ajustado':'Saludable';
 q('planHotel').textContent=money(state.plan.hotel);q('planFood').textContent=money(state.plan.foodPerPerson*state.travelers.length);
 q('peopleCount').textContent=state.travelers.length;q('peopleProjection').textContent=money(pp);
 renderScenarios(m);renderInsights(m);renderDays(m);renderSelectedDay(m);renderPlan();renderTravelers();hydrate();fillForms();save()
}
function renderScenarios(m){
 var persons=Math.max(1,state.travelers.length);
 var conservative=Math.max(0,m.projected*.75),probable=Math.max(0,m.projected),optimistic=Math.max(0,m.projected*1.2);
 q('scenarioGrid').innerHTML=[
 ['Conservador',conservative],['Probable',probable],['Optimista',optimistic]
 ].map(function(x){return '<article class="scenario-card"><span>'+x[0]+'</span><strong>'+money(x[1])+'</strong><small>'+money(x[1]/persons)+' p/p</small></article>'}).join('')
}
function renderInsights(m){
 var arr=[];
 arr.push({i:'↗',t:'Proyección actual',p:'Al ritmo registrado, terminarían con aproximadamente '+money(m.projected)+' de ahorro total.'});
 arr.push({i:'♙',t:'Reparto por persona',p:'Cada viajero recibiría cerca de '+money(state.travelers.length?m.projected/state.travelers.length:0)+'.'});
 arr.push({i:'◷',t:'Días pendientes',p:'Quedan '+m.remainingDays+' días por registrar, con '+money(m.pending)+' presupuestados.'});
 q('insightList').innerHTML=arr.map(function(x){return '<article class="insight"><div class="insight-icon">'+x.i+'</div><div><b>'+x.t+'</b><p>'+x.p+'</p></div></article>'}).join('')
}
function dayCard(date,index){
 var b=dayBudget(),s=daySpent(date),sav=b-s,status=s===0?'Pendiente':sav>=0?'Ahorraste '+money(sav):'Exceso '+money(Math.abs(sav));
 return '<article class="day-card" data-select-day="'+index+'"><div class="day-head"><div><h4>Día '+(index+1)+'</h4><small>'+shortDate(date)+'</small></div><div class="day-side"><strong class="'+(sav>=0?'good':'bad')+'">'+status+'</strong><small>'+money(s)+' gastado</small></div></div><div class="day-grid"><div><span>Presupuesto</span><b>'+money(b)+'</b></div><div><span>Gastado</span><b>'+money(s)+'</b></div><div><span>Ahorro</span><b>'+money(sav)+'</b></div></div></article>'
}
function renderDays(m){
 q('homeDays').innerHTML=m.dates.slice(0,3).map(dayCard).join('');
 q('allDaysList').innerHTML=m.dates.map(dayCard).join('')
}
function renderSelectedDay(m){
 if(selectedIndex>=m.dates.length)selectedIndex=m.dates.length-1;if(selectedIndex<0)selectedIndex=0;
 var date=m.dates[selectedIndex],b=dayBudget(),s=daySpent(date),sav=b-s;
 q('selectedDayLabel').textContent='Día '+(selectedIndex+1)+' de '+m.dates.length;
 q('selectedDateLabel').textContent=labelDate(date);q('dayBudget').textContent=money(b);q('daySpent').textContent=money(s);q('daySavings').textContent=money(sav);
 q('dailyCategoryList').innerHTML=categories().map(function(c){
   var spent=daySpent(date,c.key),rem=Number(c.budget)-spent,pct=c.budget?Math.min(100,Math.max(0,spent/c.budget*100)):0;
   return '<article class="category-card"><div class="category-head"><div class="category-left"><div class="category-icon">'+c.icon+'</div><div><h4>'+c.name+'</h4><small>'+money(spent)+' de '+money(c.budget)+'</small></div></div><div class="category-side"><strong>'+Math.round(pct)+'%</strong><small>utilizado</small></div></div><div class="mini-progress"><div style="width:'+pct+'%"></div></div><div class="category-foot"><span>Restante</span><span class="'+(rem>=0?'good':'bad')+'">'+money(rem)+'</span></div></article>'
 }).join('')
}
function renderPlan(){
 q('planCategoryList').innerHTML=categories().map(function(c){return '<article class="category-card"><div class="category-head"><div class="category-left"><div class="category-icon">'+c.icon+'</div><div><h4>'+c.name+'</h4><small>Presupuesto diario</small></div></div><div class="category-side"><strong>'+money(c.budget)+'</strong><small>por día</small></div></div></article>'}).join('')
}
function renderTravelers(){
 var proj=state.travelers.length?tripMetrics().projected/state.travelers.length:0;
 q('travelerList').innerHTML=state.travelers.map(function(t){
  var paid=0;state.expenses.forEach(function(e){if(e.travelerId===t.id)paid+=Number(e.amount||0)});
  return '<article class="traveler-card"><div class="traveler-left"><div class="avatar">'+t.initials+'</div><div><b>'+t.name+'</b><small>'+t.type+'</small></div></div><div class="traveler-side"><strong>'+money(proj)+'</strong><small>proyección final</small><br><button class="delete-btn" data-delete-traveler="'+t.id+'">×</button></div></article>'
 }).join('')||'<div class="empty">Agrega viajeros.</div>'
}
function hydrate(){
 var dates=dateList(state.trip.startDate,state.trip.endDate);
 q('expenseDate').innerHTML=dates.map(function(d,i){return '<option value="'+d+'">Día '+(i+1)+' · '+shortDate(d)+'</option>'}).join('');
 q('expenseDate').value=dates[selectedIndex]||dates[0];
 q('expenseTraveler').innerHTML='<option value="">Sin asignar</option>'+state.travelers.map(function(t){return '<option value="'+t.id+'">'+t.name+'</option>'}).join('')
}
function fillForms(){
 var tf=q('tripForm'),pf=q('planForm');
 ['name','destination','startDate','endDate','budget','currency'].forEach(function(k){tf.elements[k].value=state.trip[k]});
 ['hotel','foodPerPerson','transport','activities','shopping','other'].forEach(function(k){pf.elements[k].value=state.plan[k]})
}
function nav(v){qa('.screen').forEach(function(s){s.classList.toggle('active',s.id==='screen-'+v)});qa('.nav-item').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')===v)});q('pageTitle').textContent=v==='home'?'Inicio':v==='today'?'Hoy':v==='days'?'Días':v==='plan'?'Plan diario':v==='people'?'Personas':'Ajustes';window.scrollTo(0,0)}
function openModal(id){q(id).classList.add('open');document.body.style.overflow='hidden';hydrate()}
function closeAll(){qa('.modal.open').forEach(function(m){m.classList.remove('open')});document.body.style.overflow=''}
function toast(msg){var e=q('toast');e.textContent=msg;e.classList.add('show');clearTimeout(window._t);window._t=setTimeout(function(){e.classList.remove('show')},2200)}
document.addEventListener('click',function(e){
 var n=e.target.closest('[data-nav]');if(n)nav(n.getAttribute('data-nav'));
 var o=e.target.closest('[data-open]');if(o)openModal(o.getAttribute('data-open'));
 if(e.target.closest('[data-close]'))closeAll();
 var d=e.target.closest('[data-select-day]');if(d){selectedIndex=Number(d.getAttribute('data-select-day'));nav('today');render()}
 var x=e.target.closest('[data-delete-traveler]');if(x){var id=x.getAttribute('data-delete-traveler');if(state.expenses.some(function(a){return a.travelerId===id}))toast('No puedes eliminar a una persona con gastos');else if(confirm('¿Eliminar persona?')){state.travelers=state.travelers.filter(function(a){return a.id!==id});render()}}
});
q('prevDay').onclick=function(){selectedIndex--;render()};q('nextDay').onclick=function(){selectedIndex++;render()};
q('tripForm').onsubmit=function(e){e.preventDefault();var f=e.currentTarget;state.trip={name:f.name.value,destination:f.destination.value,startDate:f.startDate.value,endDate:f.endDate.value,budget:Number(f.budget.value||0),currency:f.currency.value};selectedIndex=0;closeAll();render();toast('Viaje actualizado')};
q('planForm').onsubmit=function(e){e.preventDefault();var f=e.currentTarget;state.plan={hotel:Number(f.hotel.value||0),foodPerPerson:Number(f.foodPerPerson.value||0),transport:Number(f.transport.value||0),activities:Number(f.activities.value||0),shopping:Number(f.shopping.value||0),other:Number(f.other.value||0)};closeAll();render();toast('Plan actualizado')};
q('dailyExpenseForm').onsubmit=function(e){e.preventDefault();var f=e.currentTarget;state.expenses.push({id:uid(),date:f.date.value,category:f.category.value,amount:Number(f.amount.value||0),description:f.description.value,travelerId:f.travelerId.value});f.reset();closeAll();render();toast('Gasto registrado')};
q('travelerForm').onsubmit=function(e){e.preventDefault();var f=e.currentTarget;state.travelers.push({id:uid(),name:f.name.value,type:f.type.value,initials:f.initials.value.toUpperCase()});f.reset();closeAll();render();toast('Persona agregada')};
q('themeToggle').onclick=function(){var d=!document.body.classList.contains('dark');document.body.classList.toggle('dark',d);q('themeToggle').textContent=d?'☀':'☾';localStorage.setItem(THEME,d?'dark':'light')};
q('exportBtn').onclick=function(){var b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='calcviaje-v3.json';a.click();setTimeout(function(){URL.revokeObjectURL(u)},1000)};
q('importInput').onchange=function(e){var file=e.target.files[0];if(!file)return;var r=new FileReader();r.onload=function(){try{var data=JSON.parse(r.result);if(!data.trip||!data.plan)throw Error();state=data;selectedIndex=0;render();toast('Respaldo importado')}catch(x){toast('Archivo no válido')}};r.readAsText(file)};
q('resetBtn').onclick=function(){if(confirm('¿Restablecer la demo?')){state=clone(demo);selectedIndex=0;localStorage.removeItem(STORAGE);render()}};
if(localStorage.getItem(THEME)==='dark'){document.body.classList.add('dark');q('themeToggle').textContent='☀'}
if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})})}
window.addEventListener('load',function(){setTimeout(function(){q('splash').classList.add('hidden')},700)});
render()
})();