import { request, normalizeId } from './http';
import type { DeliverableType, DeliverableConfiguration } from '../../shared/deliverables';
export const deliverablesApi = {
  getDeliverableConfiguration(): Promise<DeliverableConfiguration> {
    return request('/admin/deliverables/configuration', { auth: true });
  },
  saveDeliverableConfiguration(configuration: DeliverableConfiguration): Promise<DeliverableConfiguration> {
    return request('/admin/deliverables/configuration', { auth: true, method: 'PATCH', body: JSON.stringify(configuration) });
  },
  async getDeliverables(): Promise<DeliverableType[]> {
    const docs = await request<Record<string, unknown>[]>('/admin/deliverables', { auth: true });
    return docs.map(doc => normalizeId(doc) as unknown as DeliverableType);
  },
  async saveDeliverable(data: Omit<DeliverableType, 'id'>, id?: string): Promise<DeliverableType> {
    const doc = await request<Record<string, unknown>>(`/admin/deliverables${id ? `/${id}` : ''}`, { auth: true, method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) });
    return normalizeId(doc) as unknown as DeliverableType;
  },
};
