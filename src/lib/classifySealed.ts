export const classifySealedProduct = (name: string): string => {
  const n = name.toLowerCase();

  // Ordered from most specific to least specific to avoid misclassification
  if (n.includes('elite trainer box') || n.includes('etb')) return 'ELITE_TRAINER_BOX';
  if (n.includes('premium collection')) return 'PREMIUM_COLLECTION';
  if (n.includes('collection box')) return 'COLLECTION_BOX';
  if (n.includes('booster bundle')) return 'BOOSTER_BUNDLE';
  if (n.includes('booster box') || n.includes('display box') || n.includes('booster display') || n.includes('display')) return 'BOOSTER_BOX';
  if (n.includes('booster pack') || n.includes('sleeved booster')) return 'BOOSTER_PACK';
  if (n.includes('theme deck')) return 'THEME_DECK';
  if (n.includes('starter deck') || n.includes('commander deck')) return 'STARTER_DECK';
  if (n.includes('display case') || n.includes('master carton') || n.includes('case')) return 'DISPLAY_CASE';
  if (n.includes('blister')) return 'BLISTER';
  if (n.includes('tin')) return 'TIN';
  if (n.includes('bundle') || n.includes('fat pack') || n.includes('build & battle')) return 'BUNDLE';

  // Fallback for fan-made or unrecognized items
  return 'OTHER';
};