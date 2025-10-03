// Seed data for testing
// Run this file with: npx ts-node seed.ts
// Make sure to set your Supabase credentials in .env first

import { supabase, Product } from './src/lib/supabase';

const sampleProducts: Omit<Product, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'wireless-headphones-pro',
    title: {
      en: 'Wireless Headphones Pro',
      es: 'Auriculares Inalámbricos Pro',
    },
    description: {
      en: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
      es: 'Auriculares inalámbricos premium con cancelación activa de ruido y 30 horas de batería.',
    },
    price: 29999,
    currency: 'USD',
    stock: 150,
    category: 'Electronics',
    tags: ['audio', 'wireless', 'premium'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    ],
  },
  {
    slug: 'smart-watch-fitness',
    title: {
      en: 'Smart Watch Fitness Tracker',
      es: 'Reloj Inteligente Monitor de Actividad',
    },
    description: {
      en: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring and GPS.',
      es: 'Rastrea tus objetivos de fitness con este reloj inteligente avanzado con monitor de frecuencia cardíaca y GPS.',
    },
    price: 19999,
    currency: 'USD',
    stock: 200,
    category: 'Wearables',
    tags: ['fitness', 'smartwatch', 'health'],
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    ],
  },
  {
    slug: 'laptop-backpack-leather',
    title: {
      en: 'Premium Leather Laptop Backpack',
      es: 'Mochila de Cuero Premium para Portátil',
    },
    description: {
      en: 'Handcrafted leather backpack with padded laptop compartment and multiple pockets.',
      es: 'Mochila de cuero hecha a mano con compartimento acolchado para portátil y múltiples bolsillos.',
    },
    price: 14999,
    currency: 'USD',
    stock: 75,
    category: 'Accessories',
    tags: ['bags', 'leather', 'laptop'],
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    ],
  },
  {
    slug: 'mechanical-keyboard-rgb',
    title: {
      en: 'RGB Mechanical Gaming Keyboard',
      es: 'Teclado Mecánico Gaming RGB',
    },
    description: {
      en: 'Professional mechanical keyboard with customizable RGB lighting and programmable keys.',
      es: 'Teclado mecánico profesional con iluminación RGB personalizable y teclas programables.',
    },
    price: 12999,
    currency: 'USD',
    stock: 120,
    category: 'Gaming',
    tags: ['gaming', 'keyboard', 'rgb'],
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
    ],
  },
  {
    slug: 'coffee-maker-espresso',
    title: {
      en: 'Professional Espresso Coffee Maker',
      es: 'Cafetera Espresso Profesional',
    },
    description: {
      en: 'Barista-quality espresso machine with milk frother and programmable settings.',
      es: 'Máquina de espresso de calidad barista con espumador de leche y configuraciones programables.',
    },
    price: 39999,
    currency: 'USD',
    stock: 50,
    category: 'Home & Kitchen',
    tags: ['coffee', 'kitchen', 'appliances'],
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
    ],
  },
];

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    // Insert products
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (error) throw error;

    console.log(`✅ Successfully inserted ${data.length} products`);
    console.log('Sample products:', data);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase();
