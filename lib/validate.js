// lib/validate.js
import { HttpError } from './errors';


export function validate(body, schema) {
  const out = {};
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    let v = body?.[key];

    if (v === undefined || v === null || String(v).trim() === '') {
      if (rule.required) errors.push(`${key} is required`);
      else out[key] = null;
      continue;
    }
    if (typeof v === 'string') v = v.trim();
    if (rule.type === 'int') {
      if (!/^-?[0-9]+$/.test(String(v))) { errors.push(`${key} must be a whole number`); continue; }
      v = Number(v);
    } else if (rule.type === 'number') {
      v = Number(v);
      if (!Number.isFinite(v)) { errors.push(`${key} must be a number`); continue; }
    } else if (rule.type === 'date') {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v) || Number.isNaN(Date.parse(v))) { errors.push(`${key} must be a date like 2026-10-31`); continue; }
    } else if (rule.type === 'enum') {
      if (!rule.values.includes(v)) { errors.push(`${key} must be one of: ${rule.values.join(', ')}`); continue; }
    } else {
      v = String(v);
      if (rule.max && v.length > rule.max) { errors.push(`${key} is too long (max ${rule.max})`); continue; }
      if (rule.pattern && !rule.pattern.test(v)) { errors.push(rule.message ?? `${key} has an invalid format`); continue; }
    }
    if (rule.min !== undefined && v < rule.min) { errors.push(`${key} must be at least ${rule.min}`); continue; }
    if (rule.gt !== undefined && !(v > rule.gt)) { errors.push(`${key} must be greater than ${rule.gt}`); continue; }
    out[key] = v;
  }
  if (errors.length) throw new HttpError(400, errors.join('; '));
  return out;
}


// Reads a whole-number query parameter such as ?mandi=3
export function intParam(searchParams, name, required = true) {
  const raw = searchParams.get(name);
  if (raw === null || raw === '') {
    if (required) throw new HttpError(400, `${name} is required`);
    return null;
  }
  if (!/^[0-9]+$/.test(raw)) throw new HttpError(400, `${name} must be a whole number`);
  return Number(raw);
}
