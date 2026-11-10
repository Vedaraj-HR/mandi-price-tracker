import { MANDI_ADMIN } from './guard';

export const cropCfg = {
  table: 'crop', pk: 'crop_id', search: ['crop_name', 'category'],
  writeRoles: MANDI_ADMIN, deleteRoles: MANDI_ADMIN,
  schema: {
    crop_name: { type: 'string', required: true, max: 100 },
    category: { type: 'enum', required: true, values: ['Perishable', 'Non-Perishable'] },
  },
};

// Kept temporarily so the legacy routes remain buildable until U6/U7 replaces them.
export const mandiCfg = {
  table: 'mandi', pk: 'mandi_id', search: ['name', 'location'],
  schema: {
    name: { type: 'string', required: true, max: 100 },
    location: { type: 'string', required: true, max: 150 },
    managed_by: { type: 'int', required: true },
  },
};

export const warehouseCfg = {
  table: 'warehouse', pk: 'warehouse_id', search: ['location'],
  schema: {
    location: { type: 'string', required: true, max: 150 },
    capacity: { type: 'number', required: true, gt: 0 },
  },
};
