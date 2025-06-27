import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Optional: Create a client for server components that uses cookies
// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// 
// export function createServerSupabaseClient() {
//   const cookieStore = cookies()
//   
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name) {
//           return cookieStore.get(name)?.value
//         },
//         set(name, value, options) {
//           cookieStore.set({ name, value, ...options })
//         },
//         remove(name, options) {
//           cookieStore.set({ name, value: '', ...options })
//         },
//       },
//     }
//   )
// }
