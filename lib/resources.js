// lib/resources.js
export const cropCfg = {
  table: 'crop', pk: 'crop_id', search: ['crop_name', 'category'],
  schema: {
    crop_name: { type: 'string', required: true, max: 100 },
    category: { type: 'enum', required: true, values: ['Perishable', 'Non-Perishable'] },
  },
};

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
