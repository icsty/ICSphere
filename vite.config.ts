import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({mode}) => {
  // Server-only configuration stays outside Vite's client environment prefix.
  const environment=loadEnv(mode,process.cwd(),'')
  for(const name of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']) if(environment[name])process.env[name]=environment[name]
  return { plugins:[react(),tailwindcss(),{
    name:'registration-api',
    configureServer(server){
      server.middlewares.use('/api/registration',async(request,response)=>{
        try{const {default:handler}=await server.ssrLoadModule('/api/registration.ts');await handler(request,response)}
        catch{response.statusCode=503;response.setHeader('Content-Type','application/json');response.end(JSON.stringify({error:'The registration service is temporarily unavailable.'}))}
      })
    },
  }] }
})
