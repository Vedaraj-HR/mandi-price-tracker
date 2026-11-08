
import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'price_date', label: 'Date' }, { key: 'mandi', label: 'Mandi' }, { key: 'crop', label: 'Crop' },
    { key: 'min_price', label: 'Min' }, { key: 'modal_price', label: 'Modal' }, { key: 'max_price', label: 'Max' },
];

const fields = [
    { name: 'mandi_id', label: 'Mandi', type: 'select', optionsUrl: '/api/mandis', optValue: 'mandi_id', optLabel: 'name' },
    { name: 'crop_id', label: 'Crop', type: 'select', optionsUrl: '/api/crops', optValue: 'crop_id', optLabel: 'crop_name' },
    { name: 'price_date', label: 'Date', type: 'date' },
    { name: 'min_price', label: 'Min price', type: 'number' },
    { name: 'modal_price', label: 'Modal price', type: 'number' },
    { name: 'max_price', label: 'Max price', type: 'number' },
];

export default function PricesPage() {
    return (
        <ResourcePage title='Daily prices (Rs per quintal)'
            endpoint='/api/prices' idKey='id' columns={columns} fields={fields}
            writeRoles={['Admin', 'Staff']} deleteRoles={['Admin']} upsert
            hint='Saving a record for an existing mandi, crop and date updates it. Edit pre-fills the form; save to apply.' />
    );
}
