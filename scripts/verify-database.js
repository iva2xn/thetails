import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need this for admin operations

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in environment variables')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  console.log('ℹ️  You need to add your Supabase service role key to run admin operations')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyDatabaseState() {
  console.log('🔍 Checking database state...\n')

  try {
    // Check if pgvector extension is enabled
    const { data: extensions, error: extError } = await supabase
      .rpc('sql', { 
        query: "SELECT extname FROM pg_extension WHERE extname = 'vector';" 
      })

    if (extError) {
      console.log('❌ Could not check extensions:', extError.message)
    } else {
      if (extensions && extensions.length > 0) {
        console.log('✅ pgvector extension is enabled')
      } else {
        console.log('❌ pgvector extension is NOT enabled')
      }
    }

    // Check if embeddings table exists
    const { data: tables, error: tableError } = await supabase
      .rpc('sql', { 
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embeddings';" 
      })

    if (tableError) {
      console.log('❌ Could not check tables:', tableError.message)
    } else {
      if (tables && tables.length > 0) {
        console.log('✅ embeddings table exists')
      } else {
        console.log('❌ embeddings table does NOT exist')
      }
    }

    // List all tables
    const { data: allTables, error: allTablesError } = await supabase
      .rpc('sql', { 
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
      })

    if (!allTablesError && allTables) {
      console.log('\n📋 Current tables in database:')
      allTables.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    }

    // Check migration history (if migrations table exists)
    const { data: migrations, error: migError } = await supabase
      .rpc('sql', { 
        query: "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;" 
      })

    if (!migError && migrations) {
      console.log('\n📜 Recent migrations applied:')
      migrations.forEach(mig => {
        console.log(`   - ${mig.version}`)
      })
    } else {
      console.log('\n❌ Could not check migration history - migrations may not be applied yet')
    }

  } catch (error) {
    console.error('❌ Error checking database state:', error.message)
  }
}

verifyDatabaseState()