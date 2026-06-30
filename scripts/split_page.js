const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/app/collection/page.tsx');
const content = fs.readFileSync(file, 'utf8');

const regex = /function (AllCardsTab|YourCollectionTab|EditCollectionCardModal|EditSealedProductModal|SealedActionModal|SealedTab|CardModal)[\s\S]*?\n}(?=\n\/\/|\nfunction|\n$)/g;

let match;
const components = {};
let lastIndex = 0;

while ((match = regex.exec(content)) !== null) {
  components[match[1]] = match[0];
}

const dir = path.join(process.cwd(), 'src/app/collection/components');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [name, body] of Object.entries(components)) {
  const compContent = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import PackOpener from '@/components/PackOpener';

// Adjust imports/types as needed
type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';
type CardData = {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  price: number;
  foilPrice?: number;
  reverseHoloPrice?: number;
  apiId?: string;
  setCode?: string;
  collectorNumber?: string;
  prices?: any;
};

export default ${body}`;
  fs.writeFileSync(path.join(dir, `${name}.tsx`), compContent);
}

console.log('Extracted components:', Object.keys(components));
