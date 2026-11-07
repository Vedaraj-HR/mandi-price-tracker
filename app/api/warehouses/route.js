// app/api/warehouses/route.js
import { collection } from '@/lib/crud';
import { warehouseCfg } from '@/lib/resources';


const c = collection(warehouseCfg);
export const GET = c.GET;
export const POST = c.POST;
