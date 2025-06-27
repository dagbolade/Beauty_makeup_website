// Update your src/lib/supabase.ts file:

import { createClient } from '@supabase/supabase-js'

// Get these values from your Supabase project dashboard
const supabaseUrl = 'https://lclgrknxczkmlclrugmq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbGdya254Y3prbWxjbHJ1Z21xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDE0NjIwNCwiZXhwIjoyMDU1NzIyMjA0fQ.5K915OiOzVQF83kRAbL581aiyepqPttUB9De7s41MuI'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const getPublicImageUrl = (path: string) => {
  // Method 1: Use getPublicUrl
  const { data } = supabase.storage.from('yemisi-artistry').getPublicUrl(path)
  
  // Method 2: Manual URL construction (backup)
  const manualUrl = `https://lclgrknxczkmlclrugmq.supabase.co/storage/v1/object/public/yemisi-artistry/${path}`
  
  // Return the getPublicUrl result, fallback to manual if needed
  return data.publicUrl || manualUrl
}