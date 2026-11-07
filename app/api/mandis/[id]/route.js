// app/api/mandis/[id]/route.js
import { item } from '@/lib/crud';
import { mandiCfg } from '@/lib/resources';

const c = item(mandiCfg);
export const PUT = c.PUT;
export const DELETE = c.DELETE;
