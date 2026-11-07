// app/crops/page.js
import ResourcePage from '@/components/ResourcePage';


const columns = [{ key: 'crop_id', label: 'ID' }, { key: 'crop_name', label: 'Crop' }, { key: 'category', label: 'Category' }];
const fields = [
  { name: 'crop_name', label: 'Crop name' },
  { name: 'category', label: 'Category (Perishable or Non-Perishable)' },
];

export default function CropsPage() {
  return <ResourcePage title='Crops' endpoint='/api/crops' idKey='crop_id' columns={columns} fields={fields} hint='Only Admin can add, change or delete crops.' />;
}
