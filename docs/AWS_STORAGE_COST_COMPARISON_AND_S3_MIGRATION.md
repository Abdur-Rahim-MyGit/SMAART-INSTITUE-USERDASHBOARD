# SMAART Institute Storage Cost Comparison and AWS S3 Migration Guide

Last updated: 2026-05-21

## Purpose

This document explains:

1. How SMAART Institute stores media today.
2. Cloudinary vs AWS S3 + CloudFront cost behavior.
3. Which option is better for SMAART at scale.
4. The exact step-by-step process to move SMAART storage from Cloudinary to S3.
5. The code files in this repo that must change.

## Current SMAART Storage Architecture

Based on the current codebase:

- General uploads are handled by [back-end/routes/uploadRoutes.js](../back-end/routes/uploadRoutes.js)
- Upload middleware is defined in [back-end/middleware/upload.js](../back-end/middleware/upload.js)
- Base64 image uploads use [back-end/helpers/cloudinaryHelper.js](../back-end/helpers/cloudinaryHelper.js)
- Vision board media uses Cloudinary-backed upload and delete flows in:
  - [back-end/controllers/visionBoardController.js](../back-end/controllers/visionBoardController.js)
  - [back-end/controllers/visionBoardProController.js](../back-end/controllers/visionBoardProController.js)
  - [back-end/controllers/userVisionBoardController.js](../back-end/controllers/userVisionBoardController.js)
- The app still serves a local `/uploads` directory in [back-end/server.js](../back-end/server.js), but the main upload path used by the frontend is already Cloudinary-based.

### What is stored in Cloudinary today

- Profile photos
- Registration documents
- PDFs uploaded through the registration flow
- Vision board images
- Community images/videos/PDFs

### What is not automatically stored by the backend upload flow

Course videos are mostly stored as `videoUrl` strings in MongoDB models such as [back-end/models/Course.js](../back-end/models/Course.js). That means many course videos are URL-based, not uploaded by this backend pipeline.

## Short Answer

SMAART is already largely using Cloudinary for media storage.

If you deploy on AWS, you have two practical options:

1. Keep Cloudinary for storage and only host the application on AWS.
2. Move storage to AWS S3 and optionally place CloudFront in front of it.

## Recommendation for SMAART

For SMAART Institute, the best long-term architecture is usually:

- Cloudinary for image-heavy features if you want faster implementation and built-in optimization.
- S3 + CloudFront for large course video libraries and heavy document delivery.

If you want a single-cloud architecture and lower long-term media cost, migrate to S3.

## Official Pricing References

These prices and billing models can change, so always re-check the official pages before production budgeting.

### Cloudinary

Official sources:

- Cloudinary pricing page: https://cloudinary.com/pricing
- Cloudinary billing model: https://cloudinary.com/documentation/billing_and_plans

Key facts from Cloudinary's official docs:

- Free plan includes 25 monthly credits.
- Plus plan is listed at $99/month with 225 monthly credits.
- Advanced plan is listed at $249/month with 600 monthly credits.
- Cloudinary credits are shared across storage, transformations, and bandwidth.
- Cloudinary defines 1 credit as:
  - 1,000 transformations, or
  - 1 GB of storage, or
  - 1 GB of image bandwidth, or
  - 2 GB of video bandwidth on self-service paid plans.

Cloudinary also states that for enterprise-style contracts, one unit equals:

- 1 million transformations, or
- 1 TB of storage, or
- 1 TB of bandwidth.

### AWS S3

Official source:

- Amazon S3 pricing: https://aws.amazon.com/s3/pricing/

Key facts captured from AWS official pricing/examples:

- S3 Standard GET requests are shown at $0.0004 per 1,000 requests in AWS pricing examples.
- S3 Standard PUT request pricing is shown at $0.005 per 1,000 requests in AWS pricing examples.
- AWS states that data transfer out from S3 to CloudFront is free.
- AWS also states the first 100 GB/month data transferred out to the internet is free when aggregated across AWS services and regions, subject to AWS terms.

### AWS CloudFront

Official sources:

- CloudFront getting started: https://aws.amazon.com/cloudfront/getting-started/
- CloudFront FAQ: https://aws.amazon.com/cloudfront/faqs/

Key facts captured from AWS official docs:

- All CloudFront customers receive 1 TB data transfer out and 10,000,000 HTTP/HTTPS requests free of charge under AWS Free Tier terms.
- AWS states that when S3 is the origin, AWS does not charge data transfer out from S3 to CloudFront.
- CloudFront pricing varies by geography and request volume, so exact production rates should be confirmed for your chosen regions and price class.

## Cost Comparison: Cloudinary vs S3 + CloudFront

## 1. Billing model difference

### Cloudinary

Cloudinary is bundled pricing.

You pay in credits/units for:

- storage
- delivery bandwidth
- transformations
- video processing
- CDN-backed delivery

This is simpler to operate, but less transparent for large video/document platforms.

### S3 + CloudFront

AWS is unbundled pricing.

You pay separately for:

- S3 storage
- S3 PUT requests
- S3 GET requests
- CloudFront data transfer
- CloudFront requests
- optional transcoding if you use MediaConvert

This is more operationally complex, but usually cheaper and more predictable at scale for LMS-style video usage.

## 2. When Cloudinary is cost-effective

Cloudinary is usually cost-effective when:

- your app is image-heavy
- you need automatic image optimization
- you need quick implementation
- your transformation logic is important
- your media library is moderate, not huge

For SMAART, this applies well to:

- profile photos
- vision boards
- community images
- lightweight PDFs

## 3. When S3 + CloudFront is more cost-effective

S3 + CloudFront is usually more cost-effective when:

- you have many long videos
- students stream videos heavily
- storage keeps growing month over month
- you want finer control over private/public access
- you need lower-cost raw storage
- you want to avoid Cloudinary credit growth from bandwidth

For SMAART, this applies well to:

- course videos
- downloadable documents
- certificates
- private institutional files

## 4. Practical interpretation for SMAART

### Cloudinary warning sign

Cloudinary's own billing guide includes a video platform example:

- 2 TB video storage
- 10 TB video delivery
- total 7,040 credits/month

That is an important signal for SMAART:

- if SMAART grows into a real video-learning platform, Cloudinary usage can grow very quickly
- especially because video delivery consumes credits too

### AWS warning sign

AWS is usually cheaper for raw storage and heavy delivery, but:

- you must build and maintain more yourself
- optimization, signed delivery, and streaming architecture are your responsibility

## 5. Decision summary

### If your priority is long-term scale and cost efficiency

Use:

- S3 for storage
- CloudFront for delivery
- optional MediaConvert for adaptive video streaming

### Best balanced architecture for SMAART

Recommended hybrid:

- Keep Cloudinary for images:
  - profile photos
  - vision board images
  - community image uploads
- Move to S3 + CloudFront for:
  - course videos
  - PDFs
  - certificates
  - registration documents

This gives better cost control without losing image optimization convenience.

## Step-by-Step: Convert SMAART Storage to AWS S3

This section is the exact migration path.

## Phase 1: Plan the target storage design

Choose one bucket or multiple buckets.

Recommended for SMAART:

- One bucket: `smaart-media-prod`

Inside that bucket, use prefixes:

- `registrations/{email}/`
- `profile-photos/{userId}/`
- `vision-boards/{userId}/`
- `community/{userId}/`
- `courses/{courseId}/videos/`
- `certificates/{userId}/`

Why this is better:

- simpler IAM
- simpler lifecycle management
- simpler backups
- easier migration from Cloudinary folder structure

## Phase 2: Create AWS resources

### Step 1: Create the S3 bucket

In AWS Console:

1. Open S3
2. Create bucket
3. Name it `smaart-media-prod`
4. Choose the target region
5. Keep Block Public Access enabled unless you intentionally want public files
6. Enable versioning
7. Enable default encryption

### Step 2: Create CloudFront distribution

1. Open CloudFront
2. Create distribution
3. Set S3 bucket as origin
4. Use Origin Access Control
5. Restrict direct bucket access
6. Enable HTTPS
7. Add custom domain later if needed, such as `media.smaartinstitute.com`

### Step 3: Create IAM role or IAM user

Grant only:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:ListBucket`

Prefer IAM role if backend is deployed on EC2, ECS, or Lambda.

## Phase 3: Add backend AWS configuration

Add environment variables:

```env
AWS_REGION=ap-south-1
AWS_S3_BUCKET=smaart-media-prod
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_CLOUDFRONT_URL=https://dxxxxxxxx.cloudfront.net
STORAGE_PROVIDER=s3
```

If you use IAM role, omit static access keys.

## Phase 4: Add S3 SDK to backend

Install:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

Optional:

```bash
npm install multer-s3
```

For SMAART, I recommend `multer.memoryStorage()` plus explicit upload helpers. It is easier to control than wiring everything directly through `multer-s3`.

## Phase 5: Create S3 helper files

Create:

- `back-end/helpers/s3Helper.js`

This helper should expose:

- `uploadBufferToS3`
- `deleteFromS3`
- `getSignedReadUrl`
- `buildPublicAssetUrl`

Expected response shape:

```js
{
  success: true,
  url,
  key,
  bucket,
  contentType
}
```

## Phase 6: Replace Cloudinary-specific upload middleware

Current Cloudinary logic is concentrated in:

- [back-end/middleware/upload.js](../back-end/middleware/upload.js)

Today that file:

- configures Cloudinary
- uses `CloudinaryStorage`
- returns `req.file.path` and `req.file.filename`

### What to change

Replace Cloudinary-backed multer storage with:

- `multer.memoryStorage()`
- upload to S3 after multer parses the file

Suggested structure:

- keep file validation logic
- keep file size limits
- remove Cloudinary storage adapters
- upload buffers to S3 inside route/controller layer

## Phase 7: Change upload route response format

Current upload route:

- [back-end/routes/uploadRoutes.js](../back-end/routes/uploadRoutes.js)

Current response:

```json
{
  "url": "...",
  "publicId": "...",
  "originalName": "...",
  "format": "..."
}
```

### New S3 response

Use:

```json
{
  "url": "...",
  "key": "...",
  "bucket": "smaart-media-prod",
  "originalName": "...",
  "contentType": "..."
}
```

Important:

- `publicId` should be replaced by `key`
- frontend code expecting `publicId` must be updated

## Phase 8: Update frontend upload consumers

Important frontend upload consumers include:

- [front-end/src/components/FileUpload.jsx](../front-end/src/components/FileUpload.jsx)
- [front-end/src/pages/ComprehensiveSignup.jsx](../front-end/src/pages/ComprehensiveSignup.jsx)
- [front-end/src/pages/AddDetails.jsx](../front-end/src/pages/AddDetails.jsx)
- [front-end/src/pages/Profile.jsx](../front-end/src/pages/Profile.jsx)

### What changes are needed

Today some screens store:

- `response.publicId`
- `response.url`

After migration:

- store `response.key` where delete/update logic needs object identity
- store `response.url` for preview/display

Recommended object structure:

```js
{
  url: "...",
  key: "...",
  storageProvider: "s3"
}
```

## Phase 9: Update deletion and replacement flows

Cloudinary deletion currently relies on:

- `publicId`
- Cloudinary URL parsing

This exists in:

- [back-end/helpers/cloudinaryHelper.js](../back-end/helpers/cloudinaryHelper.js)
- [back-end/controllers/visionBoardController.js](../back-end/controllers/visionBoardController.js)
- [back-end/controllers/visionBoardProController.js](../back-end/controllers/visionBoardProController.js)
- [back-end/controllers/userVisionBoardController.js](../back-end/controllers/userVisionBoardController.js)

### What changes are needed

Replace:

- `publicId`
- `cloudinary.uploader.destroy(...)`

With:

- `key`
- `DeleteObjectCommand`

For records already stored in DB, introduce:

```js
storageProvider: 'cloudinary' | 's3'
```

That allows mixed migration without breaking old media.

## Phase 10: Support mixed-mode migration

Do not switch everything in one day unless you have to.

Recommended migration strategy:

1. New uploads go to S3
2. Existing Cloudinary URLs continue to work
3. DB records keep `storageProvider`
4. Background migration copies old Cloudinary assets to S3 only if needed
5. Old Cloudinary assets are deleted only after validation

This is the safest production migration path.

## Phase 11: Handle private vs public files correctly

### Public-style files

Can be served via CloudFront URL:

- profile photos
- vision board images
- public community images

### Private files

Should use signed URL delivery:

- mark sheets
- student certificates
- registration PDFs
- sensitive proofs

Recommended:

- private S3 bucket
- CloudFront signed URLs or S3 presigned URLs

## Phase 12: Handle course videos properly

This is the most important part for SMAART scaling.

### Minimum viable approach

1. Upload MP4 to S3
2. Save CloudFront URL in course `videoUrl`
3. Stream directly

### Better production approach

1. Upload source video to S3
2. Use AWS Elemental MediaConvert to generate HLS renditions
3. Save HLS manifest URL
4. Deliver via CloudFront

This is better for:

- adaptive streaming
- lower buffering
- high concurrency
- mobile learners

## Phase 13: Update data model conventions

Even if schema fields stay as strings, standardize your file metadata.

Recommended DB pattern:

```js
{
  fileUrl: String,
  fileKey: String,
  storageProvider: String,
  contentType: String,
  uploadedAt: Date
}
```

For image-heavy objects:

```js
{
  url: String,
  key: String,
  storageProvider: 's3',
  width: Number,
  height: Number
}
```

## Phase 14: Add lifecycle and backup policies

In S3:

1. Enable versioning
2. Add lifecycle rules
3. Move stale documents to lower-cost storage classes if allowed
4. Keep production backups

Examples:

- old derived media -> Intelligent-Tiering
- archival docs -> Glacier Instant Retrieval or Glacier Flexible Retrieval

Do not move active learning videos too aggressively if students access them frequently.

## Phase 15: Test checklist before cutover

Before production cutover:

1. Upload image
2. Upload PDF
3. Upload video
4. Preview uploaded asset
5. Replace uploaded asset
6. Delete uploaded asset
7. Verify DB key and URL saved correctly
8. Verify private files are not publicly exposed
9. Verify CloudFront delivery works
10. Verify old Cloudinary assets still render

## Exact Repo Files to Change for SMAART

Core backend files:

- [back-end/middleware/upload.js](../back-end/middleware/upload.js)
- [back-end/routes/uploadRoutes.js](../back-end/routes/uploadRoutes.js)
- [back-end/helpers/cloudinaryHelper.js](../back-end/helpers/cloudinaryHelper.js)
- new file: `back-end/helpers/s3Helper.js`
- possibly new file: `back-end/config/s3.js`

Backend controllers with Cloudinary usage:

- [back-end/controllers/visionBoardController.js](../back-end/controllers/visionBoardController.js)
- [back-end/controllers/visionBoardProController.js](../back-end/controllers/visionBoardProController.js)
- [back-end/controllers/userVisionBoardController.js](../back-end/controllers/userVisionBoardController.js)

Frontend files expecting upload response fields:

- [front-end/src/components/FileUpload.jsx](../front-end/src/components/FileUpload.jsx)
- [front-end/src/pages/Profile.jsx](../front-end/src/pages/Profile.jsx)
- [front-end/src/pages/AddDetails.jsx](../front-end/src/pages/AddDetails.jsx)
- [front-end/src/pages/ComprehensiveSignup.jsx](../front-end/src/pages/ComprehensiveSignup.jsx)

## Suggested Migration Order for SMAART

### Stage 1

Move registration documents and profile photos to S3.

Why:

- easiest to control
- clear upload pipeline
- immediate value for private file handling

### Stage 2

Move vision board and community uploads to S3.

Why:

- medium complexity
- tests image/video mixed workflows

### Stage 3

Move course videos to S3 + CloudFront.

Why:

- highest impact
- largest long-term savings
- most important for concurrency and scale

## Final Recommendation

If you want the simplest next step:

- Deploy SMAART on AWS
- Keep Cloudinary temporarily
- Move course videos first to S3 + CloudFront

If you want full AWS-native storage:

- implement the S3 helper
- migrate upload middleware
- update frontend to use `key` instead of `publicId`
- run mixed-mode support during transition

## Notes

- Pricing changes frequently; confirm with AWS Pricing Calculator and your actual Cloudinary plan before final budgeting.
- Cloudinary is operationally simpler.
- S3 + CloudFront is usually better for large-scale student media delivery, especially videos and private documents.

## Source Links

- Cloudinary pricing: https://cloudinary.com/pricing
- Cloudinary billing model: https://cloudinary.com/documentation/billing_and_plans
- Amazon S3 pricing: https://aws.amazon.com/s3/pricing/
- Amazon CloudFront getting started: https://aws.amazon.com/cloudfront/getting-started/
- Amazon CloudFront FAQ: https://aws.amazon.com/cloudfront/faqs/
