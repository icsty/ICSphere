import {loadEnv} from 'vite'
import {readdirSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import assert from 'node:assert/strict'
const environment=loadEnv('development',process.cwd(),'')
const secrets=[environment.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean)
assert.equal(secrets.length,1,'Configure the server secret before running this private check.')
const files=readdirSync('dist/assets').filter(name=>/\.(js|css)$/.test(name))
assert.ok(files.length>0,'Build the client before running this check.')
for(const file of files){
  const text=readFileSync(join('dist/assets',file),'utf8')
  assert.ok(!secrets.some(secret=>text.includes(secret)),'A server secret was included in a client asset.')
}
console.log(`Checked ${files.length} client assets: no configured server secrets are exposed.`)
