// Script to seed Supabase database with truck data
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Seed data for trucks
const trucks = [
  {
    name: 'Tata Prima',
    manufacturer: 'Tata Motors',
    model: 'Prima',
    year: 2023,
    kilometers: 15000,
    horsepower: 380,
    price: 800000,
    image_url: '/Gemini_Generated_Image_189xp8189xp8189x.png',
    subtitle: 'Premium heavy-duty truck with advanced features.',
    certified: true
  },
  {
    name: 'Tata Signa',
    manufacturer: 'Tata Motors',
    model: 'Signa',
    year: 2022,
    kilometers: 22000,
    horsepower: 350,
    price: 800000,
    image_url: '/Gemini_Generated_Image_6gr84a6gr84a6gr8.png',
    subtitle: 'Powerful and fuel-efficient tipper truck.',
    certified: true
  },
  {
    name: 'Ashok Leyland 2820',
    manufacturer: 'Ashok Leyland',
    model: '2820',
    year: 2021,
    kilometers: 35000,
    horsepower: 200,
    price: 780000,
    image_url: '/Gemini_Generated_Image_6q2b966q2b966q2b-2.png',
    subtitle: 'Reliable and durable for long hauls.',
    certified: false
  },
  {
    name: 'BharatBenz 1617R',
    manufacturer: 'BharatBenz',
    model: '1617R',
    year: 2023,
    kilometers: 18000,
    horsepower: 170,
    price: 790000,
    image_url: '/Gemini_Generated_Image_6q2b966q2b966q2b-3.png',
    subtitle: 'German engineering for Indian roads.',
    certified: true
  },
  {
    name: 'Mahindra Bolero Pik-Up',
    manufacturer: 'Mahindra',
    model: 'Bolero Pik-Up',
    year: 2022,
    kilometers: 12000,
    horsepower: 75,
    price: 640000,
    image_url: '/Gemini_Generated_Image_6q2b966q2b966q2b.png',
    subtitle: 'Perfect for last-mile delivery.',
    certified: true
  },
  {
    name: 'Mahindra Bolero Camper',
    manufacturer: 'Mahindra',
    model: 'Bolero Camper',
    year: 2021,
    kilometers: 18000,
    horsepower: 75,
    price: 650000,
    image_url: '/Gemini_Generated_Image_azvzznazvzznazvz.png',
    subtitle: 'Versatile pickup for commercial use.',
    certified: true
  },
  {
    name: 'Eicher Pro 3015',
    manufacturer: 'Eicher Motors',
    model: 'Pro 3015',
    year: 2023,
    kilometers: 10000,
    horsepower: 150,
    price: 740000,
    image_url: '/Gemini_Generated_Image_ex5b2aex5b2aex5b.png',
    subtitle: 'Modern design with excellent fuel economy.',
    certified: false
  },
  {
    name: 'Eicher Pro 2110',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2110',
    year: 2022,
    kilometers: 25000,
    horsepower: 110,
    price: 720000,
    image_url: '/Gemini_Generated_Image_f5675rf5675rf567.png',
    subtitle: 'Compact and efficient for city deliveries.',
    certified: true
  },
  {
    name: 'Ashok Leyland Dost',
    manufacturer: 'Ashok Leyland',
    model: 'Dost',
    year: 2022,
    kilometers: 20000,
    horsepower: 40,
    price: 750000,
    image_url: '/Gemini_Generated_Image_o2qgpno2qgpno2qg.png',
    subtitle: 'Light commercial vehicle for small businesses.',
    certified: true
  },
  {
    name: 'Suzuki Super Carry',
    manufacturer: 'Suzuki',
    model: 'Super Carry',
    year: 2023,
    kilometers: 8000,
    horsepower: 60,
    price: 650000,
    image_url: '/Gemini_Generated_Image_tywt8qtywt8qtywt.png',
    subtitle: 'Japanese quality pickup truck.',
    certified: true
  },
  {
    name: 'Tata LPT 1613',
    manufacturer: 'Tata Motors',
    model: 'LPT 1613',
    year: 2022,
    kilometers: 20000,
    horsepower: 130,
    price: 760000,
    image_url: '/Gemini_Generated_Image_wyesgowyesgowyes.png',
    subtitle: 'Versatile medium duty truck.',
    certified: true
  },
  {
    name: 'SML Isuzu S7',
    manufacturer: 'SML Isuzu',
    model: 'S7',
    year: 2021,
    kilometers: 12000,
    horsepower: 92,
    price: 800000,
    image_url: '/Gemini_Generated_Image_6q2b966q2b966q2b.png',
    subtitle: 'Heavy-duty tipper for mining.',
    certified: false
  }
];

async function seedDatabase() {
  console.log('🌱 Starting to seed Supabase database...');
  console.log(`📊 Found ${trucks.length} trucks to insert\n`);

  // Clear existing trucks (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing trucks...');
  const { error: deleteError } = await supabase
    .from('trucks')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.warn('⚠️  Warning: Could not clear existing trucks:', deleteError.message);
  } else {
    console.log('✅ Cleared existing trucks\n');
  }

  // Insert trucks
  console.log('📥 Inserting trucks into database...');
  let successCount = 0;
  let errorCount = 0;

  for (const truck of trucks) {
    const { data, error } = await supabase
      .from('trucks')
      .insert(truck)
      .select();

    if (error) {
      console.error(`❌ Error inserting ${truck.name}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Inserted: ${truck.name} (ID: ${data[0].id})`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Seeding Summary:');
  console.log(`✅ Successfully inserted: ${successCount} trucks`);
  if (errorCount > 0) {
    console.log(`❌ Failed to insert: ${errorCount} trucks`);
  }
  console.log('='.repeat(50));

  if (successCount === trucks.length) {
    console.log('\n🎉 Database seeded successfully!');
    console.log('👉 Your trucks should now appear in the browse section.');
  } else {
    console.log('\n⚠️  Some trucks failed to insert. Check the errors above.');
  }
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

