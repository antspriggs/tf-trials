import type { Event } from './types';

export const DEFAULT_EVENTS: Omit<Event, 'id'>[] = [
  { name: '100m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 1 },
  { name: '200m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 2 },
  { name: '400m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 3 },
  { name: '800m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 4 },
  { name: '1600m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 5 },
  { name: '3200m', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 6 },
  { name: 'Hurdles', type: 'time', unit: 'seconds', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 7 },
  { name: 'Long Jump', type: 'distance', unit: 'feet', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 8 },
  { name: 'High Jump', type: 'height', unit: 'feet', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 9 },
  { name: 'Shot Put', type: 'distance', unit: 'feet', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 10 },
  { name: 'Discus', type: 'distance', unit: 'feet', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 11 },
  { name: 'Pole Vault', type: 'height', unit: 'feet', auto_qualify: null, prov_qualify: null, auto_qualify_m: null, prov_qualify_m: null, auto_qualify_f: null, prov_qualify_f: null, sort_order: 12 },
];
