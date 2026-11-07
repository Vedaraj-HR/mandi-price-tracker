// lib/farmers.js
import { validate } from './validate';
import { HttpError } from './errors';


const PHONE = /^[0-9+]{10,15}$/;

export function parseFarmer(body) {
  const data = validate(body, {
    name: { type: 'string', required: true, max: 100 },
    phone: { type: 'string', required: true, pattern: PHONE, message: 'Phone must be 10 to 15 digits (optional +)' },
    address: { type: 'string', max: 255 },
  });
  const contacts = [...new Set(String(body.alt_contacts ?? '').split(',').map((x) => x.trim()).filter(Boolean))];
  for (const c of contacts) if (!PHONE.test(c)) throw new HttpError(400, `Invalid alternate number: ${c}`);
  return { data, contacts };
}
