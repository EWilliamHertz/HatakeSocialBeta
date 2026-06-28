const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadBulkJson() {
  console.log('Fetching MTG Bulk Data URI...');
  
  try {
    const bulkRes = await fetch('https://api.scryfall.com/bulk-data/default-cards', {
      headers: { 'User-Agent': 'HatakeSocial/1.0' }
    });
    const bulkMeta = await bulkRes.json();
    const downloadUrl = bulkMeta.download_uri;
    
    console.log(`Starting massive download from: ${downloadUrl}`);
    const destPath = path.join(__dirname, '..', 'mtg-bulk-data.json');
    const file = fs.createWriteStream(destPath);
    
    https.get(downloadUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Download completed! 300MB+ JSON saved to: ${destPath}`);
      });
    }).on('error', (err) => {
      fs.unlink(destPath);
      console.error('Error downloading file:', err.message);
    });
    
  } catch (e) {
    console.error('Failed to get bulk data URI', e);
  }
}

downloadBulkJson();
