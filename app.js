(function(){
  'use strict';

  var STORAGE_KEY = 'calcviaje_base_v1';
  var THEME_KEY = 'calcviaje_base_theme';

  function byId(id){
    return document.getElementById(id);
  }

  function money(value){
    try{
      return new Intl.NumberFormat('es-PE',{
        style:'currency',
        currency:'PEN',
        maximumFractionDigits:2
      }).format(Number(value || 0));
    }catch(error){
      return 'S/ ' + Number(value || 0).toFixed(2);
    }
  }

  function numberValue(input){
    var value = Number(input.value);
    return isNaN(value) ? 0 : value;
  }

  function calculate(data){
    var hotelTotal = data.hotelDaily * data.days;
    var foodTotal = data.foodDaily * data.days;
    var projectedSpent = hotelTotal + foodTotal;
    var remaining = data.budget - projectedSpent;
    var spentPerPerson = data.people > 0 ? projectedSpent / data.people : 0;
    var remainingPerPerson = data.people > 0 ? remaining / data.people : 0;
    var usage = data.budget > 0 ? (projectedSpent / data.budget) * 100 : 0;

    return {
      hotelTotal: hotelTotal,
      foodTotal: foodTotal,
      projectedSpent: projectedSpent,
      remaining: remaining,
      spentPerPerson: spentPerPerson,
      remainingPerPerson: remainingPerPerson,
      usage: usage
    };
  }

  function render(){
    var data = {
      budget: numberValue(byId('budget')),
      people: Math.max(0, parseInt(byId('people').value || '0', 10)),
      days: Math.max(0, parseInt(byId('days').value || '0', 10)),
      hotelDaily: numberValue(byId('hotelDaily')),
      foodDaily: numberValue(byId('foodDaily'))
    };

    var result = calculate(data);

    byId('hotelTotal').textContent = money(result.hotelTotal);
    byId('foodTotal').textContent = money(result.foodTotal);
    byId('projectedSpent').textContent = money(result.projectedSpent);
    byId('spentPerPerson').textContent = money(result.spentPerPerson);
    byId('remainingAmount').textContent = money(result.remaining);
    byId('remainingPerPerson').textContent = money(result.remainingPerPerson) + ' por persona';

    var usage = Math.max(0, result.usage);
    byId('budgetUsage').textContent = Math.round(usage) + '%';
    byId('progressBar').style.width = Math.min(100, usage) + '%';

    var badge = byId('statusBadge');
    badge.className = 'status-badge';

    if(!data.budget || !data.people || !data.days){
      badge.textContent = 'Sin datos';
    }else if(result.remaining < 0){
      badge.textContent = 'Presupuesto excedido';
      badge.classList.add('bad');
    }else{
      badge.textContent = 'Dentro del presupuesto';
      badge.classList.add('good');
    }

    return data;
  }

  function save(){
    var data = render();
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }catch(error){}
    showToast('Presupuesto guardado');
  }

  function load(){
    try{
      var saved = localStorage.getItem(STORAGE_KEY);
      if(!saved) return;

      var data = JSON.parse(saved);
      byId('budget').value = data.budget || '';
      byId('people').value = data.people || '';
      byId('days').value = data.days || '';
      byId('hotelDaily').value = data.hotelDaily || '';
      byId('foodDaily').value = data.foodDaily || '';
    }catch(error){}
  }

  function showToast(message){
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.__calcViajeToast);
    window.__calcViajeToast = setTimeout(function(){
      toast.classList.remove('show');
    }, 2000);
  }

  byId('budgetForm').addEventListener('submit', function(event){
    event.preventDefault();
    save();
  });

  ['budget','people','days','hotelDaily','foodDaily'].forEach(function(id){
    byId(id).addEventListener('input', render);
  });

  byId('themeToggle').addEventListener('click', function(){
    var dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    byId('themeToggle').textContent = dark ? '☀' : '☾';

    try{
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    }catch(error){}
  });

  try{
    if(localStorage.getItem(THEME_KEY) === 'dark'){
      document.body.classList.add('dark');
      byId('themeToggle').textContent = '☀';
    }
  }catch(error){}

  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('./sw.js').catch(function(){});
    });
  }

  load();
  render();
})();