// app/api/crops/[id]/route.js
import { item } from '@/lib/crud';
import { cropCfg } from '@/lib/resources';

const c = item(cropCfg);
export const PUT = c.PUT;
export const DELETE = c.DELETE;
