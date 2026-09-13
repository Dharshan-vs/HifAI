import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import Breadcrumb from '../../../components/common/Breadcrumb';
import PageHeader from '../../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import ChangePasswordForm from '../components/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Settings', path: '/settings' }, { label: 'Change Password' }]} />
      <PageHeader title="Change Password" subtitle="Update your Firebase account security password" />

      <div className="max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border shadow-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <CardTitle>Update Security Password</CardTitle>
              </div>
              <CardDescription>
                Re-authenticate and create a new strong password for your REOS account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
