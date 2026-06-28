import { cookies } from 'next/headers';

type Language = 'en' | 'sv';

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.market': 'Market',
    'nav.feed': 'Feed',
    'nav.cards': 'Cards',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'market.title': 'Global Marketplace',
    'market.subtitle': 'Buy, sell, and trade cards internationally. Secure escrow guaranteed.',
    'market.search': 'Search marketplace by card name...',
    'market.gameStats': 'Game Stats',
    'market.condition': 'Condition / Modifiers',
    'market.recent': 'Recent Listings',
    'market.placeholder': 'Market API Coming Soon',
    'chat.title': 'Messages',
    'chat.placeholder': 'Type a message...',
    'chat.send': 'Send',
    'chat.offline': 'Offline',
    'chat.online': 'Online',
    'profile.inventory': 'CARDS OWNED',
    'profile.value': 'ESTIMATED VALUE',
    'profile.listings': 'ACTIVE LISTINGS',
    'profile.arena': 'AVG ARENA RATING'
  },
  sv: {
    'nav.home': 'Hem',
    'nav.market': 'Marknad',
    'nav.feed': 'Flöde',
    'nav.cards': 'Kort',
    'nav.profile': 'Profil',
    'nav.settings': 'Inställningar',
    'market.title': 'Global Marknadsplats',
    'market.subtitle': 'Köp, sälj och byt kort internationellt. Säker deposition garanteras.',
    'market.search': 'Sök på marknadsplatsen efter kortnamn...',
    'market.gameStats': 'Spelstatistik',
    'market.condition': 'Skick / Modifierare',
    'market.recent': 'Senaste Annonser',
    'market.placeholder': 'Marknads-API Kommer Snart',
    'chat.title': 'Meddelanden',
    'chat.placeholder': 'Skriv ett meddelande...',
    'chat.send': 'Skicka',
    'chat.offline': 'Urloggad',
    'chat.online': 'Inloggad',
    'profile.inventory': 'ÄGDA KORT',
    'profile.value': 'UPPSKATTAT VÄRDE',
    'profile.listings': 'AKTIVA ANNONSER',
    'profile.arena': 'SNITT ARENA-RATING'
  }
};

export function getTranslation() {
  const cookieStore = cookies();
  const lang = (cookieStore.get('hatake_lang')?.value as Language) || 'en';
  
  return (key: string) => {
    return dictionary[lang]?.[key] || dictionary['en'][key] || key;
  };
}
