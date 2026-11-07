
import { handler, ANY } from '@/lib/guard';
import { graphAllRoutes } from '@/lib/graph';

export const GET = handler(ANY, async () => Response.json(await graphAllRoutes()));

