import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project();
const sourceFile = project.addSourceFileAtPath("src/app/collection/page.tsx");

const componentsToExtract = [
  "AllCardsTab",
  "YourCollectionTab",
  "EditCollectionCardModal",
  "EditSealedProductModal",
  "SealedActionModal",
  "SealedTab",
  "CardModal"
];

const dir = path.join(process.cwd(), "src/app/collection/components");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const name of componentsToExtract) {
  const func = sourceFile.getFunction(name);
  if (func) {
    const body = func.getText();
    const compContent = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import PackOpener from '@/components/PackOpener';

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

export default ${body}
`;
    fs.writeFileSync(path.join(dir, `${name}.tsx`), compContent);
    // Add export to the original function to make it available for import?
    // Let's actually remove it from the file and replace it with an import.
    // Wait, replacing it with ts-morph might be tricky if we don't save. Let's just remove it and save.
    func.remove();
  }
}

// Add imports for extracted components
const imports = componentsToExtract.map(name => `import ${name} from './components/${name}';`).join('\n');
sourceFile.insertStatements(10, imports);

sourceFile.saveSync();
console.log("Extraction complete!");
