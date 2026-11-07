// app/mandis/page.js
import ResourcePage from '@/components/ResourcePage';

const columns = [{ key: 'mandi_id', label: 'ID' }, { key: 'name', label: 'Mandi' }, { key: 'location', label: 'Location' }, { key: 'managed_by', label: 'Manager (user id)' }];
const fields = [
  { name: 'name', label: 'Name' },
  { name: 'location', label: 'Location' },
  { name: 'managed_by', label: 'Managed by', type: 'select', optionsUrl: '/api/users', optValue: 'user_id', optLabel: 'username' },
];

export default function MandisPage() {
  return <ResourcePage title='Mandis' endpoint='/api/mandis' idKey='mandi_id' columns={columns} fields={fields} hint='Only Admin can change mandis. Every mandi needs a managing user (enforced by a trigger).' />;
}
