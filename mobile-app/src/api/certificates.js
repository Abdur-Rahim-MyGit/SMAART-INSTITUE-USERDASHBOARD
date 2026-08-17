/**
 * Certificates API client — `back-end/routes/certificates.js`.
 *
 * The server already builds a `verificationUrl` pointing at the public web
 * page (`/verify-certificate/:id`), so mobile deep-links to that rather than
 * reimplementing verification natively — the QR/verify flow is identical for
 * anyone who scans it, and there is one canonical place it lives.
 */
import { apiClient } from './client';

export const getMyCertificates = () =>
  apiClient.get('/certificates/my-certificates').then((r) => r.data);

export const getCertificateDetails = (certificateId) =>
  apiClient.get(`/certificates/details/${encodeURIComponent(certificateId)}`).then((r) => r.data);

export const verifyCertificate = (certificateId) =>
  apiClient.get(`/certificates/verify/${encodeURIComponent(certificateId)}`).then((r) => r.data);
