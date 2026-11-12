import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'sale_date', label: 'Date' },
    { key: 'mandi', label: 'Mandi' },
    { key: 'crop', label: 'Crop' },
    { key: 'quantity', label: 'Quintals' },
    { key: 'price', label: 'Rs/quintal' },
    { key: 'total', label: 'Total (Rs)' },
];

export default function MySalesPage() {
    return <ResourcePage title='My sales' endpoint='/api/farmer/sales'
        idKey='id' columns={columns} fields={[]}
        writeRoles={[]} deleteRoles={[]}
        hint='Sales recorded for you by mandi staff. You see only your own sales.' />;
}