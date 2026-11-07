// app/api/crops/route.js
import { collection } from '@/lib/crud';
import { cropCfg } from '@/lib/resources';


const c = collection(cropCfg);
export const GET = c.GET;
export const POST = c.POST;
