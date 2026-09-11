"use strict";

const WORDS_KEY="palabras-words";
const CATEGORIES_KEY="palabras-categories";
const SELECTED_CATEGORY_KEY="palabras-selected-category";
const DEFAULT_CATEGORY="Allgemein";
const SAMPLE=[
  {id:"1",spanish:"la manzana",german:"der Apfel",score:0,category:DEFAULT_CATEGORY},
  {id:"2",spanish:"el durazno",german:"der Pfirsich",score:0,category:DEFAULT_CATEGORY},
  {id:"3",spanish:"la mañana",german:"der Morgen",score:0,category:DEFAULT_CATEGORY},
  {id:"4",spanish:"descansar",german:"sich ausruhen",score:0,category:DEFAULT_CATEGORY},
  {id:"5",spanish:"entrenar",german:"trainieren",score:0,category:DEFAULT_CATEGORY},
  {id:"6",spanish:"cocinar",german:"kochen",score:0,category:DEFAULT_CATEGORY}
];

const $=id=>document.getElementById(id);
let words=loadWords();
let categories=loadCategories();
let selectedCategory=loadSelectedCategory();
let mode="cards",index=0,revealed=false,selectedId=null,choices=[],pendingImport=null;

function copySample(){return SAMPLE.map(word=>({...word}))}
function normalizeCategory(value){return String(value||"").trim().slice(0,50)}
function loadWords(){
  try{
    const saved=JSON.parse(localStorage.getItem(WORDS_KEY));
    if(!Array.isArray(saved))return copySample();
    return saved.map(word=>({...word,category:normalizeCategory(word.category)||DEFAULT_CATEGORY}));
  }catch{return copySample()}
}
function loadCategories(){
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem(CATEGORIES_KEY))}catch{}
  const fromWords=words.map(word=>word.category);
  return uniqueCategories([...(Array.isArray(saved)?saved:[]),...fromWords,DEFAULT_CATEGORY]);
}
function loadSelectedCategory(){
  const saved=normalizeCategory(localStorage.getItem(SELECTED_CATEGORY_KEY));
  return categories.includes(saved)?saved:categories[0];
}
function uniqueCategories(values){
  const seen=new Set(),result=[];
  for(const value of values){
    const category=normalizeCategory(value);
    const key=category.toLocaleLowerCase("de");
    if(category&&!seen.has(key)){seen.add(key);result.push(category)}
  }
  return result;
}
function saveState(){
  localStorage.setItem(WORDS_KEY,JSON.stringify(words));
  localStorage.setItem(CATEGORIES_KEY,JSON.stringify(categories));
  localStorage.setItem(SELECTED_CATEGORY_KEY,selectedCategory);
}
function activeWords(){return words.filter(word=>word.category===selectedCategory)}
function currentWord(){
  const active=activeWords();
  return active.length?active[index%active.length]:null;
}

function detectDelimiter(line){
  let best=";",bestCount=-1;
  for(const delimiter of [";","\t",","]){
    let count=0,quoted=false;
    for(let i=0;i<line.length;i+=1){
      if(line[i]==='"'){
        if(quoted&&line[i+1]==='"')i+=1;else quoted=!quoted;
      }else if(!quoted&&line[i]===delimiter)count+=1;
    }
    if(count>bestCount){best=delimiter;bestCount=count}
  }
  return best;
}
function parseRows(text,delimiter){
  const rows=[];let row=[],cell="",quoted=false;
  const input=text.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n");
  for(let i=0;i<input.length;i+=1){
    const char=input[i];
    if(char==='"'){
      if(quoted&&input[i+1]==='"'){cell+='"';i+=1}else quoted=!quoted;
    }else if(!quoted&&char===delimiter){row.push(cell.trim());cell=""}
    else if(!quoted&&char==="\n"){row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=""}
    else cell+=char;
  }
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
function parseCsv(text){
  const firstLine=text.replace(/^\uFEFF/,"").split(/\r?\n/,1)[0]||"";
  const rows=parseRows(text,detectDelimiter(firstLine));
  if(rows[0]&&/spanisch|spanish|español/i.test(rows[0][0]))rows.shift();
  return rows.filter(row=>row[0]&&row[1]).map((row,rowIndex)=>({
    id:`${Date.now()}-${rowIndex}`,
    spanish:row[0],
    german:row[1],
    score:0,
    category:normalizeCategory(row[2])
  }));
}
function speak(text,language){
  if(!("speechSynthesis" in window))return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang=language;utterance.rate=.88;speechSynthesis.speak(utterance);
}
function shuffle(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i-=1){
    const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function prepareChoices(){
  const current=currentWord(),active=activeWords();
  if(!current)return[];
  return shuffle([...shuffle(active.filter(word=>word.id!==current.id)).slice(0,3),current]);
}
function resetCard(){
  index=0;revealed=false;selectedId=null;choices=prepareChoices();
}

function renderCategories(){
  const select=$("category-select");select.replaceChildren();
  for(const category of categories){
    const option=document.createElement("option");
    option.value=category;option.textContent=category;option.selected=category===selectedCategory;
    select.append(option);
  }
}
function updateProgress(){
  const active=activeWords();
  const learned=active.filter(word=>word.score>=2).length;
  const progress=active.length?Math.round(learned/active.length*100):0;
  $("learned-count").textContent=learned;$("word-count").textContent=active.length;
  $("progress-percent").textContent=`${progress}%`;$("progress-bar").style.width=`${progress}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow",progress);
}
function render(){
  renderCategories();updateProgress();
  const active=activeWords(),current=currentWord();
  $("cards-mode").classList.toggle("active",mode==="cards");
  $("quiz-mode").classList.toggle("active",mode==="quiz");
  $("empty-view").classList.toggle("hidden",Boolean(current));
  $("card-view").classList.toggle("hidden",!current||mode!=="cards");
  $("quiz-view").classList.toggle("hidden",!current||mode!=="quiz");
  $("empty-message").textContent=words.length
    ? `Die Kategorie „${selectedCategory}“ enthält noch keine Wörter. Importiere eine CSV und ordne sie dieser Kategorie zu.`
    :"CSV mit Spanisch in Spalte 1, Deutsch in Spalte 2 und optionaler Kategorie in Spalte 3.";
  if(!current)return;
  const position=`${index+1} / ${active.length}`;
  $("card-position").textContent=position;$("quiz-position").textContent=position;
  $("spanish-text").textContent=current.spanish;$("quiz-spanish").textContent=current.spanish;
  $("answer").classList.toggle("visible",revealed);
  $("german-text").textContent=revealed?current.german:"••••••••";
  $("speak-german").classList.toggle("hidden",!revealed);
  $("reveal-button").classList.toggle("hidden",revealed);
  $("answer-actions").classList.toggle("hidden",!revealed);
  if(mode==="quiz")renderChoices(current);
}
function renderChoices(current){
  const container=$("choices");container.replaceChildren();
  for(const choice of choices){
    const button=document.createElement("button");button.type="button";button.textContent=choice.german;
    button.disabled=selectedId!==null;const correct=choice.id===current.id;
    if(selectedId===choice.id){button.classList.add(correct?"correct":"wrong");button.append(document.createTextNode(correct?"  ✓":"  ✕"))}
    else if(selectedId&&correct){button.classList.add("correct");button.append(document.createTextNode("  ✓"))}
    button.addEventListener("click",()=>{selectedId=choice.id;render()});container.append(button);
  }
  $("quiz-next").classList.toggle("hidden",selectedId===null);
}
function next(result){
  const current=currentWord(),active=activeWords();
  if(current&&typeof result==="boolean"){
    current.score=Math.max(0,Math.min(3,current.score+(result?1:-1)));saveState();
  }
  index=active.length?(index+1)%active.length:0;revealed=false;selectedId=null;
  choices=prepareChoices();render();
}

function showImportDialog(imported){
  pendingImport=imported;
  const select=$("import-category");select.replaceChildren();
  for(const category of categories){
    const option=document.createElement("option");
    option.value=category;option.textContent=category;option.selected=category===selectedCategory;
    select.append(option);
  }
  $("import-dialog").showModal();
}
function finishImport(imported,fallbackCategory){
  words=imported.map(word=>({...word,category:word.category||fallbackCategory}));
  categories=uniqueCategories([...categories,...words.map(word=>word.category)]);
  selectedCategory=words[0]?.category||selectedCategory;
  resetCard();saveState();render();
}
async function importFile(file){
  const imported=parseCsv(await file.text());
  if(!imported.length){alert("Die Datei enthält keine gültigen spanisch-deutschen Wortpaare.");return}
  if(imported.some(word=>!word.category))showImportDialog(imported);
  else finishImport(imported,selectedCategory);
}
function createCategory(name){
  const normalized=normalizeCategory(name);
  if(!normalized)return;
  const existing=categories.find(category=>category.toLocaleLowerCase("de")===normalized.toLocaleLowerCase("de"));
  if(existing){selectedCategory=existing}
  else{categories.push(normalized);selectedCategory=normalized}
  resetCard();saveState();render();
}
function openFilePicker(){
  const input=$("file-input");
  input.value="";
  if(typeof input.showPicker==="function"){
    try{input.showPicker();return}catch{}
  }
  input.click();
}

$("import-button").addEventListener("click",openFilePicker);
$("empty-import").addEventListener("click",openFilePicker);
$("file-input").addEventListener("change",event=>{const file=event.target.files[0];if(file)importFile(file);event.target.value=""});
$("category-select").addEventListener("change",event=>{selectedCategory=event.target.value;resetCard();saveState();render()});
$("add-category-button").addEventListener("click",()=>{$("category-name").value="";$("category-dialog").showModal();$("category-name").focus()});
$("category-form").addEventListener("submit",event=>{
  if(event.submitter?.value==="cancel")return;
  event.preventDefault();createCategory($("category-name").value);$("category-dialog").close();
});
$("import-form").addEventListener("submit",event=>{
  if(event.submitter?.value==="cancel"){pendingImport=null;return}
  event.preventDefault();finishImport(pendingImport,$("import-category").value);pendingImport=null;$("import-dialog").close();
});
$("cards-mode").addEventListener("click",()=>{mode="cards";selectedId=null;render()});
$("quiz-mode").addEventListener("click",()=>{mode="quiz";revealed=false;selectedId=null;choices=prepareChoices();render()});
$("reveal-button").addEventListener("click",()=>{revealed=true;render()});
$("repeat-button").addEventListener("click",()=>next(false));
$("known-button").addEventListener("click",()=>next(true));
$("quiz-next").addEventListener("click",()=>next(selectedId===currentWord()?.id));
$("speak-spanish").addEventListener("click",()=>{const word=currentWord();if(word)speak(word.spanish,"es-ES")});
$("speak-german").addEventListener("click",()=>{const word=currentWord();if(word)speak(word.german,"de-DE")});
$("quiz-speak").addEventListener("click",()=>{const word=currentWord();if(word)speak(word.spanish,"es-ES")});
$("reset-button").addEventListener("click",()=>{
  words=copySample();categories=[DEFAULT_CATEGORY];selectedCategory=DEFAULT_CATEGORY;
  resetCard();saveState();render();
});

choices=prepareChoices();render();
saveState();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
