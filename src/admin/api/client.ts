import type {
  Photo, Category, Package, SiteContent, Enquiry, User, Booking, BookingStatus,
  HeroSlide, StoryScene, Stat, Testimonial, BehindScene, TeamMember,
} from '../types';
import { normalizeId, request } from './http';

const AUTH_USER_KEY = 'auth_user';

function storeUser(user: User) {
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function loadUser(): User | null {
  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function clearUser() {
  sessionStorage.removeItem(AUTH_USER_KEY);
}

/** Backend photo shape differs from frontend — map variants + categoryIds. */
function mapPhoto(doc: Record<string, unknown>): Photo {
  const base = normalizeId(doc);
  const variants = (doc.variants ?? {}) as {
    webp?: { url: string; width: number }[];
    avif?: { url: string; width: number }[];
  };
  const webpVariants = variants.webp ?? [];
  const avifVariants = variants.avif ?? [];
  const webpUrl = webpVariants[webpVariants.length - 1]?.url ?? '';
  const avifUrl = avifVariants[avifVariants.length - 1]?.url ?? '';
  const sizes = webpVariants.map(v => v.width);

  return {
    id: base.id,
    title: (doc.title as string) ?? '',
    altText: (doc.altText as string) ?? '',
    categories: ((doc.categoryIds as string[]) ?? []).map(String),
    variants: { webp: webpUrl, avif: avifUrl, sizes },
    width: (doc.width as number) ?? 0,
    height: (doc.height as number) ?? 0,
    order: (doc.order as number) ?? 0,
    isFeatured: (doc.isFeatured as boolean) ?? false,
    isPublished: (doc.isPublished as boolean) ?? false,
    location: (doc.location as string) ?? '',
    year: (doc.year as string) ?? '',
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
  };
}

function mapCategory(doc: Record<string, unknown>): Category {
  const base = normalizeId(doc);
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    slug: (doc.slug as string) ?? '',
    description: (doc.description as string) ?? '',
    seoTitle: (doc.seoTitle as string) ?? '',
    seoDescription: (doc.seoDescription as string) ?? '',
    coverPhotoId: doc.coverPhotoId ? String(doc.coverPhotoId) : null,
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  };
}

function mapPackage(doc: Record<string, unknown>): Package {
  const base = normalizeId(doc);
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    shootType: (doc.shootType as string) ?? '',
    description: (doc.description as string) ?? '',
    inclusions: (doc.inclusions as string[]) ?? [],
    pricingMode: (doc.pricingMode as Package['pricingMode']) ?? 'enquire',
    price: doc.price != null ? (doc.price as number) : undefined,
    icon: (doc.icon as string) ?? '',
    imageUrl: (doc.imageUrl as string) ?? '',
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  };
}

function mapEnquiry(doc: Record<string, unknown>): Enquiry {
  const base = normalizeId(doc);
  return {
    id: base.id,
    name: (doc.name as string) ?? '',
    email: (doc.email as string) ?? '',
    phone: (doc.phone as string) ?? '',
    shootType: (doc.shootType as string) ?? '',
    preferredEvent: (doc.preferredEvent as string) ?? '',
    shootDate: (doc.shootDate as string) ?? '',
    location: (doc.location as string) ?? '',
    reminderDate: (doc.reminderDate as string) ?? '',
    notes: (doc.notes as string) ?? '',
    message: (doc.message as string) ?? '',
    status: (doc.status as Enquiry['status']) ?? 'new',
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
  };
}

function mapBooking(doc: Record<string, unknown>): Booking {
  const base = normalizeId(doc);
  return {
    id: base.id,
    customerName: (doc.customerName as string) ?? '',
    customerPhone: (doc.customerPhone as string) ?? '',
    customerEmail: (doc.customerEmail as string) ?? '',
    shootType: (doc.shootType as string) ?? '',
    preferredEvent: (doc.preferredEvent as string) ?? '',
    shootDate: (doc.shootDate as string) ?? '',
    location: (doc.location as string) ?? '',
    reminderDate: (doc.reminderDate as string) ?? '',
    notes: (doc.notes as string) ?? '',
    driveGalleryUrl: (doc.driveGalleryUrl as string) ?? '',
    driveEditedUrl: (doc.driveEditedUrl as string) ?? '',
    driveRawsUrl: (doc.driveRawsUrl as string) ?? '',
    driveNotes: (doc.driveNotes as string) ?? '',
    status: (doc.status as BookingStatus) ?? 'draft',
    confirmedAt: doc.confirmedAt ? String(doc.confirmedAt) : undefined,
    enquiryId: doc.enquiryId ? String(doc.enquiryId) : undefined,
    createdAt: (doc.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
  };
}

function mapOrderedItem<T extends { id: string; order: number; isPublished: boolean }>(
  doc: Record<string, unknown>,
  fields: (base: { id: string; order: number; isPublished: boolean }) => T,
): T {
  const base = normalizeId(doc);
  return fields({
    id: base.id,
    order: (doc.order as number) ?? 0,
    isPublished: (doc.isPublished as boolean) ?? false,
  });
}

function mapHeroSlide(doc: Record<string, unknown>): HeroSlide {
  return mapOrderedItem(doc, base => ({
    ...base,
    image: (doc.image as string) ?? '',
    label: (doc.label as string) ?? '',
  }));
}

function mapStoryScene(doc: Record<string, unknown>): StoryScene {
  return mapOrderedItem(doc, base => ({
    ...base,
    text: (doc.text as string) ?? '',
    image: (doc.image as string) ?? '',
  }));
}

function mapStat(doc: Record<string, unknown>): Stat {
  return mapOrderedItem(doc, base => ({
    ...base,
    value: (doc.value as number) ?? 0,
    suffix: (doc.suffix as string) ?? '',
    label: (doc.label as string) ?? '',
  }));
}

function mapTestimonial(doc: Record<string, unknown>): Testimonial {
  return mapOrderedItem(doc, base => ({
    ...base,
    name: (doc.name as string) ?? '',
    role: (doc.role as string) ?? '',
    avatar: (doc.avatar as string) ?? '',
    rating: (doc.rating as number) ?? 5,
    text: (doc.text as string) ?? '',
    likes: (doc.likes as number) ?? 0,
    reply: (doc.reply as string) ?? '',
  }));
}

function mapBehindScene(doc: Record<string, unknown>): BehindScene {
  return mapOrderedItem(doc, base => ({
    ...base,
    title: (doc.title as string) ?? '',
    image: (doc.image as string) ?? '',
  }));
}

function mapTeamMember(doc: Record<string, unknown>): TeamMember {
  return mapOrderedItem(doc, base => ({
    ...base,
    name: (doc.name as string) ?? '',
    role: (doc.role as string) ?? '',
    bio: (doc.bio as string) ?? '',
    photo: (doc.photo as string) ?? '',
  }));
}

function orderedCrud<T>(
  resource: string,
  mapper: (doc: Record<string, unknown>) => T,
) {
  return {
    getAll: async (): Promise<T[]> => {
      const docs = await request<Record<string, unknown>[]>(`/admin/${resource}`, { auth: true });
      return docs.map(mapper).sort((a, b) => (a as { order: number }).order - (b as { order: number }).order);
    },
    create: async (data: Record<string, unknown>): Promise<T> => {
      const doc = await request<Record<string, unknown>>(`/admin/${resource}`, {
        method: 'POST', auth: true, body: JSON.stringify(data),
      });
      return mapper(doc);
    },
    update: async (id: string, data: Record<string, unknown>): Promise<T> => {
      const doc = await request<Record<string, unknown>>(`/admin/${resource}/${id}`, {
        method: 'PATCH', auth: true, body: JSON.stringify(data),
      });
      return mapper(doc);
    },
    delete: async (id: string): Promise<void> => {
      await request(`/admin/${resource}/${id}`, { method: 'DELETE', auth: true });
    },
    reorder: async (ids: string[]): Promise<void> => {
      await request(`/admin/${resource}/reorder`, {
        method: 'PATCH', auth: true, body: JSON.stringify({ ids }),
      });
    },
  };
}

const heroSlidesApi = orderedCrud('hero-slides', mapHeroSlide);
const storyScenesApi = orderedCrud('story-scenes', mapStoryScene);
const statsApi = orderedCrud('stats', mapStat);
const testimonialsApi = orderedCrud('testimonials', mapTestimonial);
const behindScenesApi = orderedCrud('behind-scenes', mapBehindScene);
const teamMembersApi = orderedCrud('team-members', mapTeamMember);

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ accessToken: string; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user: User = {
      id: 'admin',
      email: data.email,
      name: 'Studio Admin',
    };
    storeUser(user);
    return { user, token: data.accessToken };
  },

  async logout(): Promise<void> {
    clearUser();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return null;
    return loadUser();
  },

  // Dashboard stats (aggregated client-side — no dedicated backend endpoint)
  async getDashboardStats(): Promise<{
    totalPhotos: number;
    photosPerCategory: { categoryId: string; categoryName: string; count: number }[];
    totalPackages: number;
    newEnquiries: number;
    recentEnquiries: Enquiry[];
  }> {
    const [photos, categories, packages, enquiries] = await Promise.all([
      this.getPhotos(),
      this.getCategories(),
      this.getPackages(),
      this.getEnquiries(),
    ]);

    const photosPerCategory = categories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: photos.filter(p => p.categories.includes(cat.id)).length,
    }));

    const recentEnquiries = [...enquiries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalPhotos: photos.length,
      photosPerCategory,
      totalPackages: packages.length,
      newEnquiries: enquiries.filter(e => e.status === 'new').length,
      recentEnquiries,
    };
  },

  // Photos
  async getPhotos(filters?: {
    category?: string;
    published?: boolean;
    search?: string;
  }): Promise<Photo[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.published !== undefined) params.set('published', String(filters.published));
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    const docs = await request<Record<string, unknown>[]>(
      `/admin/photos${qs ? `?${qs}` : ''}`,
      { auth: true },
    );
    return docs.map(mapPhoto).sort((a, b) => a.order - b.order);
  },

  async getPhoto(id: string): Promise<Photo | null> {
    const photos = await this.getPhotos();
    return photos.find(p => p.id === id) ?? null;
  },

  async createPhoto(data: Omit<Photo, 'id' | 'createdAt'>): Promise<Photo> {
    const doc = await request<Record<string, unknown>>('/admin/photos', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        title: data.title,
        altText: data.altText,
        categoryIds: data.categories,
        order: data.order,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
      }),
    });
    return mapPhoto(doc);
  },

  async updatePhoto(id: string, data: Partial<Photo>): Promise<Photo> {
    const patch: Record<string, unknown> = { ...data };
    if (data.categories) {
      patch.categoryIds = data.categories;
      delete patch.categories;
    }
    const doc = await request<Record<string, unknown>>(`/admin/photos/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(patch),
    });
    return mapPhoto(doc);
  },

  async deletePhoto(id: string): Promise<void> {
    await request(`/admin/photos/${id}`, { method: 'DELETE', auth: true });
  },

  async bulkUpdatePhotos(ids: string[], data: Partial<Photo>): Promise<void> {
    const action = data.isPublished === true
      ? 'publish'
      : data.isPublished === false
        ? 'unpublish'
        : undefined;
    if (!action) throw new Error('Bulk update only supports publish/unpublish');
    await request('/admin/photos/bulk', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ action, ids }),
    });
  },

  async bulkDeletePhotos(ids: string[]): Promise<void> {
    await request('/admin/photos/bulk', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ action: 'delete', ids }),
    });
  },

  async reorderPhotos(photoIds: string[]): Promise<void> {
    await request('/admin/photos/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: photoIds }),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const docs = await request<Record<string, unknown>[]>('/admin/categories', { auth: true });
    return docs.map(mapCategory).sort((a, b) => a.order - b.order);
  },

  async getCategory(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id) ?? null;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const doc = await request<Record<string, unknown>>(`/admin/categories/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapCategory(doc);
  },

  async reorderCategories(categoryIds: string[]): Promise<void> {
    await request('/admin/categories/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: categoryIds }),
    });
  },

  // Packages
  async getPackages(): Promise<Package[]> {
    const docs = await request<Record<string, unknown>[]>('/admin/packages', { auth: true });
    return docs.map(mapPackage).sort((a, b) => a.order - b.order);
  },

  async getPackage(id: string): Promise<Package | null> {
    const packages = await this.getPackages();
    return packages.find(p => p.id === id) ?? null;
  },

  async createPackage(data: Omit<Package, 'id'>): Promise<Package> {
    const doc = await request<Record<string, unknown>>('/admin/packages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapPackage(doc);
  },

  async updatePackage(id: string, data: Partial<Package>): Promise<Package> {
    const doc = await request<Record<string, unknown>>(`/admin/packages/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapPackage(doc);
  },

  async deletePackage(id: string): Promise<void> {
    await request(`/admin/packages/${id}`, { method: 'DELETE', auth: true });
  },

  async reorderPackages(packageIds: string[]): Promise<void> {
    await request('/admin/packages/reorder', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ ids: packageIds }),
    });
  },

  // Site Content
  async getSiteContent(): Promise<SiteContent> {
    const doc = await request<Record<string, unknown>>('/admin/site-content', { auth: true });
    const links = Array.isArray(doc.serviceNavLinks) ? doc.serviceNavLinks : [];
    return {
      brandName: (doc.brandName as string) ?? '',
      tagline: (doc.tagline as string) ?? '',
      heroHeading: (doc.heroHeading as string) ?? '',
      heroSubtext: (doc.heroSubtext as string) ?? '',
      about: (doc.about as string) ?? '',
      ourStory: (doc.ourStory as string) ?? '',
      mission: (doc.mission as string) ?? '',
      aboutHeroSubtext: (doc.aboutHeroSubtext as string) ?? '',
      contactEmail: (doc.contactEmail as string) ?? '',
      whatsapp: (doc.whatsapp as string) ?? '',
      phone: (doc.phone as string) ?? '',
      socials: (doc.socials as SiteContent['socials']) ?? {},
      beforeAfter: (doc.beforeAfter as SiteContent['beforeAfter']) ?? { before: '', after: '' },
      serviceNavLinks: links.map((raw, index) => {
        const link = raw as Record<string, unknown>;
        return {
          id: String(link._id ?? link.id ?? ''),
          label: String(link.label ?? ''),
          path: String(link.path ?? ''),
          description: String(link.description ?? ''),
          icon: String(link.icon ?? 'Camera'),
          imageUrl: String(link.imageUrl ?? ''),
          order: typeof link.order === 'number' ? link.order : index,
          isPublished: link.isPublished !== false,
        };
      }),
    };
  },

  async updateSiteContent(data: Partial<SiteContent>): Promise<SiteContent> {
    const current = await this.getSiteContent();
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
    return this.getSiteContent();
  },

  // Enquiries
  async getEnquiries(filters?: { status?: 'new' | 'read' | 'responded' }): Promise<Enquiry[]> {
    const qs = filters?.status ? `?status=${filters.status}` : '';
    const docs = await request<Record<string, unknown>[]>(`/admin/enquiries${qs}`, { auth: true });
    return docs.map(mapEnquiry).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getEnquiry(id: string): Promise<Enquiry | null> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}`, { auth: true });
    return mapEnquiry(doc);
  },

  async updateEnquiryStatus(id: string, status: 'new' | 'read' | 'responded'): Promise<Enquiry> {
    const doc = await request<Record<string, unknown>>(`/admin/enquiries/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status }),
    });
    return mapEnquiry(doc);
  },

  // Bookings
  async getBookings(filters?: { status?: BookingStatus }): Promise<Booking[]> {
    const qs = filters?.status ? `?status=${filters.status}` : '';
    const docs = await request<Record<string, unknown>[]>(`/admin/bookings${qs}`, { auth: true });
    return docs.map(mapBooking).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getBooking(id: string): Promise<Booking | null> {
    const doc = await request<Record<string, unknown>>(`/admin/bookings/${id}`, { auth: true });
    return mapBooking(doc);
  },

  async createBooking(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shootType?: string;
    preferredEvent?: string;
    shootDate?: string;
    location?: string;
    reminderDate?: string;
    notes?: string;
    driveGalleryUrl?: string;
    driveEditedUrl?: string;
    driveRawsUrl?: string;
    driveNotes?: string;
    enquiryId?: string;
  }): Promise<Booking> {
    const doc = await request<Record<string, unknown>>('/admin/bookings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapBooking(doc);
  },

  async updateBooking(id: string, data: Partial<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shootType: string;
    preferredEvent: string;
    shootDate: string;
    location: string;
    reminderDate: string;
    notes: string;
    driveGalleryUrl: string;
    driveEditedUrl: string;
    driveRawsUrl: string;
    driveNotes: string;
    status: BookingStatus;
    enquiryId: string;
  }>): Promise<Booking> {
    const doc = await request<Record<string, unknown>>(`/admin/bookings/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    });
    return mapBooking(doc);
  },

  async confirmBooking(id: string): Promise<Booking> {
    const doc = await request<Record<string, unknown>>(`/admin/bookings/${id}/confirm`, {
      method: 'PATCH',
      auth: true,
    });
    return mapBooking(doc);
  },

  // Upload — uses multipart to backend
  async uploadFiles(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void,
  ): Promise<Photo[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const token = sessionStorage.getItem('auth_token');
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/admin/photos/upload`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Upload failed');
    }

    const docs = (await res.json()) as Record<string, unknown>[];
    docs.forEach((doc, i) => onProgress?.(String(doc._id ?? i), 100));
    return docs.map(mapPhoto);
  },

  // Hero Slides
  getHeroSlides: () => heroSlidesApi.getAll(),
  createHeroSlide: (data: Omit<HeroSlide, 'id'>) => heroSlidesApi.create(data),
  updateHeroSlide: (id: string, data: Partial<HeroSlide>) => heroSlidesApi.update(id, data),
  deleteHeroSlide: (id: string) => heroSlidesApi.delete(id),
  reorderHeroSlides: (ids: string[]) => heroSlidesApi.reorder(ids),

  // Story Scenes
  getStoryScenes: () => storyScenesApi.getAll(),
  createStoryScene: (data: Omit<StoryScene, 'id'>) => storyScenesApi.create(data),
  updateStoryScene: (id: string, data: Partial<StoryScene>) => storyScenesApi.update(id, data),
  deleteStoryScene: (id: string) => storyScenesApi.delete(id),
  reorderStoryScenes: (ids: string[]) => storyScenesApi.reorder(ids),

  // Stats
  getStats: () => statsApi.getAll(),
  createStat: (data: Omit<Stat, 'id'>) => statsApi.create(data),
  updateStat: (id: string, data: Partial<Stat>) => statsApi.update(id, data),
  deleteStat: (id: string) => statsApi.delete(id),
  reorderStats: (ids: string[]) => statsApi.reorder(ids),

  // Testimonials
  getTestimonials: () => testimonialsApi.getAll(),
  createTestimonial: (data: Omit<Testimonial, 'id'>) => testimonialsApi.create(data),
  updateTestimonial: (id: string, data: Partial<Testimonial>) => testimonialsApi.update(id, data),
  deleteTestimonial: (id: string) => testimonialsApi.delete(id),
  reorderTestimonials: (ids: string[]) => testimonialsApi.reorder(ids),

  // Behind Scenes
  getBehindScenes: () => behindScenesApi.getAll(),
  createBehindScene: (data: Omit<BehindScene, 'id'>) => behindScenesApi.create(data),
  updateBehindScene: (id: string, data: Partial<BehindScene>) => behindScenesApi.update(id, data),
  deleteBehindScene: (id: string) => behindScenesApi.delete(id),
  reorderBehindScenes: (ids: string[]) => behindScenesApi.reorder(ids),

  // Team Members
  getTeamMembers: () => teamMembersApi.getAll(),
  createTeamMember: (data: Omit<TeamMember, 'id'>) => teamMembersApi.create(data),
  updateTeamMember: (id: string, data: Partial<TeamMember>) => teamMembersApi.update(id, data),
  deleteTeamMember: (id: string) => teamMembersApi.delete(id),
  reorderTeamMembers: (ids: string[]) => teamMembersApi.reorder(ids),
};
