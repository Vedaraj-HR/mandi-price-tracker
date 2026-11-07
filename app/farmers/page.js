// app/farmers/page.js
import ResourcePage from '@/components/ResourcePage';


const columns = [
  { key: 'farmer_id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' }, { key: 'alt_contacts', label: 'Alternate numbers' },
];
const fields = [
  { name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone (10 to 15 digits)' }, { name: 'address', label: 'Address' },
  { name: 'alt_contacts', label: 'Alternate numbers (comma separated)' },
];


export default function FarmersPage() {
  return <ResourcePage title='Farmers' endpoint='/api/farmers' idKey='farmer_id' columns={columns} fields={fields}
    writeRoles={['Admin', 'Staff']} deleteRoles={['Admin', 'Staff']}
    hint='Search by name or phone. A farmer with recorded sales cannot be deleted (foreign key RESTRICT).' />;
}
