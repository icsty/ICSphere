const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const ts=require('typescript')

function load(file,overrides={}) {
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const exported={}
  const localRequire=name=>name in overrides ? overrides[name] : name.startsWith('.') ? load(path.resolve(path.dirname(file),name),overrides) : require(name)
  vm.runInNewContext(code,{exports:exported,require:localRequire,Error,Buffer,structuredClone,URL,AbortSignal,fetch:overrides.fetch||fetch,process:{env:overrides.env||{}}})
  return exported
}
const {validatePersonal,validateAcademic}=load('src/lib/registration.ts')
const email='2020-000001@rtu.edu.ph'
const personal={lastName:'Dela Cruz',firstName:'Ana',middleName:'',suffix:'',studentNumber:'2020-000001'}
const academic={schoolYearSemester:'2026-1S',courseNumber:'ICS-01',section:'ICS-01-101A',totalUnits:'3',subjects:[{code:'TEST101',description:'Synthetic test subject',units:'3',section:'ICS-01-101A',schedule:'M 07:30a - 09:00a',classroom:'N/A'}]}
test('separate names preserve accents, optional fields, and identity binding',()=>{
  assert.equal(validatePersonal(personal,email).valid,true)
  assert.equal(validatePersonal({...personal,middleName:'  ',suffix:' III '},email).value.suffix,'III')
  for(const change of [{lastName:''},{firstName:'<script>'},{middleName:'A\u202e'},{suffix:'A'.repeat(21)},{studentNumber:'2020-000002'}])assert.equal(validatePersonal({...personal,...change},email).valid,false)
})
test('academic review validates all rows, units, and control characters',()=>{
  assert.equal(validateAcademic(academic).subjects[0].schedule,academic.subjects[0].schedule)
  for(const change of [{totalUnits:'4'},{totalUnits:'-3'},{subjects:[]},{schoolYearSemester:''},{section:'<script>'},{subjects:[{...academic.subjects[0],schedule:'A\u0000'}]}])assert.throws(()=>validateAcademic({...academic,...change}))
})
function server(options={}){
  const calls=[]
  const user={id:'00000000-0000-4000-8000-000000000001',email,email_confirmed_at:'2026-01-01',identities:[{provider:'google'}],user_metadata:{role:'ADMIN'}}
  const application=options.application||null
  const database={auth:{getUser:async token=>{calls.push(['auth',token]);return {data:{user:options.invalidSession ? null:user},error:options.invalidSession ? {}:null}}},from(table){const query={select(){return query},eq(){return query},order(){return query},range(){return query},update(value){calls.push(['update',table,value]);return query},async maybeSingle(){return {data:table==='users' ? options.account||null:table==='registration_applications' ? application:null,error:options.schemaError && table!=='users' ? {}:null}},async single(){return {data:table==='registration_applications' ? {...application,document_path:'private/test.png'}:{id:'test'},error:null}}};return query},rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:{},error:null}},storage:{from(){return {upload:async()=>({error:null}),remove:async paths=>{calls.push(['remove',paths]);return {error:null}},download:async()=>({data:null,error:{}})}}}}
  const env={SUPABASE_URL:'https://crzgazzspwarsbjvtfsl.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'synthetic-server-key',...options.env}
  const {default:handler}=load('api/registration.ts',{'@supabase/supabase-js':{createClient:()=>database},env,fetch:options.fetch})
  async function request(action,headers={}){
    const request={method:action ? 'POST':'GET',headers:{authorization:'Bearer synthetic-token','content-type':'application/json',...headers},body:action}
    let result
    const response={statusCode:200,setHeader(){},end(value){result={status:this.statusCode,body:JSON.parse(value)}}}
    await handler(request,response)
    return result
  }
  return {request,calls}
}
test('API verifies session with Auth and ignores client metadata claiming ADMIN',async()=>{
  const api=server()
  assert.equal((await api.request({action:'queue',status:'pending',offset:0})).status,403)
  assert.deepEqual(api.calls,[['auth','synthetic-token']])
  assert.equal((await server({invalidSession:true}).request()).status,401)
  assert.equal((await server().request(undefined,{authorization:''})).status,401)
})
test('API rejects another project and missing schema without reporting successful registration',async()=>{
  const api=server({env:{SUPABASE_URL:'https://other.invalid'}})
  assert.equal((await api.request()).status,503)
  assert.equal(api.calls.length,0)
  assert.equal((await server({schemaError:true}).request()).status,503)
})
test('approved application also requires an ACTIVE persisted account',async()=>{
  const application={status:'approved',personal,academic}
  assert.equal((await server({application:{...application},account:{role:'STUDENT',status:'RESTRICTED'}}).request()).body.application.status,'deactivated')
  assert.equal((await server({application:{...application},account:{role:'STUDENT',status:'ACTIVE'}}).request()).body.application.status,'approved')
})
test('removed document-processing actions cannot create or submit applications',async()=>{
 const api=server()
 for(const action of ['screen','submit'])assert.equal((await api.request({action,personal,academic,confirmed:true})).status,409)
 assert.equal(api.calls.filter(call=>['rpc','update','remove'].includes(call[0])).length,0)
})
test('administrator approval requires an accessible original document',async()=>{
  const api=server({account:{role:'ADMIN',status:'ACTIVE'},application:{status:'pending'}})
  const result=await api.request({action:'review',id:'00000000-0000-4000-8000-000000000002',version:1,decision:'approved'})
  assert.equal(result.status,503)
  assert.equal(api.calls.filter(call=>call[0]==='rpc').length,0)
})
