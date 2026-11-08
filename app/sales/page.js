
import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'id', label: 'ID' }, { key: 'sale_date', label: 'Date' }, { key: 'farmer', label: 'Farmer' }, { key: 'mandi', label: 'Mandi' },
    { key: 'crop', label: 'Crop' }, { key: 'quantity', label: 'Quintals' }, { key: 'price', label: 'Rs/quintal' }, { key: 'total', label: 'Total (Rs)' },
];

const fields = [
    { name: 'farmer_id', label: 'Farmer', type: 'select', optionsUrl: '/api/farmers', optValue: 'farmer_id', optLabel: 'name' },
    { name: 'mandi_id', label: 'Mandi', type: 'select', optionsUrl: '/api/mandis', optValue: 'mandi_id', optLabel: 'name' },
    { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
    { name: 'quantity', label: 'Quantity (quintals)', type: 'number' },
    { name: 'price', label: 'Price (Rs per quintal)', type: 'number' },
    { name: 'sale_date', label: 'Date (blank = today)', type: 'date' },
];

export default function SalesPage() {
    return (
        <ResourcePage title='Sales' endpoint='/api/sales' idKey='id' columns={columns} fields={fields}
            writeRoles={['Admin', 'Staff']} deleteRoles={['Admin']} allowEdit={false}
            hint='Search by farmer, mandi or crop. Staff can record sales; only Admin can delete them.' />
    );
}
