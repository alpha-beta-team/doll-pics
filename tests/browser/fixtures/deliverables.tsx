import '../../../src/admin/components/deliverables-editor.css';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { DeliverablesPage } from '../../../src/admin/pages/DeliverablesPage';
import { BookingDeliverablesPanel } from '../../../src/admin/components/BookingDeliverablesPanel';
import { CustomerBookingPresentation } from '../../../src/components/CustomerBookingPresentation';
import { api } from '../../../src/admin/api/client';
import { mapBooking } from '../../../src/admin/api/mappers';
import type { DeliverableConfiguration, DeliverableType } from '../../../src/shared/deliverables';
import '../../../src/index.css';
let configuration: DeliverableConfiguration = { revision: 0, base: [], seasonal: [] };
api.getDeliverableConfiguration = async () => structuredClone(configuration);
api.saveDeliverableConfiguration = async value => {
  configuration = structuredClone({ ...value, revision: value.revision + 1 });
  return structuredClone(configuration);
};
api.getDeliverables = async (): Promise<DeliverableType[]> => [...configuration.base, ...configuration.seasonal.flatMap(extension => extension.items)].map((item, order) => ({
  id: item.id, name: item.name, kind: item.kind, unit: item.unit, specifications: item.specifications,
  defaultQuantity: item.quantity, selectedByDefault: configuration.base.some(base => base.id === item.id), active: true, order,
}));
api.updateBooking = async (_id, body) => mapBooking({ _id: 'booking', updatedAt: '2030-01-01T00:00:00Z', agreedTotal: 5000, deliverables: body.deliverables?.map(row => {
  const type = [...configuration.base, ...configuration.seasonal.flatMap(extension => extension.items)].find(type => type.id === row.catalogId);
  return { ...row, name: type?.name || '', specifications: type?.specifications || '', unit: type?.unit || 'pieces' };
}) });
function Harness() {
  const [booking, setBooking] = useState(mapBooking({ _id: 'booking', customerName: 'Priya', updatedAt: '2030-01-01T00:00:00Z', agreedTotal: 5000, deliverables: [] }));
  return <div className="admin-theme mx-auto max-w-4xl space-y-6 p-4"><DeliverablesPage /><BookingDeliverablesPanel booking={booking} canManage canPrice onSaved={setBooking} /><CustomerBookingPresentation booking={{ customerName: 'Priya', shootType: 'Portrait', packageName: '', bookingDate: '', startTime: '', endTime: '', location: '', status: 'confirmed', expectedDeliveryDate: '', update: '', delivery: {}, deliverables: (booking.deliverables || []).map(row => ({ name: row.name, quantity: row.quantity })) }} /></div>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
