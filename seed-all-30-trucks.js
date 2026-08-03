// Script to seed Supabase database with trucks (includes one Eicher 2059 XP @ 72,154 km)
// Updated with exact truck information from buy truck section
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All 30 trucks with exact information from buy truck section
const trucks = [
  {
    name: 'Eicher Pro 2110 LCV',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2110 LCV',
    year: 2023,
    kilometers: 105453,
    horsepower: 110,
    price: 750000,
    image_url: '/trucks/eicher-truck-1.webp',
    subtitle: 'Compact and efficient for city deliveries.',
    certified: false,
    location: 'Mumbai (MH-01)',
    city: 'Mumbai',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Motors 1059 XP',
    manufacturer: 'Eicher Motors',
    model: '1059 XP',
    year: 2018,
    kilometers: 275034,
    horsepower: 100,
    price: 650000,
    image_url: '/trucks/truck3-image-2.png',
    subtitle: 'Reliable and fuel-efficient.',
    certified: false,
    location: 'Pune (MH-12)',
    city: 'Pune',
    state: 'Maharashtra'
  },
  {
    name: 'Tata 1512 LPT',
    manufacturer: 'Tata Motors',
    model: '1512 LPT',
    year: 2021,
    kilometers: 67915,
    horsepower: 150,
    price: 550000,
    image_url: '/trucks/truck4-image-1.png',
    subtitle: 'Versatile medium duty truck.',
    certified: false,
    location: 'Mumbai (MH-02)',
    city: 'Mumbai',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 3015',
    manufacturer: 'Eicher Motors',
    model: 'Pro 3015',
    year: 2021,
    kilometers: 108084,
    horsepower: 150,
    price: 680000,
    image_url: '/trucks/truck5-image-2.png',
    subtitle: 'Modern design with excellent fuel economy.',
    certified: false,
    location: 'Nagpur (MH-31)',
    city: 'Nagpur',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 3019',
    manufacturer: 'Eicher Motors',
    model: 'Pro 3019',
    year: 2021,
    kilometers: 75200,
    horsepower: 190,
    price: 780000,
    image_url: '/trucks/truck6-image-2.jpg',
    subtitle: 'Powerful and efficient.',
    certified: false,
    location: 'Nashik (MH-15)',
    city: 'Nashik',
    state: 'Maharashtra'
  },
  {
    name: 'Tata Motors 3518',
    manufacturer: 'Tata Motors',
    model: '3518',
    year: 2019,
    kilometers: 82085,
    horsepower: 180,
    price: 800000,
    image_url: '/trucks/truck7-image-2.png',
    subtitle: 'Heavy-duty truck for long hauls.',
    certified: false,
    location: 'Thane (MH-04)',
    city: 'Thane',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 2110 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2110 XP',
    year: 2024,
    kilometers: 111339,
    horsepower: 110,
    price: 720000,
    image_url: '/trucks/truck8-image-1.png',
    subtitle: 'Extended power variant for heavy loads.',
    certified: false,
    location: 'Aurangabad (MH-20)',
    city: 'Aurangabad',
    state: 'Maharashtra'
  },
  {
    name: 'Tata Motors Ultra T16',
    manufacturer: 'Tata Motors',
    model: 'Ultra T16',
    year: 2022,
    kilometers: 110312,
    horsepower: 160,
    price: 690000,
    image_url: '/trucks/truck9-image-1.png',
    subtitle: 'Ultra-efficient commercial vehicle.',
    certified: false,
    location: 'Solapur (MH-13)',
    city: 'Solapur',
    state: 'Maharashtra'
  },
  {
    name: 'Tata LPT 1109 HEX 2',
    manufacturer: 'Tata Motors',
    model: 'LPT 1109 HEX 2',
    year: 2014,
    kilometers: 116432,
    horsepower: 109,
    price: 640000,
    image_url: '/trucks/truck10-image-1.jpg',
    subtitle: 'Efficient and reliable.',
    certified: false,
    location: 'Kolhapur (MH-09)',
    city: 'Kolhapur',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 2110 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2110 XP',
    year: 2019,
    kilometers: 230825,
    horsepower: 110,
    price: 660000,
    image_url: '/trucks/truck11-image-1.png',
    subtitle: 'Extended power for demanding applications.',
    certified: false,
    location: 'Sangli (MH-10)',
    city: 'Sangli',
    state: 'Maharashtra'
  },
  {
    name: 'Tata LPT 3118',
    manufacturer: 'Tata Motors',
    model: 'LPT 3118',
    year: 2015,
    kilometers: 232643,
    horsepower: 118,
    price: 740000,
    image_url: '/trucks/truck12-image-1.png',
    subtitle: 'Powerful medium-duty truck.',
    certified: false,
    location: 'Satara (MH-11)',
    city: 'Satara',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 2118',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2118',
    year: 2024,
    kilometers: 63529,
    horsepower: 118,
    price: 790000,
    image_url: '/trucks/truck19-image-1.png',
    subtitle: 'Powerful and reliable.',
    certified: false,
    location: 'Jalgaon (MH-19)',
    city: 'Jalgaon',
    state: 'Maharashtra'
  },
  {
    name: 'Ashok Leyland Partner 1114',
    manufacturer: 'Ashok Leyland',
    model: 'Partner 1114',
    year: 2023,
    kilometers: 56021,
    horsepower: 114,
    price: 670000,
    image_url: '/trucks/truck14-image-1.png',
    subtitle: 'Reliable partner for your business.',
    certified: false,
    location: 'Akola (MH-30)',
    city: 'Akola',
    state: 'Maharashtra'
  },
  {
    name: 'Ashok Leyland Partner 1615',
    manufacturer: 'Ashok Leyland',
    model: 'Partner 1615',
    year: 2022,
    kilometers: 125064,
    horsepower: 115,
    price: 710000,
    image_url: '/trucks/truck15-image-1.png',
    subtitle: 'Powerful and durable.',
    certified: false,
    location: 'Amravati (MH-27)',
    city: 'Amravati',
    state: 'Maharashtra'
  },
  {
    name: 'Eicher Pro 2114 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2114 XP',
    year: 2022,
    kilometers: 120421,
    horsepower: 114,
    price: 730000,
    image_url: '/trucks/truck16-image-1.png',
    subtitle: 'Extended power for heavy loads.',
    certified: false,
    location: 'Latur (MH-24)',
    city: 'Latur',
    state: 'Maharashtra'
  },
  {
    name: 'Ashok Leyland Ecomet 1214',
    manufacturer: 'Ashok Leyland',
    model: 'Ecomet 1214',
    year: 2019,
    kilometers: 350318,
    horsepower: 114,
    price: 700000,
    image_url: '/trucks/truck17-image-1.png',
    subtitle: 'Eco-friendly and efficient.',
    certified: false,
    location: 'Delhi (DL-01)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Eicher Pro 2118',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2118',
    year: 2024,
    kilometers: 45764,
    horsepower: 118,
    price: 560000,
    image_url: '/trucks/truck19-image-1.png',
    subtitle: 'Powerful and reliable.',
    certified: false,
    location: 'Delhi (DL-03)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Tata 1613 CRI6',
    manufacturer: 'Tata Motors',
    model: '1613 CRI6',
    year: 2020,
    kilometers: 96023,
    horsepower: 113,
    price: 580000,
    image_url: '/trucks/truck20-image-1.png',
    subtitle: 'Advanced technology and efficiency.',
    certified: false,
    location: 'Delhi (DL-04)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Tata 610',
    manufacturer: 'Tata Motors',
    model: '610',
    year: 2021,
    kilometers: 51327,
    horsepower: 100,
    price: 680000,
    image_url: '/trucks/truck22-image-1.png',
    subtitle: 'Versatile commercial vehicle.',
    certified: false,
    location: 'Delhi (DL-06)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Ashok Leyland Ecomet 1212',
    manufacturer: 'Ashok Leyland',
    model: 'Ecomet 1212',
    year: 2018,
    kilometers: 196243,
    horsepower: 112,
    price: 650000,
    image_url: '/trucks/truck17-image-1.png',
    subtitle: 'Eco-friendly and efficient.',
    certified: false,
    location: 'Delhi (DL-07)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Eicher Pro 3015 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 3015 XP',
    year: 2023,
    kilometers: 85017,
    horsepower: 150,
    price: 770000,
    image_url: '/trucks/truck5-image-2.png',
    subtitle: 'Extended power with modern features.',
    certified: false,
    location: 'Delhi (DL-08)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'SML Isuzu Samrat GS',
    manufacturer: 'SML Isuzu',
    model: 'Samrat GS',
    year: 2020,
    kilometers: 16024,
    horsepower: 92,
    price: 620000,
    image_url: '/trucks/truck25-image-1.png',
    subtitle: 'Japanese quality and reliability.',
    certified: false,
    location: 'Delhi (DL-09)',
    city: 'Delhi',
    state: 'Delhi'
  },
  {
    name: 'Eicher Pro 2059 XP',
    manufacturer: 'Eicher Motors',
    model: 'Pro 2059 XP',
    year: 2022,
    kilometers: 72154,
    horsepower: 59,
    price: 630000,
    image_url: '/trucks/truck21-image-1.png',
    subtitle: 'Extended power variant.',
    certified: false,
    location: 'Pune (MH-12)',
    city: 'Pune',
    state: 'Maharashtra'
  },
  {
    name: 'Tata 709 LPT',
    manufacturer: 'Tata Motors',
    model: '709 LPT',
    year: 2021,
    kilometers: 87421,
    horsepower: 70,
    price: 610000,
    image_url: '/trucks/truck28-image-1.png',
    subtitle: 'Light commercial vehicle.',
    certified: false,
    location: 'Chandigarh (CH-01)',
    city: 'Chandigarh',
    state: 'Chandigarh'
  },
  {
    name: 'Tata 709 G LPT',
    manufacturer: 'Tata Motors',
    model: '709 G LPT',
    year: 2022,
    kilometers: 83921,
    horsepower: 70,
    price: 670000,
    image_url: '/trucks/truck29-image-1.png',
    subtitle: 'Upgraded light commercial vehicle.',
    certified: false,
    location: 'Chandigarh (CH-01)',
    city: 'Chandigarh',
    state: 'Chandigarh'
  },
  {
    name: 'Tata 1109 G LPT',
    manufacturer: 'Tata Motors',
    model: '1109 G LPT',
    year: 2020,
    kilometers: 87631,
    horsepower: 109,
    price: 680000,
    image_url: '/trucks/truck30-image-1.png',
    subtitle: 'Reliable medium-duty truck.',
    certified: false,
    location: 'Chandigarh (CH-01)',
    city: 'Chandigarh',
    state: 'Chandigarh'
  },
  {
    name: 'Tata 1512 LPT',
    manufacturer: 'Tata Motors',
    model: '1512 LPT',
    year: 2022,
    kilometers: 73542,
    horsepower: 150,
    price: 750000,
    image_url: '/trucks/truck31-image-1.png',
    subtitle: 'Versatile medium duty truck.',
    certified: false,
    location: 'Chandigarh (CH-01)',
    city: 'Chandigarh',
    state: 'Chandigarh'
  }
];

async function seedDatabase() {
  console.log('🌱 Starting to seed Supabase database...');
  console.log(`📊 Found ${trucks.length} trucks to insert\n`);
  console.log('📍 Arranged by location: Maharashtra → Delhi → Chandigarh\n');

  // Clear existing trucks
  console.log('🗑️  Clearing existing trucks...');
  const { error: deleteError } = await supabase
    .from('trucks')
    .delete()
    .neq('id', 0);

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
      console.log(`✅ Inserted: ${truck.name} (${truck.state})`);
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
    console.log('\n🎉 All trucks seeded successfully!');
    console.log('📍 Order: Maharashtra → Delhi → Chandigarh');
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
