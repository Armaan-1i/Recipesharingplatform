/* main.js - handles theme, localStorage recipes, search, filters, details, export/import */
(function(){
  // utils
  function qs(id){return document.getElementById(id)}
  function $(sel){return document.querySelector(sel)}
  function $all(sel){return Array.from(document.querySelectorAll(sel))}

  // THEME
  const themeToggle = qs('themeToggle');
  const savedTheme = localStorage.getItem('rw_theme');
  if(savedTheme==='dark') document.body.classList.add('dark');
  if(themeToggle){
    themeToggle.addEventListener('click', ()=>{
      document.body.classList.toggle('dark');
      localStorage.setItem('rw_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // SAMPLE RECIPES (used to populate preview if none exist)
  const sampleRecipes = [
    {
      id: 'r1',
      title: 'Creamy Garlic Pasta',
      type: 'veg',
      image: 'https://images.unsplash.com/photo-1604908177522-4f7ec59f77e4',
      ingredients: ['200g pasta','2 cloves garlic','100ml cream','Salt','Pepper'],
      steps: ['Boil pasta','Prepare sauce','Mix and serve']
    },
    {
      id: 'r2',
      title: 'Chocolate Chip Cookies',
      type: 'dessert',
      image: 'https://images.unsplash.com/photo-1542826438-1b6f1e88c7df',
      ingredients: ['2 cups flour','1 cup sugar','1 cup chocolate chips'],
      steps: ['Mix ingredients','Bake 10-12 mins']
    },
    {
      id: 'r3',
      title: 'Fresh Rainbow Salad',
      type: 'veg',
      image: 'https://images.unsplash.com/photo-1543353071-087092ec393a',
      ingredients: ['Lettuce','Tomato','Cucumber','Olives','Dressing'],
      steps: ['Chop veggies','Toss with dressing']
    }
  ];

  // STORAGE
  function getRecipes(){
    try{
      const raw = localStorage.getItem('rw_recipes');
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return [];}
  }
  function saveRecipes(list){
    localStorage.setItem('rw_recipes', JSON.stringify(list));
  }
  function ensureSample(){
    if(!getRecipes()){
      saveRecipes(sampleRecipes);
    }
  }

  // Render preview on home
  function renderPreview(){
    const el = qs('previewList');
    if(!el) return;
    ensureSample();
    const list = getRecipes() || [];
    el.innerHTML = list.slice(0,3).map(r=>`<a class="card preview" href="recipes.html" title="${r.title}">
      <img src="${r.image||''}" alt="">
      <h3>${r.title}</h3>
      <p>${r.type.charAt(0).toUpperCase()+r.type.slice(1)}</p>
    </a>`).join('');
  }

  // Render recipes list with search + filter
  function renderList(){
    const el = qs('recipeList');
    if(!el) return;
    ensureSample();
    let list = getRecipes() || [];
    const q = qs('searchInput')? qs('searchInput').value.trim().toLowerCase() : '';
    const filter = qs('filterType')? qs('filterType').value : 'all';
    if(q) list = list.filter(r=> r.title.toLowerCase().includes(q) || (r.ingredients && r.ingredients.join(' ').toLowerCase().includes(q)));
    if(filter && filter!=='all') list = list.filter(r=> r.type===filter);
    if(list.length===0){ el.innerHTML = '<p>No recipes found. Add one from Share page.</p>'; return;}
    el.innerHTML = list.map(r=>`<article class="card">
      <a href="recipe-details.html?id=${encodeURIComponent(r.id)}">
        <img src="${r.image||''}" alt="${r.title}">
      </a>
      <div style="padding:12px">
        <h3>${r.title}</h3>
        <p style="color:var(--muted)">${r.type.charAt(0).toUpperCase()+r.type.slice(1)}</p>
        <p style="margin-top:8px;color:var(--muted);font-size:0.95rem">${(r.ingredients||[]).slice(0,3).join(', ')}${(r.ingredients||[]).length>3?'...':''}</p>
      </div>
    </article>`).join('');
  }

  // Details page renderer
  function renderDetails(){
    const el = qs('recipeDetails');
    if(!el) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if(!id){ el.innerHTML = '<p>Recipe not found.</p>'; return;}
    const list = getRecipes() || [];
    const r = list.find(x=> x.id===id);
    if(!r){ el.innerHTML = '<p>Recipe not found.</p>'; return;}
    el.innerHTML = `<div class="detail-card">
      <img src="${r.image||''}" alt="${r.title}">
      <h2>${r.title}</h2>
      <p style="color:var(--muted)">${r.type.charAt(0).toUpperCase()+r.type.slice(1)}</p>
      <h4>Ingredients</h4>
      <ul>${(r.ingredients||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
      <h4>Steps</h4>
      <ol>${(r.steps||[]).map(s=>`<li>${s}</li>`).join('')}</ol>
    </div>`;
  }

  // Share form handling, export/import
  function setupShare(){
    const form = qs('shareForm');
    if(!form) return;
    qs('saveExample').addEventListener('click', ()=>{
      const list = getRecipes()||[];
      list.unshift({
        id: 'ex'+Date.now(),
        title: 'Example Pancakes',
        type: 'dessert',
        image: 'https://images.unsplash.com/photo-1559628233-6d6b1f8b2f5f',
        ingredients: ['1 cup flour','1 cup milk','1 egg'],
        steps: ['Mix','Cook on pan']
      });
      saveRecipes(list);
      alert('Example recipe saved. Visit Recipes page.');
    });
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const list = getRecipes()||[];
      const id = 'r'+Date.now();
      const title = qs('title').value.trim();
      const type = qs('type').value;
      const image = qs('image').value.trim();
      const ingredients = qs('ingredients').value.split('\n').map(s=>s.trim()).filter(Boolean);
      const steps = qs('steps').value.split('\n').map(s=>s.trim()).filter(Boolean);
      const obj = {id,title,type,image,ingredients,steps};
      list.unshift(obj);
      saveRecipes(list);
      alert('Recipe saved locally! You can view it on the Recipes page.');
      form.reset();
      location.href = 'recipes.html';
    });

    // export
    qs('exportBtn').addEventListener('click', ()=>{
      const data = JSON.stringify(getRecipes()||[], null, 2);
      const blob = new Blob([data], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'recipeworld-export.json'; a.click();
      URL.revokeObjectURL(url);
    });
    // import
    qs('importBtn').addEventListener('click', ()=> qs('importFile').click());
    qs('importFile').addEventListener('change', (e)=>{
      const f = e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = function(){ 
        try{
          const arr = JSON.parse(reader.result);
          if(Array.isArray(arr)){
            saveRecipes(arr.concat(getRecipes()||[]));
            alert('Imported recipes. Visit Recipes page.');
          } else alert('Invalid file.');
        }catch(err){ alert('Invalid JSON'); }
      };
      reader.readAsText(f);
    });
  }

  // INIT on DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{
    renderPreview();
    renderList();
    renderDetails();
    setupShare();

    // search/filter listeners
    const s = qs('searchInput');
    if(s) s.addEventListener('input', renderList);
    const f = qs('filterType');
    if(f) f.addEventListener('change', renderList);
    const clear = qs('clearBtn');
    if(clear) clear.addEventListener('click', ()=>{
      if(qs('searchInput')) qs('searchInput').value='';
      if(qs('filterType')) qs('filterType').value='all';
      renderList();
    });
  });
})();
