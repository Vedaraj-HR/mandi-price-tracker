
import ResourcePage from '@/components/ResourcePage';
import CheapestRoute from '@/components/CheapestRoute';

const columns = [
    { key: 'source', label: 'From' }, { key: 'destination', label: 'To' },
    { key: 'distance', label: 'Distance (km)' }, { key: 'cost', label: 'Cost (Rs/quintal)' },
];

const fields = [
    { name: 'source_mandi_id', label: 'From mandi', type: 'select', optionsUrl: '/api/mandis', optValue: 'mandi_id', optLabel: 'name', lockOnEdit: true },
    { name: 'destination_mandi_id', label: 'To mandi', type: 'select', optionsUrl: '/api/mandis', optValue: 'mandi_id', optLabel: 'name', lockOnEdit: true },
    { name: 'distance', label: 'Distance (km)', type: 'number' },
    { name: 'cost', label: 'Cost (Rs per quintal)', type: 'number' },
    { name: 'bidirectional', label: 'Also add the reverse road', type: 'checkbox' },
];

export default function RoutesPage() {
    return (
        <>
            <ResourcePage title='Mandi routes (MySQL + Neo4j)'
                endpoint='/api/routes' idKey='id' columns={columns} fields={fields}
                writeRoles={['Admin']} deleteRoles={['Admin']}
                hint='Admin can add, change and delete roads. Every change is saved in MySQL and Neo4j in one transaction.' />
            <CheapestRoute />
        </>
    );
}
