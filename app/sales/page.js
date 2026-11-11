import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'id', label: 'ID' }, { key: 'sale_date', label: 'Date' }, { key: 'farmer', label: 'Farmer' }, { key: 'crop', label: 'Crop' },
    { key: 'quantity', label: 'Quintals' }, { key: 'price', label: 'Rs/quintal' }, { key: 'total', label: 'Total (Rs)' },
];
const fields = [
    { name: 'farmer_id', label: 'Farmer', type: 'select', optionsUrl: '/api/farmers', optValue: 'farmer_id', optLabel: 'name' },
    { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
    { name: 'quantity', label: 'Quantity (quintals)', type: 'number' },
    { name: 'price', label: 'Price (Rs per quintal)', type: 'number' },
    { name: 'sale_date', label: 'Date (blank = today)', type: 'date' },
];

export default function SalesPage() {
    return <ResourcePage title='Sales at my mandi' endpoint='/api/sales' idKey='id' columns={columns} fields={fields}
        writeRoles={['MandiAdmin', 'MandiStaff']} deleteRoles={['MandiAdmin']} allowEdit={false}
        hint='You see and record only the sales of your own mandi. Only the Mandi Admin can delete a sale.' />;
}