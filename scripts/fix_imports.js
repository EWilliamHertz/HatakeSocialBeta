const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src/app/collection/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let imports = '';
  if (content.includes('<CardModal')) {
    imports += "import CardModal from './CardModal';\n";
  }
  if (content.includes('<EditCollectionCardModal')) {
    imports += "import EditCollectionCardModal from './EditCollectionCardModal';\n";
  }
  if (content.includes('<EditSealedProductModal')) {
    imports += "import EditSealedProductModal from './EditSealedProductModal';\n";
  }
  if (content.includes('<SealedActionModal')) {
    imports += "import SealedActionModal from './SealedActionModal';\n";
  }
  
  if (imports) {
    content = content.replace("export default function", imports + "\nexport default function");
    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed internal component imports.');
