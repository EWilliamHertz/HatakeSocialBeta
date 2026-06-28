import { PrismaClient, GameType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// WARNING: Run this with `npx tsx seed_one_piece.ts`
const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, 'one_piece_cards.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log("Please create a 'one_piece_cards.csv' file in this directory with the following headers:");
    console.log("apiId,name,imageUrl,setCode,price");
    console.log("Example line:");
    console.log("OP01-001,Roronoa Zoro,https://images.example.com/op01-001.png,OP01,45.50");
    return;
  }

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').slice(1); // skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const [apiId, name, imageUrl, setCode, price] = line.split(',');
    
    await prisma.cardReference.upsert({
      where: { apiId_game: { apiId: apiId.trim(), game: GameType.ONE_PIECE } },
      update: {
        price: parseFloat(price) || 0
      },
      create: {
        apiId: apiId.trim(),
        game: GameType.ONE_PIECE,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        setCode: setCode.trim(),
        price: parseFloat(price) || 0,
        apiPayload: {}
      }
    });
    console.log(`Seeded One Piece card: ${name}`);
  }
}

main().finally(() => prisma.$disconnect());
