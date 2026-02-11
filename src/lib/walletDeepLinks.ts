/**
 * Mobile Wallet Deep Links
 *
 * Utility per aprire direttamente le app wallet mobile tramite deep links
 * invece di mostrare il QR code. Migliora l'UX su mobile.
 */

export interface WalletDeepLink {
  id: string;
  name: string;
  deepLink: (uri: string) => string;
  // URL del logo del wallet
  logo?: string;
  // Funzione per rilevare se il wallet è probabilmente installato
  // (non sempre accurato, ma migliora l'UX)
  isLikelyInstalled?: () => boolean;
}

/**
 * Lista dei wallet mobile supportati con i loro deep links
 */
export const MOBILE_WALLETS: WalletDeepLink[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/512px-MetaMask_Fox.svg.png',
    deepLink: (uri: string) => {
      // MetaMask mobile deep link format
      return `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'binance',
    name: 'Binance',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    deepLink: (uri: string) => {
      // Binance wallet deep link format (per BSC)
      return `https://app.binance.com/wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'rabby',
    name: 'Rabby',
    logo: 'https://raw.githubusercontent.com/RabbyHub/Rabby/develop/src/ui/assets/dashboard/rabby.svg',
    deepLink: (uri: string) => {
      // Rabby mobile deep link format
      return `https://rabby.io/wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    logo: 'https://avatars.githubusercontent.com/u/32179889?s=200&v=4',
    deepLink: (uri: string) => {
      // Trust Wallet deep link format
      return `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'phantom',
    name: 'Phantom',
    logo: 'https://avatars.githubusercontent.com/u/78782331?s=200&v=4',
    deepLink: (uri: string) => {
      // Phantom wallet deep link format (supports multi-chain including EVM)
      return `https://phantom.app/ul/v1/browse/${encodeURIComponent(`wc:${uri}`)}?cluster=mainnet-beta`;
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    logo: 'https://avatars.githubusercontent.com/u/48327834?s=200&v=4',
    deepLink: (uri: string) => {
      // Rainbow wallet deep link format
      return `https://rnbwapp.com/wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'tokenpocket',
    name: 'TokenPocket',
    logo: '/icons/wallets/token_pocket.svg',
    deepLink: (uri: string) => {
      // TokenPocket deep link format
      return `tpoutside://wc?uri=${encodeURIComponent(uri)}`;
    },
  },
  {
    id: 'safepal',
    name: 'SafePal',
    logo: '/icons/wallets/safepal.svg',
    deepLink: (uri: string) => {
      // SafePal deep link format
      return `safepalwallet://wc?uri=${encodeURIComponent(uri)}`;
    },
  },
];

/**
 * Rileva se il dispositivo è mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Rileva il sistema operativo mobile
 */
export function getMobileOS(): 'ios' | 'android' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (/android/.test(userAgent)) {
    return 'android';
  }

  return 'unknown';
}

/**
 * Apre un wallet tramite deep link
 *
 * @param walletId - ID del wallet da aprire (es: 'metamask', 'trust')
 * @param wcUri - WalletConnect URI da passare al wallet
 * @returns true se il deep link è stato aperto, false altrimenti
 */
export function openWalletDeepLink(walletId: string, wcUri: string): boolean {
  console.log(`🔍 openWalletDeepLink chiamato con walletId: "${walletId}"`);
  console.log(`🔍 WC URI ricevuto:`, wcUri);

  const wallet = MOBILE_WALLETS.find(w => w.id === walletId);

  if (!wallet) {
    console.error(`❌ Wallet ${walletId} non trovato nella lista dei wallet supportati`);
    console.log(`📋 Wallet disponibili:`, MOBILE_WALLETS.map(w => w.id));
    return false;
  }

  console.log(`✅ Wallet trovato: ${wallet.name}`);

  try {
    const deepLinkUrl = wallet.deepLink(wcUri);
    console.log(`🔗 Deep link generato per ${wallet.name}:`, deepLinkUrl);
    console.log(`📏 Lunghezza deep link: ${deepLinkUrl.length} caratteri`);

    // Apri il deep link in una nuova finestra/tab
    console.log(`🚀 Chiamando window.open con deep link...`);
    const openedWindow = window.open(deepLinkUrl, '_blank');
    console.log(`📱 window.open returned:`, openedWindow ? 'Window object' : 'null');

    if (!openedWindow) {
      console.warn(`⚠️ window.open ha restituito null - possibile popup blocker`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Errore nell'apertura del deep link per ${wallet.name}:`, error);
    return false;
  }
}

/**
 * Mostra una lista di wallet mobile popolari per l'utente
 * Utile per dare all'utente una scelta se non sappiamo quale wallet ha installato
 */
export function getPopularMobileWallets(): WalletDeepLink[] {
  // Ordine di popolarità (puoi personalizzare)
  const popularOrder = ['metamask', 'binance', 'rabby', 'trust', 'phantom', 'rainbow', 'tokenpocket', 'safepal'];

  return popularOrder
    .map(id => MOBILE_WALLETS.find(w => w.id === id))
    .filter((w): w is WalletDeepLink => w !== undefined);
}

/**
 * Genera un universal link per WalletConnect che funziona con tutti i wallet
 * Questo è un fallback se non riusciamo a rilevare quale wallet specifico usare
 */
export function getUniversalWalletConnectLink(wcUri: string): string {
  return `wc:${wcUri}`;
}

/**
 * Determina il wallet preferito dell'utente basandosi su vari fattori
 * (user agent, localStorage, cookies, etc.)
 */
export function getPreferredMobileWallet(): WalletDeepLink | null {
  if (typeof window === 'undefined') return null;

  // 1. Controlla se l'utente ha una preferenza salvata
  const savedPreference = localStorage.getItem('preferredMobileWallet');
  if (savedPreference) {
    const wallet = MOBILE_WALLETS.find(w => w.id === savedPreference);
    if (wallet) {
      console.log(`📱 Wallet preferito trovato in localStorage: ${wallet.name}`);
      return wallet;
    }
  }

  // 2. Rilevamento basato su user agent (alcuni wallet modificano lo user agent)
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('metamask')) {
    return MOBILE_WALLETS.find(w => w.id === 'metamask') || null;
  }

  if (userAgent.includes('rabby')) {
    return MOBILE_WALLETS.find(w => w.id === 'rabby') || null;
  }

  if (userAgent.includes('phantom')) {
    return MOBILE_WALLETS.find(w => w.id === 'phantom') || null;
  }

  if (userAgent.includes('trustwallet') || userAgent.includes('trust')) {
    return MOBILE_WALLETS.find(w => w.id === 'trust') || null;
  }

  if (userAgent.includes('tokenpocket')) {
    return MOBILE_WALLETS.find(w => w.id === 'tokenpocket') || null;
  }

  // 3. Default: null (mostra lista di scelta o QR code)
  return null;
}

/**
 * Salva il wallet preferito dell'utente per future connessioni
 */
export function savePreferredMobileWallet(walletId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('preferredMobileWallet', walletId);
    console.log(`💾 Wallet preferito salvato: ${walletId}`);
  } catch (error) {
    console.warn('⚠️ Impossibile salvare il wallet preferito:', error);
  }
}

/**
 * Helper per formattare il WalletConnect URI se necessario
 */
export function formatWalletConnectUri(uri: string): string {
  // Rimuovi eventuali prefissi "wc:" se già presenti
  return uri.replace(/^wc:/, '');
}
