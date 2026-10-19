import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('Checking Supabase...')

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.auth.getSession()

        if (error) {
          setStatus(`Supabase error: ${error.message}`)
          return
        }

        setStatus('Supabase client initialized successfully!')
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : 'Unable to initialize Supabase'
        )
      }
    }

    checkConnection()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600">
          ICSphere
        </h1>

        <p className="mt-4 text-slate-600">
          {status}
        </p>
      </div>
    </main>
  )
}

export default App