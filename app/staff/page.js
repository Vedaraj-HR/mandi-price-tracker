import ResourcePage from '@/components/ResourcePage';
const admins = ['MandiAdmin', 'WarehouseAdmin'];
const columns = [{ key: 'id', label: 'ID' }, { key: 'username', label: 'Username' }, { key: 'role', label: 'Role' }];
const fields = [{ name: 'username', label: 'Username' }, { name: 'password', label: 'Password (8 or more characters)', type: 'password' }];
export default function StaffPage() {
  return <ResourcePage title='My staff' endpoint='/api/staff' idKey='id' columns={columns} fields={fields}
    writeRoles={admins} deleteRoles={admins} allowEdit={false}
    hint='You create and remove staff of your own organisation only. Passwords are stored as bcrypt hashes.' />;
}
