// Script to verify Supabase Storage bucket configuration
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
const envLocalPath = path.resolve(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyStorage() {
  console.log('🔍 Verifying Supabase Storage configuration...\n')
  console.log(`📦 Supabase URL: ${supabaseUrl}\n`)

  try {
    // Test accessing a known image
    const testImagePath = 'ASHOK_LEYLAND_ECOMET_STAR_1615_HE/1771051536079-Copy%20of%20IMG_20260212_155025.jpg'
    
    console.log('📸 Testing image access...')
    const { data, error } = await supabase.storage
      .from('truck-images')
      .list('ASHOK_LEYLAND_ECOMET_STAR_1615_HE', {
        limit: 1
      })

    if (error) {
      console.error('❌ Error accessing storage:', error.message)
      console.error('\n💡 This might mean:')
      console.error('   1. The bucket is not public')
      console.error('   2. The bucket name is incorrect')
      console.error('   3. Storage policies are not configured correctly\n')
      return false
    }

    console.log('✅ Storage bucket is accessible!\n')

    // Test public URL
    const { data: urlData } = supabase.storage
      .from('truck-images')
      .getPublicUrl(testImagePath)

    console.log('🔗 Test Image URL:')
    console.log(`   ${urlData.publicUrl}\n`)
    console.log('💡 To verify:')
    console.log('   1. Copy the URL above')
    console.log('   2. Open it in a browser (or use curl)')
    console.log('   3. If it loads, the bucket is public ✅')
    console.log('   4. If you get 403 Forbidden, the bucket needs to be made public ❌\n')

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

verifyStorage()
  .then((success) => {
    if (success) {
      console.log('✅ Storage verification complete!')
    } else {
      console.log('\n⚠️  Storage configuration needs attention.')
      console.log('   See docs/DEPLOYMENT_IMAGE_FIX.md for instructions.\n')
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
