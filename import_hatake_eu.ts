import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Fetching products from hatake.eu API...');
  const res = await fetch('https://hatake.eu/api/products');
  if (!res.ok) {
    throw new Error('Failed to fetch from hatake.eu');
  }
  
  const products = await res.json();
  console.log(`Found ${products.length} products. Importing into Shop...`);

  let count = 0;
  for (const product of products) {
    const euroPrice = product.price / 10; // Convert SEK to EUR (1 EUR = 10 SEK)
    console.log(`Importing to Shop: ${product.name} - €${euroPrice.toFixed(2)}`);

    // Create or update in Product table for the Shop
    await prisma.product.upsert({
      where: { id: product.id }, // Assuming product.id is unique
      update: {
        name: product.name,
        imageUrl: product.imageUrl,
        images: product.images?.length > 0 ? product.images : [product.imageUrl],
        price: euroPrice,
        stock: product.stock || 10
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description || `Imported from Hatake.eu`,
        imageUrl: product.imageUrl,
        images: product.images?.length > 0 ? product.images : [product.imageUrl],
        price: euroPrice,
        stock: product.stock || 10,
        isActive: true
      }
    });
    
    count++;
  }
  
  console.log(`Imported ${count} products from Hatake.eu into the Shop successfully!`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
