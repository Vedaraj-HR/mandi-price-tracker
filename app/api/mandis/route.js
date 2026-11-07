// app/api/mandis/route.js
import { collection } from '@/lib/crud';
import { mandiCfg } from '@/lib/resources';


const c = collection(mandiCfg);
export const GET = c.GET;
export const POST = c.POST;
