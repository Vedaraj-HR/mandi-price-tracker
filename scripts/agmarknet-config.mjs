
// scripts/agmarknet-config.mjs
// Market names and commodity names must match the Agmarknet feed exactly.

export const STATE = 'Karnataka';

export const MARKETS = [
  { market: 'Binny Mill (FF&V) Bengaluru APMC', district: 'Bengaluru' },
  { market: 'Kalaburagi APMC', district: 'Kalaburagi' },
  { market: 'Shimoga APMC', district: 'Shivamogga' },
  { market: 'Ramanagara APMC', district: 'Bengaluru South' },
  { market: 'Bangarpet APMC', district: 'Kolar' },
  { market: 'Gauribidanur APMC', district: 'Chikkaballapur' },
  { market: 'Chamarajanagar APMC', district: 'Chamarajanagar' },
  { market: 'Belgaum APMC', district: 'Belagavi' },
  { market: 'Ballari APMC', district: 'Bellary' },
  { market: 'Kumta APMC', district: 'Uttara Kannada' },
];

export const CROPS = [
  { commodity: 'Tomato', category: 'Perishable' },
  { commodity: 'Onion', category: 'Perishable' },
  { commodity: 'Brinjal', category: 'Perishable' },
  { commodity: 'Green Chilli', category: 'Perishable' },
  { commodity: 'Maize', category: 'Non-Perishable' },
  { commodity: 'Arecanut(Betelnut/Supari)', category: 'Non-Perishable' },
  { commodity: 'Jowar(Sorghum)', category: 'Non-Perishable' },
  { commodity: 'Bengal Gram(Gram)(Whole)', category: 'Non-Perishable' },
];
