// app/batches/page.js
import ResourcePage from '@/components/ResourcePage';

const columns = [
  { key: 'warehouse', label: 'Warehouse' }, { key: 'batch_no', label: 'Batch' }, { key: 'crop', label: 'Crop' },
  { key: 'quantity', label: 'Quintals' }, { key: 'date_in', label: 'Date in' },
];
const fields = [
  { name: 'warehouse_id', label: 'Warehouse', type: 'select', optionsUrl: '/api/warehouses', optValue: 'warehouse_id', optLabel: 'location', lockOnEdit: true },
  { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
  { name: 'quantity', label: 'Quantity (quintals)', type: 'number' },
  { name: 'date_in', label: 'Date in (blank = today)', type: 'date' },
];

export default function BatchesPage() {
  return <ResourcePage title='Storage batches' endpoint='/api/batches' idKey='id' columns={columns} fields={fields}
    writeRoles={['Admin', 'Staff']} deleteRoles={['Admin', 'Staff']}
    hint='A batch that would exceed the warehouse capacity is refused by a database trigger.' />;
}
