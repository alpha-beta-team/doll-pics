import { deliverablesApi } from './deliverables';
/**
 * Admin CMS API — thin facade over domain modules.
 * Pages keep importing `{ api } from '../api/client'`.
 */
import { authApi } from './authApi';
import { bookingsApi } from './bookings';
import { categoriesApi } from './categories';
import { enquiriesApi } from './enquiries';
import { orderedContentApi } from './orderedContent';
import { packagesApi } from './packages';
import { photosApi } from './photos';
import { siteContentApi } from './siteContent';
import { staffAccountsApi } from './staffAccounts';
import { searchApi } from './search';
import { customerLookupApi } from './customerLookup';
import { voiceNotesApi } from './voiceNotes';
import { scheduleApi } from './schedule';
import { occasionsApi } from './occasions';
import { reviewsApi } from './reviews';
import { reportsApi } from './reports';
import { attendanceApi } from './attendance';
import { salaryApi } from './salary';
import { salesApi } from './sales';

export const api = {
  ...deliverablesApi,
  ...salesApi,
  ...authApi,
  ...photosApi,
  ...categoriesApi,
  ...packagesApi,
  ...siteContentApi,
  ...enquiriesApi,
  ...bookingsApi,
  ...orderedContentApi,
  ...staffAccountsApi,
  ...searchApi,
  ...customerLookupApi,
  ...voiceNotesApi,
  ...scheduleApi,
  ...occasionsApi,
  ...reviewsApi,
  ...reportsApi,
  ...attendanceApi,
  ...salaryApi,
};
