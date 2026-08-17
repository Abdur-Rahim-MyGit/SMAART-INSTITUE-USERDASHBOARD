/**
 * User Certificates API client — `back-end/routes/userCertificates.js`.
 *
 * Uploaded/external certificates a student adds to their record. This is a
 * distinct concept from:
 *   - `regDetails.certificates`  (self-reported, edited inline in ProfileScreen)
 *   - `/certificates/my-certificates` (auto-issued readiness certs — see api/certificates.js)
 *
 * Only the read is wired here — upload (multipart file) and delete are a
 * separate feature (native file/image picker) not built in this pass.
 */
import { apiClient } from './client';

export const getUserCertificates = () =>
  apiClient.get('/user-certificates').then((r) => r.data);

export default { getUserCertificates };
