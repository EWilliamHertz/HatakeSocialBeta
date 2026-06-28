import { snapshotPrices } from '../src/lib/snapshot';

(async () => {
  console.log('Running initial price + collection-value snapshot...');
  const r = await snapshotPrices('initial-seed');
  console.log('Done:', r);
  process.exit(0);
})();
