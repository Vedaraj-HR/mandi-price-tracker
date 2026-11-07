// app/users/page.js
import ResourcePage from '@/components/ResourcePage';


const columns = [{ key: 'user_id', label: 'ID' }, { key: 'username', label: 'Username' }, { key: 'role', label: 'Role' }];
const fields = [
  { name: 'username', label: 'Username', lockOnEdit: true },
  { name: 'role', label: 'Role (Admin or Staff)' },
  { name: 'password', label: 'Password (8+ chars; leave blank when editing to keep it)', type: 'password' },
];

export default function UsersPage() {
  return <ResourcePage title='Users' endpoint='/api/users' idKey='user_id' columns={columns} fields={fields} hint='Admin only. Passwords are stored as bcrypt hashes. A user who still manages a mandi cannot be deleted.' />;
}
