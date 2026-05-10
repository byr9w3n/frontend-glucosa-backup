// src/supabase.js
import { createClient } from '@supabase/supabase-js'

// Reemplaza esto con tus credenciales reales del proyecto Med2Gestion
const supabaseUrl = 'https://rouvazfcxqusosvxtiiq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvdXZhemZjeHF1c29zdnh0aWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDYxNTksImV4cCI6MjA5MzkyMjE1OX0.F4IcpAzstQeCCRBu49i3qnLmpmIg9EAhTyo6KzQ50rs'

export const supabase = createClient(supabaseUrl, supabaseKey)