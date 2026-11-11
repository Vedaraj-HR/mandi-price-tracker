import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'price_date', label: 'Date' }, { key: 'crop', label: 'Crop' }, { key: 'min_price', label: 'Min' },
    { key: 'modal_price', label: 'Modal' }, { key: 'max_price', label: 'Max' }, { key: 'source', label: 'Source' },
];
const fields = [
    { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
    { name: 'price_date', label: 'Date (blank = today)', type: 'date' },
    { name: 'min_price', label: 'Min price', type: 'number' },
    { name: 'modal_price', label: 'Modal price', type: 'number' },
    { name: 'max_price', label: 'Max price', type: 'number' },
];

export default function PricesPage() {
    return <ResourcePage title='Daily prices at my mandi (Rs per quintal)' endpoint='/api/prices' idKey='id' columns={columns} fields={fields}
        writeRoles={['MandiAdmin', 'MandiStaff']} deleteRoles={[]} upsert
        hint='Source: agmarknet = government data, manual = typed here, sample = simulated history. Saving a crop and date that exist updates them (marked manual).' />;
}