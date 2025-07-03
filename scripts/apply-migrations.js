import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nℹ️  You can find these in your Supabase dashboard under Settings > API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🚀 Starting manual migration application...\n')

  try {
    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    console.log(`📁 Found ${migrationFiles.length} migration files:`)
    migrationFiles.forEach(file => console.log(`   - ${file}`))
    console.log('')

    // Apply each migration
    for (const file of migrationFiles) {
      console.log(`⏳ Applying migration: ${file}`)
      
      const filePath = path.join(migrationsDir, file)
      const sqlContent = fs.readFileSync(filePath, 'utf8')
      
      try {
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
        
        if (error) {
          console.error(`❌ Error in ${file}:`, error.message)
        } else {
          console.log(`✅ Successfully applied: ${file}`)
        }
      } catch (err) {
        console.error(`❌ Failed to apply ${file}:`, err.message)
      }
    }

    console.log('\n🎉 Migration application complete!')
    
  } catch (error) {
    console.error('❌ Error during migration:', error.message)
  }
}

applyMigrations()