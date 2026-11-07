// app/api/warehouses/[id]/route.js
import { item } from '@/lib/crud';
import { warehouseCfg } from '@/lib/resources';

const c = item(warehouseCfg);
export const PUT = c.PUT;
export const DELETE = c.DELETE;
