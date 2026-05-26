export interface WalletCategory {
  name: string;
  models: string[];
}

export const WALLET_CATEGORIES: WalletCategory[] = [
  {
    name: 'Card Holder',
    models: ['Allman', 'Shadow CH5', 'Shadow CH6'],
  },
  {
    name: 'Novčanik',
    models: ['Shadow BF', 'Shadow BF10', 'LemmyV2', 'Salvador', 'Luka', 'Shadow CL', 'Shadow Coin', 'Frida'],
  },
  {
    name: 'Ostalo',
    models: ['Passport Case', 'Tobacco Case'],
  },
];
