import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'farmer_id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' }, { key: 'alt_contacts', label: 'Alternate numbers' }, { key: 'has_login', label: 'Has login' },
];
const fields = [
    { name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone (10 to 15 digits)' }, { name: 'address', label: 'Address' },
    { name: 'alt_contacts', label: 'Alternate numbers (comma separated)' },
];
const staff = ['MandiAdmin', 'MandiStaff'];

export default function FarmersPage() {
    return <ResourcePage title='Farmers' endpoint='/api/farmers' idKey='farmer_id' columns={columns} fields={fields}
        writeRoles={staff} deleteRoles={staff}
        hint='Register farmers who do not use the app. A farmer with recorded sales cannot be deleted. Deleting a farmer also removes their login and graph node.' />;
}