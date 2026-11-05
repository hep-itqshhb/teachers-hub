const fs=require('node:fs');
const vm=require('node:vm');
function harness(sourceFile, extra={}){
 let now=Date.parse('2026-11-05T14:00:00Z');
 const elements=new Map(), timers=new Map(), documentListeners={}, redirects=[];
 let timerId=0,authListener;
 class Element{
  constructor(id){this.id=id;this.hidden=false;this.disabled=false;this.textContent='';this.dataset={};this.listeners={};this.values={};this.value='';this.classList={toggle(){},add(){},remove(){}};this.elements={namedItem:n=>({value:this.values[n]||''})};}
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(k,v){this[k]=v;}
  querySelector(){return get(this.id+'-submit');}
  focus(){}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)};
 get('verify-view').hidden=true;
 get('register-form').values={name:'QA Educator',phone:'00000000',email:'qa@itqshhb.edu.bn',password:'testing12345',confirm:'testing12345'};
 const calls={send:0,create:0,reload:0,tokens:0,profile:0};
 const pending=[];
 const user={uid:'qa-test',email:'qa@itqshhb.edu.bn',emailVerified:false};
 const auth={currentUser:null,useDeviceLanguage(){}};
 const deferred=()=>new Promise((resolve,reject)=>pending.push({resolve,reject}));
 const storage=new Map();
 const context={
  ...extra,console:{error(){},warn(){},info(){}},URLSearchParams,Intl,Promise,
  Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}},
  document:{hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener:(n,f)=>documentListeners[n]=f},
  location:{search:'?mode=register'},
  window:{location:{replace:url=>redirects.push(url)},setInterval:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},clearInterval:id=>timers.delete(id),setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},clearTimeout:id=>timers.delete(id),addEventListener:(n,f)=>documentListeners[n]=f},
  sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  getAuth:()=>auth,app:{},db:{},ADMIN_EMAIL:'admin@example.com',
  createUserWithEmailAndPassword:async()=>{calls.create++;auth.currentUser=user;authListener(user);return {user}},
  onAuthStateChanged:(_a,fn)=>{authListener=fn},
  sendEmailVerification:()=>{calls.send++;return deferred()},
  updateProfile:async()=>{},doc:()=>({}),serverTimestamp:()=>({}),
  setDoc:async()=>{calls.profile++;if(extra.profileError)throw Error('profile write unavailable')},
  reload:async()=>{calls.reload++},getIdToken:async()=>{calls.tokens++;return 'test-token'},
  signOut:async()=>{auth.currentUser=null;authListener(null)},
  signInWithEmailAndPassword:async()=>({user}),sendPasswordResetEmail:async()=>{}
 };
 Object.assign(context,extra);
 const source=fs.readFileSync(sourceFile,'utf8').replace(/^import\s+[\s\S]*?\s+from\s+"[^"]+";\r?\n/gm,'');
 vm.runInNewContext(source,context,{filename:sourceFile});
 return {get,calls,pending,user,auth,storage,timers,redirects,documentListeners,context,advance:ms=>{now+=ms},submit:()=>get('register-form').listeners.submit({preventDefault(){}}),click:id=>get(id).listeners.click(),tick:async()=>{for(let i=0;i<12;i++)await Promise.resolve()}};
}
module.exports={harness};
