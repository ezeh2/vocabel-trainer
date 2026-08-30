"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {BookOpen,Check,FileUp,RotateCcw,Shuffle,Speaker,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
type Word={id:string;spanish:string;german:string;score:number};
const SAMPLE:Word[]=[
 {id:"1",spanish:"la manzana",german:"der Apfel",score:0},{id:"2",spanish:"el durazno",german:"der Pfirsich",score:0},
 {id:"3",spanish:"la mañana",german:"der Morgen",score:0},{id:"4",spanish:"descansar",german:"sich ausruhen",score:0},
 {id:"5",spanish:"entrenar",german:"trainieren",score:0},{id:"6",spanish:"cocinar",german:"kochen",score:0}];
function parseCsv(text:string){const rows=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);const out=rows.map((row,i)=>{const d=row.includes(";")?";":row.includes("\t")?"\t":",";const c=row.split(d).map(x=>x.trim().replace(/^"|"$/g,""));return{id:`${Date.now()}-${i}`,spanish:c[0]||"",german:c[1]||"",score:0}}).filter(x=>x.spanish&&x.german);if(out[0]&&/spanisch|spanish|español/i.test(out[0].spanish))out.shift();return out;}
function speak(text:string,lang:"es-ES"|"de-DE"){if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.88;window.speechSynthesis.speak(u);}
export default function Home(){
 const [words,setWords]=useState<Word[]>(SAMPLE),[mode,setMode]=useState<"cards"|"quiz">("cards"),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[selected,setSelected]=useState<string|null>(null),[ready,setReady]=useState(false);const fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{const saved=localStorage.getItem("palabras-words");if(saved)try{setWords(JSON.parse(saved))}catch{}setReady(true);if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{})},[]);
 useEffect(()=>{if(ready)localStorage.setItem("palabras-words",JSON.stringify(words))},[words,ready]);
 const current=words[index%Math.max(words.length,1)],learned=words.filter(w=>w.score>=2).length,progress=words.length?Math.round(learned/words.length*100):0;
 const choices=useMemo(()=>current?[...words.filter(w=>w.id!==current.id).sort(()=>Math.random()-.5).slice(0,3),current].sort(()=>Math.random()-.5):[],[current?.id,mode]);
 function next(result?:boolean){if(typeof result==="boolean"&&current)setWords(all=>all.map(w=>w.id===current.id?{...w,score:Math.max(0,Math.min(3,w.score+(result?1:-1)))}:w));setIndex(v=>(v+1)%Math.max(words.length,1));setRevealed(false);setSelected(null)}
 async function importFile(file:File){const imported=parseCsv(await file.text());if(imported.length){setWords(imported);setIndex(0);setRevealed(false);setSelected(null)}}
 if(!ready)return null;
 return <main className="min-h-dvh px-4 py-5 sm:px-6 sm:py-8"><div className="mx-auto max-w-md">
  <header><div><p className="eyebrow">Español · Deutsch</p><h1>Palabras</h1></div><button className="import-button" onClick={()=>fileRef.current?.click()} aria-label="CSV-Datei importieren"><FileUp/><span>CSV</span></button><input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv,text/plain" onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0])}/></header>
  <section className="progress-panel" aria-label="Lernfortschritt"><div className="flex items-end justify-between"><div><strong>{learned}</strong><span> von {words.length} gelernt</span></div><span>{progress}%</span></div><Progress value={progress} className="mt-3 h-2 bg-[#dde6df] [&_[data-slot=progress-indicator]]:bg-[#1d6b4f]"/></section>
  <nav className="mode-switch" aria-label="Übungsmodus"><button className={mode==="cards"?"active":""} onClick={()=>{setMode("cards");setSelected(null)}}><BookOpen/>Karten</button><button className={mode==="quiz"?"active":""} onClick={()=>{setMode("quiz");setRevealed(false)}}><Shuffle/>Auswahl</button></nav>
  {!current?<section className="empty-card"><FileUp/><h2>Vokabeln importieren</h2><p>CSV mit Spanisch in Spalte 1 und Deutsch in Spalte 2.</p><Button onClick={()=>fileRef.current?.click()}>CSV auswählen</Button></section>:mode==="cards"?<section className="study-card">
   <div className="card-topline"><span>SPANISCH</span><span>{index+1} / {words.length}</span></div><div className="word-row question"><h2>{current.spanish}</h2><button className="speak" onClick={()=>speak(current.spanish,"es-ES")} aria-label="Spanisches Wort vorlesen"><Speaker/></button></div>
   <div className={`answer ${revealed?"visible":""}`}><span>DEUTSCH</span><div className="word-row"><h3>{revealed?current.german:"••••••••"}</h3>{revealed&&<button className="speak secondary" onClick={()=>speak(current.german,"de-DE")} aria-label="Deutsches Wort vorlesen"><Speaker/></button>}</div></div>
   {!revealed?<Button className="main-action" onClick={()=>setRevealed(true)}>Übersetzung zeigen</Button>:<div className="answer-actions"><Button variant="outline" onClick={()=>next(false)}><X/>Noch üben</Button><Button onClick={()=>next(true)}><Check/>Gewusst</Button></div>}
  </section>:<section className="quiz-card"><div className="card-topline"><span>WÄHLE DIE ÜBERSETZUNG</span><span>{index+1} / {words.length}</span></div><div className="quiz-question"><h2>{current.spanish}</h2><button className="speak" onClick={()=>speak(current.spanish,"es-ES")} aria-label="Spanisches Wort vorlesen"><Speaker/></button></div><div className="choices">{choices.map(c=>{const checked=selected===c.id,correct=c.id===current.id;return <button key={c.id} disabled={selected!==null} className={checked?(correct?"correct":"wrong"):selected&&correct?"correct":""} onClick={()=>setSelected(c.id)}>{c.german}{checked&&(correct?<Check/>:<X/>)}</button>})}</div>{selected&&<Button className="main-action" onClick={()=>next(selected===current.id)}>Weiter</Button>}</section>}
  <footer><button onClick={()=>{setWords(SAMPLE);setIndex(0)}}><RotateCcw/>Beispielwörter wiederherstellen</button><p>Die Daten bleiben auf diesem Gerät.</p></footer>
 </div></main>}
