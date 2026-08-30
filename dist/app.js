"use strict";

const STORAGE_KEY="palabras-words";
const SAMPLE=[
  {id:"1",spanish:"la manzana",german:"der Apfel",score:0},
  {id:"2",spanish:"el durazno",german:"der Pfirsich",score:0},
  {id:"3",spanish:"la mañana",german:"der Morgen",score:0},
  {id:"4",spanish:"descansar",german:"sich ausruhen",score:0},
  {id:"5",spanish:"entrenar",german:"trainieren",score:0},
  {id:"6",spanish:"cocinar",german:"kochen",score:0}
];
const $=id=>document.getElementById(id);
let words=loadWords(),mode="cards",index=0,revealed=false,selectedId=null,choices=[];

function copySample(){return SAMPLE.map(word=>({...word}))}
function loadWords(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved)?saved:copySample();
  }catch{return copySample()}
}
function saveWords(){localStorage.setItem(STORAGE_KEY,JSON.stringify(words))}

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
    id:`${Date.now()}-${rowIndex}`,spanish:row[0],german:row[1],score:0
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
function currentWord(){return words.length?words[index%words.length]:null}
function prepareChoices(){
  const current=currentWord();if(!current)return[];
  return shuffle([...shuffle(words.filter(word=>word.id!==current.id)).slice(0,3),current]);
}
function updateProgress(){
  const learned=words.filter(word=>word.score>=2).length;
  const progress=words.length?Math.round(learned/words.length*100):0;
  $("learned-count").textContent=learned;$("word-count").textContent=words.length;
  $("progress-percent").textContent=`${progress}%`;$("progress-bar").style.width=`${progress}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow",progress);
}
function render(){
  updateProgress();const current=currentWord();
  $("cards-mode").classList.toggle("active",mode==="cards");
  $("quiz-mode").classList.toggle("active",mode==="quiz");
  $("empty-view").classList.toggle("hidden",Boolean(current));
  $("card-view").classList.toggle("hidden",!current||mode!=="cards");
  $("quiz-view").classList.toggle("hidden",!current||mode!=="quiz");
  if(!current)return;
  const position=`${index+1} / ${words.length}`;
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
  const current=currentWord();
  if(current&&typeof result==="boolean"){
    current.score=Math.max(0,Math.min(3,current.score+(result?1:-1)));saveWords();
  }
  index=words.length?(index+1)%words.length:0;revealed=false;selectedId=null;
  choices=prepareChoices();render();
}
async function importFile(file){
  const imported=parseCsv(await file.text());
  if(!imported.length){alert("Die Datei enthält keine gültigen spanisch-deutschen Wortpaare.");return}
  words=imported;index=0;revealed=false;selectedId=null;choices=prepareChoices();saveWords();render();
}
function openFilePicker(){$("file-input").click()}

$("import-button").addEventListener("click",openFilePicker);
$("empty-import").addEventListener("click",openFilePicker);
$("file-input").addEventListener("change",event=>{const file=event.target.files[0];if(file)importFile(file);event.target.value=""});
$("cards-mode").addEventListener("click",()=>{mode="cards";selectedId=null;render()});
$("quiz-mode").addEventListener("click",()=>{mode="quiz";revealed=false;selectedId=null;choices=prepareChoices();render()});
$("reveal-button").addEventListener("click",()=>{revealed=true;render()});
$("repeat-button").addEventListener("click",()=>next(false));
$("known-button").addEventListener("click",()=>next(true));
$("quiz-next").addEventListener("click",()=>next(selectedId===currentWord().id));
$("speak-spanish").addEventListener("click",()=>speak(currentWord().spanish,"es-ES"));
$("speak-german").addEventListener("click",()=>speak(currentWord().german,"de-DE"));
$("quiz-speak").addEventListener("click",()=>speak(currentWord().spanish,"es-ES"));
$("reset-button").addEventListener("click",()=>{words=copySample();index=0;revealed=false;selectedId=null;choices=prepareChoices();saveWords();render()});

choices=prepareChoices();render();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
