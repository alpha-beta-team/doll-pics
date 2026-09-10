import { Image as ImageIcon } from 'lucide-react';
import { useFeatureAccess } from '../access/useFeatureAccess';
import { PhotosWorkspacePage } from '../pages/PhotosWorkspacePage';
import { serviceCategorySlug } from '../services/serviceNavLinks';
import { AdminAlert, AdminEmptyState } from './ui';

export function ServicePhotosPanel({ serviceLabel, isNew }: { serviceLabel: string; isNew: boolean }) {
  const { canView } = useFeatureAccess('photos');
  if (!canView) return <AdminAlert tone="warning">Your account does not have access to Photos.</AdminAlert>;
  if (isNew || !serviceCategorySlug(serviceLabel)) return (
    <AdminEmptyState icon={ImageIcon} title="Save this service first" description="Once the service is saved, its uploaded photos will appear here." />
  );
  return <PhotosWorkspacePage key={serviceLabel} serviceLabel={serviceLabel} />;
}
