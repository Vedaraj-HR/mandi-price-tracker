import ResourcePage from '@/components/ResourcePage';
const staff = ['WarehouseAdmin', 'WarehouseStaff'];
const columns = [
  { key: 'batch_no', label: 'Batch' }, { key: 'farmer', label: 'Farmer' }, { key: 'crop', label: 'Crop' },
  { key: 'quantity', label: 'Quintals' }, { key: 'date_in', label: 'Stored on' },
];
const fields = [
  { name: 'farmer_id', label: 'Farmer (owner of produce)', type: 'select', optionsUrl: '/api/warehouse-farmers', optValue: 'farmer_id', optLabel: 'name' },
  { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
  { name: 'quantity', label: 'Quantity (quintals)', type: 'number' },
  { name: 'date_in', label: 'Storage date (blank = today)', type: 'date' },
];
export default function BatchesPage() {
  return <ResourcePage title='Storage batches in my warehouse' endpoint='/api/batches' idKey='batch_no'
    columns={columns} fields={fields} writeRoles={staff} deleteRoles={staff}
    hint='The storage date and crop decide how fast produce spoils. Capacity is enforced by the database.' />;
}
