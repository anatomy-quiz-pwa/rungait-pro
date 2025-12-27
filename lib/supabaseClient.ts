/**
 * ❌ DEPRECATED - DO NOT USE
 * 
 * This file caused SSR to import browser-only code and broke Vercel builds
 * with "ReferenceError: location is not defined" errors.
 * 
 * Use instead:
 *   - lib/supabase-browser.ts (for Client Components only)
 *   - lib/supabase-server.ts (for Server Components and Route Handlers)
 * 
 * Migration guide:
 *   - Client Components: import { supabaseBrowser } from '@/lib/supabase-browser'
 *     Then call: const supabase = supabaseBrowser()
 *   - Server Components/API Routes: import { supabaseServer } from '@/lib/supabase-server'
 *     Then call: const supabase = await supabaseServer(request)
 */

throw new Error(
  'DEPRECATED: Do not import supabaseClient.ts. ' +
  'Use supabase-browser.ts (client) or supabase-server.ts (server) instead. ' +
  'See the file header for migration instructions.'
)
