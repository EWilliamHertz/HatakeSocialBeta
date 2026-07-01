'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'sv';

type Dictionary = {
  [key in Language]: {
    [key: string]: string;
  }
};

const dictionary: Dictionary = {
  en: {
    'nav.home': 'Home',
    'nav.market': 'Market',
    'nav.feed': 'Feed',
    'nav.cards': 'Cards',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.messages': 'Messages',
    'nav.guilds': 'Guilds',
    'market.title': 'Global Marketplace',
    'market.subtitle': 'Buy, sell, and trade cards internationally. Secure escrow guaranteed.',
    'market.search': 'Search marketplace by card name...',
    'market.gameStats': 'Game Stats',
    'market.condition': 'Condition / Modifiers',
    'market.recent': 'Recent Listings',
    'market.auction': 'Auction',
    'market.buyNow': 'Buy Now',
    'market.package': 'Package',
    'market.bid': 'Bid',
    'market.buy': 'Buy',
    'market.currentBid': 'Current Bid',
    'market.bidHistory': 'Bid History',
    'market.noBids': 'No bids placed yet. Be the first!',
    'market.seller': 'Seller',
    'market.ends': 'Ends',
    'market.placeBid': 'Place Bid',
    'market.placingBid': 'Placing bid...',
    'market.placeholder': 'Market API Coming Soon',
    'chat.title': 'Messages',
    'chat.placeholder': 'Type a message...',
    'chat.send': 'Send',
    'chat.offline': 'Offline',
    'chat.online': 'Online',
    'profile.inventory': 'CARDS OWNED',
    'profile.value': 'ESTIMATED VALUE',
    'profile.listings': 'ACTIVE LISTINGS',
    'profile.arena': 'AVG ARENA RATING',
    'settings.title': 'Settings',
    'settings.shipping.title': 'Shipping Information',
    'settings.shipping.name': 'Full Name',
    'settings.shipping.address1': 'Address Line 1',
    'settings.shipping.address2': 'Address Line 2 (Optional)',
    'settings.shipping.city': 'City',
    'settings.shipping.state': 'State / Province',
    'settings.shipping.zip': 'Postal Code',
    'settings.shipping.country': 'Country',
    'settings.payment.title': 'Payment Information',
    'settings.payment.desc': 'These details will be securely shared with buyers when they purchase your items on the marketplace.',
    'settings.payment.paypal': 'PayPal Email',
    'settings.payment.iban': 'Bank IBAN (For Direct Transfers)',
    'settings.save': 'Save Settings',
    'collection.title': 'Card Database',
    'collection.subtitle': 'Manage, track, and monetize your TCG collection.',
    'collection.addBulk': 'Add Bulk',
    'collection.listForSale': 'List for Sale',
    'collection.tab.yours': 'Your Collection',
    'collection.tab.all': 'All Cards',
    'collection.tab.sealed': 'Sealed Product',
    'feed.title': 'Hatake Network',
    'feed.subtitle': 'Share pulls, decklists, and connect with other collectors.',
    'feed.tab.social': 'Social Feed',
    'feed.tab.collectors': 'Collectors Market',
    'feed.post.placeholder': 'Share your latest pulls, tournament reports, or trades...',
    'feed.activeCollectors': 'Active Collectors',
    'feed.trendingSignatures': 'Trending Signatures',
    'feed.searchMarket': 'Search by Illustrator or Card Name...',
    'sales.title': 'Sales',
    'sales.subtitle': 'Manage your active listings, packages, and auctions on the marketplace.',
    'sales.active': 'Active Listings',
    'sales.selected': 'Selected',
    'sales.noListings': 'No Active Listings',
    'sales.noListingsDesc': 'You have no cards for sale right now. Go to your collection to start selling.',
    'sales.editSelected': 'Edit Selected',
    'sales.deleteAll': 'Delete All',
    'sales.selectAll': 'Select All',
    'sales.auction': 'Auction',
    'sales.buyNow': 'Buy Now',
    'sales.package': 'Package',
    'sales.ends': 'Ends',
    'sales.currentBid': 'Current Bid',
    'sales.startingBid': 'Starting Bid',
    'sales.price': 'Price',
    'sales.editModal.title': 'Edit Listing(s)',
    'sales.editModal.desc': 'Updating selected listings.',
    'sales.editModal.type': 'Listing Type',
    'sales.editModal.fixed': 'Fixed Price',
    'sales.editModal.auction': 'Auction',
    'sales.editModal.duration': 'Auction Duration (Days)',
    'sales.editModal.save': 'Save Changes',
    'landing.badge': 'TCG Social Platform',
    'landing.login': 'Log in',
    'landing.join': 'Join now',
    'landing.hero.title1': 'The Ultimate',
    'landing.hero.title2': 'TCG Social Network',
    'landing.hero.subtitle': 'A next generation platform for collectors and players.',
    'landing.hero.subtitleBold': 'Supporting deck building and organization of 100,000+ unique cards across 6 different card games.',
    'landing.features.title': 'Platform Features',
    'landing.features.subtitle': 'Everything you need to master your favorite trading card games.',
    'landing.feature1.title': 'Deck Building & Collection',
    'landing.feature1.desc': 'Organize and track your collection from a unified database of 100,000+ unique cards. Build and share your most powerful decks for Magic: The Gathering, Pokémon, One Piece, Naruto, Lorcana, and Riftbound.',
    'landing.feature2.title': 'Live Pricing API',
    'landing.feature2.desc': 'We offer a lightning-fast, developer-friendly API providing real-time market prices, historical data and set information for every single card across our 6 supported games.',
    'landing.feature3.title': 'Game Clients in Development',
    'landing.feature3.desc': 'We are not just a database. We are actively building live, interactive digital game clients for all 6 games. Soon you will be able to challenge players around the world directly in your browser with built-in matchmaking.',
    'landing.feature4.title': 'Original Hatake TCG Brand',
    'landing.feature4.desc': 'Beyond supporting the classics, we are immensely proud to present our very own exclusive TCG brand. Designed by masters of the genre, featuring breathtaking artwork and deeply strategic mechanics.',
    'landing.games.title': 'Supported Card Games',
    'landing.games.subtitle': 'The foundation of our platform.',
    'landing.games.clientWip': 'Client in dev',
    'landing.games.database': 'DATABASE',
    'landing.footer.tagline': 'Built with passion for the global trading card game community.'
  },
  sv: {
    'nav.home': 'Hem',
    'nav.market': 'Marknad',
    'nav.feed': 'Flöde',
    'nav.cards': 'Kort',
    'nav.profile': 'Profil',
    'nav.settings': 'Inställningar',
    'nav.messages': 'Meddelanden',
    'nav.groups': 'Grupper',
    'nav.guilds': 'Grupper',
    'market.title': 'Global Marknadsplats',
    'market.subtitle': 'Köp, sälj och byt kort internationellt. Säker deposition garanteras.',
    'market.search': 'Sök på marknadsplatsen efter kortnamn...',
    'market.gameStats': 'Spelstatistik',
    'market.condition': 'Skick / Modifierare',
    'market.recent': 'Senaste Annonser',
    'market.auction': 'Auktion',
    'market.buyNow': 'Köp Nu',
    'market.package': 'Paket',
    'market.bid': 'Bud',
    'market.buy': 'Köp',
    'market.currentBid': 'Nuvarande Bud',
    'market.bidHistory': 'Budhistorik',
    'market.noBids': 'Inga bud har lagts. Bli den första!',
    'market.seller': 'Säljare',
    'market.ends': 'Avslutas',
    'market.placeBid': 'Lägg Bud',
    'market.placingBid': 'Lägger bud...',
    'market.placeholder': 'Marknads-API Kommer Snart',
    'chat.title': 'Meddelanden',
    'chat.placeholder': 'Skriv ett meddelande...',
    'chat.send': 'Skicka',
    'chat.offline': 'Urloggad',
    'chat.online': 'Inloggad',
    'profile.inventory': 'ÄGDA KORT',
    'profile.value': 'UPPSKATTAT VÄRDE',
    'profile.listings': 'AKTIVA ANNONSER',
    'profile.arena': 'SNITT ARENA-RATING',
    'settings.title': 'Inställningar',
    'settings.shipping.title': 'Fraktinformation',
    'settings.shipping.name': 'Fullständigt Namn',
    'settings.shipping.address1': 'Adressrad 1',
    'settings.shipping.address2': 'Adressrad 2 (Valfritt)',
    'settings.shipping.city': 'Stad',
    'settings.shipping.state': 'Län / Provins',
    'settings.shipping.zip': 'Postnummer',
    'settings.shipping.country': 'Land',
    'settings.payment.title': 'Betalningsinformation',
    'settings.payment.desc': 'Dessa uppgifter delas säkert med köpare när de köper dina föremål på marknadsplatsen.',
    'settings.payment.paypal': 'PayPal E-post',
    'settings.payment.iban': 'Bank IBAN (För Direktöverföringar)',
    'settings.save': 'Spara Inställningar',
    'collection.title': 'Kortdatabas',
    'collection.subtitle': 'Hantera, spåra och tjäna pengar på din TCG-samling.',
    'collection.addBulk': 'Lägg till flera',
    'collection.listForSale': 'Sälj',
    'collection.tab.yours': 'Din Samling',
    'collection.tab.all': 'Alla Kort',
    'collection.tab.sealed': 'Oöppnade Produkter',
    'feed.title': 'Hatake Network',
    'feed.subtitle': 'Dela med dig av kort, lekar och interagera med andra samlare.',
    'feed.tab.social': 'Socialt Flöde',
    'feed.tab.collectors': 'Samlarmarknad',
    'feed.post.placeholder': 'Dela dina senaste kort, turneringsrapporter eller byten...',
    'feed.activeCollectors': 'Aktiva Samlare',
    'feed.trendingSignatures': 'Populära Signaturer',
    'feed.searchMarket': 'Sök på illustratör eller kortnamn...',
    'sales.title': 'Försäljning',
    'sales.subtitle': 'Hantera dina aktiva annonser, paket och auktioner på marknadsplatsen.',
    'sales.active': 'Aktiva Annonser',
    'sales.selected': 'Valda',
    'sales.noListings': 'Inga aktiva annonser',
    'sales.noListingsDesc': 'Du har inga kort till salu just nu. Gå till din samling för att börja sälja.',
    'sales.editSelected': 'Redigera Valda',
    'sales.deleteAll': 'Ta Bort Alla',
    'sales.selectAll': 'Välj Alla',
    'sales.auction': 'Auktion',
    'sales.buyNow': 'Köp Nu',
    'sales.package': 'Paket',
    'sales.ends': 'Avslutas',
    'sales.currentBid': 'Nuvarande Bud',
    'sales.startingBid': 'Startbud',
    'sales.price': 'Pris',
    'sales.editModal.title': 'Redigera Annons(er)',
    'sales.editModal.desc': 'Uppdaterar valda annonser.',
    'sales.editModal.type': 'Försäljningstyp',
    'sales.editModal.fixed': 'Fast Pris',
    'sales.editModal.auction': 'Auktion',
    'sales.editModal.duration': 'Auktionens längd (Dagar)',
    'sales.editModal.save': 'Spara Ändringar',
    'landing.badge': 'TCG Social Plattform',
    'landing.login': 'Logga in',
    'landing.join': 'Gå med nu',
    'landing.hero.title1': 'Det Ultimata',
    'landing.hero.title2': 'TCG Sociala Nätverket',
    'landing.hero.subtitle': 'En nästa generations plattform för samlare och spelare.',
    'landing.hero.subtitleBold': 'Stödjer lekbyggande och organisering av över 100 000 unika kort över 6 olika kortspel.',
    'landing.features.title': 'Plattformsfunktioner',
    'landing.features.subtitle': 'Allt du behöver för att bemästra dina favoritsamlarkortspel.',
    'landing.feature1.title': 'Lekbygge & Samling',
    'landing.feature1.desc': 'Organisera och spåra din samling från en enhetlig databas med över 100 000 unika kort. Bygg och dela dina mest kraftfulla lekar för Magic: The Gathering, Pokémon, One Piece, Naruto, Lorcana och Riftbound.',
    'landing.feature2.title': 'Live Pris-API',
    'landing.feature2.desc': 'Vi erbjuder ett blixtsnabbt, utvecklarvänligt API som tillhandahåller marknadspriser i realtid, historisk data och set-information för varje enskilt kort över våra 6 stödda spel.',
    'landing.feature3.title': 'Spelklienter under uppbyggnad',
    'landing.feature3.desc': 'Vi är inte bara en databas. Vi bygger aktivt live, interaktiva digitala spelklienter för alla 6 spelen. Snart kommer du att kunna utmana spelare världen över direkt i din webbläsare med inbyggd matchmaking.',
    'landing.feature4.title': 'Original Hatake TCG Varumärke',
    'landing.feature4.desc': 'Utöver att stödja klassikerna är vi oerhört stolta över att presentera vårt alldeles egna exklusiva TCG-varumärke. Designat av mästare inom genren, med hisnande konstverk och djupt strategiska mekaniker.',
    'landing.games.title': 'Stödda Kortspel',
    'landing.games.subtitle': 'Grunden för vår plattform.',
    'landing.games.clientWip': 'Klient under utv.',
    'landing.games.database': 'DATABAS',
    'landing.footer.tagline': 'Byggt med passion för den globala samlarkortspels-communityn.'
  }
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('sv');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hatake_lang') as Language;
    if (saved && (saved === 'en' || saved === 'sv')) {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('hatake_lang', newLang);
  };

  const t = (key: string) => {
    return dictionary[lang][key] || dictionary['en'][key] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
