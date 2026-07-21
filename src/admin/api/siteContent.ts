import type { SiteContent } from '../types';
import { request } from './http';
import { mapSiteContent } from './mappers';

async function getSiteContent(): Promise<SiteContent> {
  const doc = await request<Record<string, unknown>>('/admin/site-content', {
    auth: true,
  });
  return mapSiteContent(doc);
}

export const siteContentApi = {
  getSiteContent,

  async updateSiteContent(data: Partial<SiteContent>): Promise<SiteContent> {
    const current = await getSiteContent();
    const merged = { ...current, ...data };
    // Strip empty ids so Mongo can create new subdocs
    const payload = {
      ...merged,
      serviceNavLinks: (merged.serviceNavLinks ?? []).map(({ id, ...rest }) =>
        id ? { _id: id, ...rest } : rest,
      ),
    };
    await request('/admin/site-content', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
    return getSiteContent();
  },
};
