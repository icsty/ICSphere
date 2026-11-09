// Local browser integration using synthetic data and an explicitly mocked API.
// Requires Vite at ICS_TEST_ORIGIN and an existing Chrome CDP port (9228).
import assert from 'node:assert/strict'
import {writeFile,mkdir} from 'node:fs/promises'

const origin=process.env.ICS_TEST_ORIGIN || 'http://127.0.0.1:5179'
const tabs=await (await fetch('http://127.0.0.1:9228/json')).json()
const tab=tabs.find(value=>value.type==='page')
const socket=new WebSocket(tab.webSocketDebuggerUrl)
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}))
let sequence=0
const pending=new Map()
const browserErrors=[]
socket.addEventListener('message',event=>{const value=JSON.parse(event.data);if(value.id){const item=pending.get(value.id);pending.delete(value.id);if(value.error)item.reject(value.error);else item.resolve(value.result)}})
socket.addEventListener('message',event=>{const value=JSON.parse(event.data);if(value.method==='Runtime.exceptionThrown')browserErrors.push(value.params.exceptionDetails.exception?.description || value.params.exceptionDetails.text)})
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const value=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(value.exceptionDetails)throw new Error(value.exceptionDetails.text+': '+value.exceptionDetails.exception?.description);return value.result.value}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(`Boolean(${expression})`))return;await new Promise(resolve=>setTimeout(resolve,100))}throw new Error('Timed out: '+expression)}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
try {
  await call('Page.enable');await call('Runtime.enable');await call('Page.bringToFront');await call('Emulation.setFocusEmulationEnabled',{enabled:true})
  await call('Page.navigate',{url:origin+'/preview/onboarding'})
  await until('document.querySelector(".registration-panel") && !document.getElementById("boot-splash")')
  await evaluate(`(async()=>{
    // Reuse the exact dependency URLs loaded by Vite, including their version
    // queries, so the harness cannot create a second React dispatcher.
    const dependency=name=>performance.getEntriesByType('resource').map(item=>item.name).find(url=>new URL(url).pathname.endsWith('/'+name));
    const reactModule=await import(dependency('react.js'));const React=reactModule.default || reactModule;
    const domModule=await import(dependency('react-dom_client.js'));const {createRoot}=domModule.default || domModule;
    const {Onboarding,Verification}=await import('/src/pages/ApplicantScreens.tsx');
    const {ApplicantLayout}=await import('/src/components/ApplicantLayout.tsx');
    document.getElementById('root').remove();
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const personal={lastName:'Dela Cruz',firstName:'Ana',middleName:'',suffix:'',studentNumber:'2020-000001'};
    const academic={schoolYearSemester:'2026-1S',courseNumber:'ICS-01',section:'ICS-01-101A',totalUnits:'3',subjects:[{code:'TEST101',description:'Synthetic test subject',units:'3',section:'ICS-01-101A',schedule:'M 07:30a - 09:00a',classroom:'N/A'}]};
    const auth={session:{access_token:'synthetic-local-token',user:{id:'synthetic-user',email:'2020-000001@rtu.edu.ph'}},loading:false,configured:true,action:null,message:'',signOut(){}};
    const registration={data:{role:'STUDENT',application:null},loading:false,error:'',refresh(){}};
    window.__registrationTest={root,React,Verification,ApplicantLayout,auth,registration,personal,academic,requests:[]};
    root.render(React.createElement(ApplicantLayout,{auth,path:'/onboarding',preview:false},React.createElement(Onboarding,{auth,registration,preview:false})));
  })()`)
  await until('document.querySelector("#student-lastName")')
  await mkdir('output/registration',{recursive:true})
  for(const width of [320,1440]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<700})
    assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true)
    const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
    await writeFile(`output/registration/personal-${width}.png`,Buffer.from(screenshot.data,'base64'))
  }
  await click('.registration-actions .primary-button')
  await until('document.querySelectorAll("[aria-invalid=true]").length===2')
  for(const [selector,value] of [['#student-lastName','Dela Cruz'],['#student-firstName','Ana']]){
    await evaluate(`document.querySelector('${selector}').focus()`);await call('Input.insertText',{text:value})
    await until(`document.querySelector('${selector}').value===${JSON.stringify(value)}`)
  }
  await click('.registration-actions .primary-button')
  await until('document.querySelector("[role=status]")?.textContent.includes("New submissions are paused")')
  assert.equal(await evaluate('Boolean(document.querySelector("input[type=file]"))'),false)
  assert.equal(await evaluate('window.__registrationTest.requests.length'),0)
  for(const width of [320,768,1440]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<700})
    assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true)
  }
  for(const status of ['pending','approved','rejected','deactivated']){
    await evaluate(`(()=>{const t=window.__registrationTest;t.root.render(t.React.createElement(t.ApplicantLayout,{auth:t.auth,path:'/verification',preview:false},t.React.createElement(t.Verification,{auth:t.auth,preview:false,registration:{...t.registration,data:{...t.registration.data,application:{id:'synthetic',status:'${status}',version:1,personal:t.personal,academic:t.academic,original:{},submitted_at:'2026-01-01',reviewed_at:null,review_reason:'Synthetic review reason'}}}})))})()`)
    await until(`document.querySelector('.registration-status--${status}')`)
    assert.equal(await evaluate(`Boolean(document.querySelector('a[href="/dashboard"]'))`),status==='approved')
  }
  await evaluate(`(async()=>{
    const t=window.__registrationTest;const {default:RegistrationReview}=await import('/src/pages/RegistrationReview.tsx');
    const application={id:'00000000-0000-4000-8000-000000000002',status:'pending',version:1,personal:t.personal,academic:t.academic,original:{programField:'BSINFOTECH',academic:t.academic},submitted_at:'2026-01-01',reviewed_at:null,review_reason:null};
    window.fetch=async(_url,options)=>{
      const input=JSON.parse(options.body);t.requests.push(input);
      if(input.action==='queue')return new Response(JSON.stringify({applications:t.adminApproved ? []:[application],more:false}),{status:200});
      if(input.action==='detail')return new Response(JSON.stringify({application,documentUrl:'about:blank'}),{status:200});
      if(input.decision==='rejected')return new Response(JSON.stringify({error:'The application changed. Reload it before reviewing again.'}),{status:409});
      t.adminApproved=true;return new Response(JSON.stringify({application:{...application,status:'approved',version:2}}),{status:200});
    };
    t.root.render(t.React.createElement(t.ApplicantLayout,{auth:t.auth,path:'/admin/registrations',preview:false},t.React.createElement(RegistrationReview,{auth:t.auth})));
  })()`)
  await until('document.querySelector(".registration-review-list button")')
  await click('.registration-review-list button')
  await until('document.querySelector(".registration-reason textarea")')
  await click('.registration-panel .registration-actions .secondary-button')
  await until('document.querySelector("[role=alert]")?.textContent.includes("Provide a clear reason")')
  await evaluate('document.querySelector("textarea").focus()');await call('Input.insertText',{text:'Please provide a readable form.'})
  await click('.registration-panel .registration-actions .secondary-button')
  await until('document.querySelector("[role=alert]")?.textContent.includes("application changed")')
  assert.equal(await evaluate('Boolean(document.querySelector(".registration-reason textarea"))'),true)
  await click('.registration-review-toolbar button')
  await until('document.querySelector(".registration-review-list button") && !document.querySelector(".registration-review-list button").disabled')
  await click('.registration-review-list button')
  await until('document.querySelector(".registration-panel .primary-button")')
  await click('.registration-panel .primary-button')
  await until('window.__registrationTest.adminApproved && document.querySelectorAll(".registration-review-list li").length===0')
  console.log('Browser passed: required names, paused document submission without a file picker or requests, four status states, administrator review/reason/stale-decision handling, and responsive overflow at 320/768/1440px. API was mocked; no live records written.')
} catch(error) {
  console.log('Browser exceptions:',browserErrors)
  console.log('Browser diagnostic:',await evaluate('JSON.stringify({active:document.activeElement?.outerHTML.slice(0,300),values:Array.from(document.querySelectorAll("input")).map(input=>({id:input.id,value:input.value})),alerts:Array.from(document.querySelectorAll("[role=alert]")).map(item=>item.textContent)})'))
  throw error
} finally {
  await call('Emulation.setFocusEmulationEnabled',{enabled:false})
  await call('Page.navigate',{url:origin+'/preview/onboarding'})
  socket.close()
}
