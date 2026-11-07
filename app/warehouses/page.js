// app/warehouses/page.js
import ResourcePage from '@/components/ResourcePage';

const columns = [{ key: 'warehouse_id', label: 'ID' }, { key: 'location', label: 'Location' }, { key: 'capacity', label: 'Capacity (quintals)' }];
const fields = [
  { name: 'location', label: 'Location' },
  { name: 'capacity', label: 'Capacity (quintals)', type: 'number' },
];

export default function WarehousesPage() {
  return <ResourcePage title='Warehouses' endpoint='/api/warehouses' idKey='warehouse_id' columns={columns} fields={fields} hint='Only Admin can change warehouses. Deleting a warehouse deletes its storage batches.' />;
}
