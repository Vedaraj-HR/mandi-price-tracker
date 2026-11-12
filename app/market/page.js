import ResourcePage from '@/components/ResourcePage';

const columns = [
    { key: 'price_date', label: 'Date' }, { key: 'mandi', label: 'Mandi' }, {
        key: 'crop', label: 'Crop' },
    { key: 'min_price', label: 'Min' }, { key: 'modal_price', label: 'Modal' },
    { key: 'max_price', label: 'Max' }, { key: 'source', label: 'Source' },
];

export default function MarketPage() {
    return <ResourcePage title='Market prices (Rs per quintal)'
        endpoint='/api/market-prices' idKey='id' columns={columns} fields={[]}
        writeRoles={[]} deleteRoles={[]}
        hint='Search by mandi or crop. Source: agmarknet = government data, manual = typed by a mandi, sample = simulated earlier days.' />;
}