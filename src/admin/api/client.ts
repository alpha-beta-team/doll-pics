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
import { workApi } from './work';
import { staffAccountsApi } from './staffAccounts';
import { integrationsApi } from './integrations';
import { searchApi } from './search';
import { customerLookupApi } from './customerLookup';
import { voiceNotesApi } from './voiceNotes';
import { scheduleApi } from './schedule';
import { occasionsApi } from './occasions';
import { reviewsApi } from './reviews';
import { quotationsApi } from './quotations';
import { attendanceApi } from './attendance';

export const api = {
  ...authApi,
  ...photosApi,
  ...categoriesApi,
  ...packagesApi,
  ...siteContentApi,
  ...enquiriesApi,
  ...bookingsApi,
  ...orderedContentApi,
  ...workApi,
  ...staffAccountsApi,
  ...integrationsApi,
  ...searchApi,
  ...customerLookupApi,
  ...voiceNotesApi,
  ...scheduleApi,
  ...occasionsApi,
  ...reviewsApi,
  ...quotationsApi,
  ...attendanceApi,
};
