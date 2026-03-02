# Vision Board Application - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Features](#features)
7. [Code Structure](#code-structure)
8. [Bug Reports and Fixes](#bug-reports-and-fixes)
9. [Implementation Details](#implementation-details)

---

## 1. Overview

The Vision Board Application is a comprehensive platform for creating, managing, and visualizing personal goals through digital vision boards. The application supports multiple vision board types:

- **VisionBoard (Basic)**: Simple vision board with merged thumbnail
- **VisionBoardNew**: Enhanced version with complete board layout data
- **VisionBoardPro**: PicsArt-style collage creator with templates, slot images, and text overlays
- **UserVisionBoard**: Simple gallery with max 3 images per user

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| Vite | 5.x | Build Tool |
| TailwindCSS | 3.x | Styling |
| Radix UI | Latest | Component Library |
| html2canvas | 1.4.1 | Canvas Rendering |
| React Router DOM | 7.x | Routing |
| Lucide React | Latest | Icons |
| Zustand | 5.x | State Management |
| Framer Motion | 12.x | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest | Runtime |
| Express | 4.x | Web Framework |
| MongoDB/Mongoose | 7.x | Database |
| Cloudinary | 1.41.x | Image Storage |
| JWT | 9.x | Authentication |
| bcryptjs | 2.4.x | Password Hashing |
| Multer | 1.4.x | File Upload |

### Development Tools
- TypeScript (Frontend)
- ESLint
- Prettier
- Nodemon (Backend)

---

## 3. Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Dashboard  │  │   Gallery   │  │   Editor    │  │  Widget   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │                │               │         │
│  ┌──────┴────────────────┴────────────────┴───────────────┴──────┐  │
│  │                    API Services Layer                         │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │  │
│  │  │ visionBoardApi │  │visionBoardPro │  │visionBoardApi │   │  │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘   │  │
│  └──────────┴───────────────────┴───────────────────┴────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (Express)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Routes Layer                            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐    │   │
│  │  │visionBoard   │ │visionBoardPro│ │userVisionBoard   │    │   │
│  │  │Routes        │ │Routes         │ │Routes             │    │   │
│  │  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘    │   │
│  └─────────┼────────────────┼─────────────────┼───────────────┘   │
│            │                │                 │                    │
│  ┌─────────┴────────────────┴─────────────────┴───────────────┐   │
│  │                   Controllers Layer                        │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │   │
│  │  │visionBoard    │  │visionBoardPro │  │userVisionBoard│   │   │
│  │  │Controller     │  │Controller     │  │Controller     │   │   │
│  │  └────────┬──────┘  └────────┬───────┘  └────────┬───────┘   │   │
│  └───────────┼──────────────────┼──────────────────┼────────────┘   │
│              │                  │                  │                 │
│  ┌───────────┴──────────────────┴──────────────────┴────────────┐  │
│  │                      Models Layer                           │  │
│  │  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐  │  │
│  │  │VisionBoard│ │VisionBoard│ │VisionBoard │ │UserVision    │  │  │
│  │  │           │ │New        │ │Pro         │ │Board         │  │  │
│  │  └──────────┘ └───────────┘ └────────────┘ └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────┐               │
│  │   MongoDB      │              │   Cloudinary   │               │
│  │   Database     │              │   (Images)     │               │
│  └─────────────────┘              └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### 4.1 VisionBoard Model (`back-end/models/VisionBoard.js`)

```javascript
{
  title: String,              // Vision board title
  description: String,        // Board description
  images: [{
    url: String,              // Cloudinary URL
    public_id: String,        // Cloudinary public ID
    alt: String               // Alt text
  }],
  userId: ObjectId,           // Reference to User
  templateId: String,          // Template identifier
  templateName: String,        // Template name
  boardData: Mixed,            // Layout data (positions, etc.)
  thumbnail: {
    url: String,
    public_id: String
  },
  cloudinaryCollection: String, // Cloudinary folder name
  createdAt: Date,
  updatedAt: Date
}
```

### 4.2 VisionBoardNew Model (`back-end/models/VisionBoardNew.js`)

```javascript
{
  title: String,
  description: String,
  thumbnail: String,           // Single merged PNG thumbnail
  boardData: {
    elements: Array,          // Board elements
    background: {
      type: String,            // "color" or "image"
      value: String            // Color hex or image URL
    },
    canvasWidth: Number,      // Default: 1200
    canvasHeight: Number       // Default: 800
  },
  userId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3 VisionBoardPro Model (`back-end/models/VisionBoardPro.js`)

```javascript
{
  title: String,
  description: String,
  templateId: String,          // e.g., "grid-2x2"
  canvasSettings: {
    aspectRatio: String,      // "1:1", "4:5", "16:9", etc.
    width: Number,
    height: Number,
    backgroundColor: String,
    backgroundImage: String,
    borderRadius: Number,
    gap: Number
  },
  collageImage: String,        // Merged collage image URL
  collageImagePublicId: String,
  slotImages: Map,            // Individual slot images
  textOverlays: Map,          // Text overlays data
  userId: Mixed,              // Supports both String and ObjectId
  createdAt: Date,
  updatedAt: Date
}
```

### 4.4 UserVisionBoard Model (`back-end/models/UserVisionBoard.js`)

```javascript
{
  userId: ObjectId,           // Unique per user
  images: [{
    original: {
      url: String,
      publicId: String,
      width: Number,
      height: Number,
      format: String,
      size: Number
    },
    optimized: {
      web: String,            // WebP, 1200px
      mobile: String,        // WebP, 600px
      thumbnail: String       // 300x300
    },
    title: String,
    description: String,
    order: Number,            // 1-3
    uploadedAt: Date
  }],
  settings: {
    backgroundColor: String,
    layout: String,           // "grid", "carousel", "masonry"
    showTitles: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4.5 User/Student Models (Active Vision Reference)

```javascript
// In User.js and Student.js
{
  // ... other fields
  activeVisionBoardId: {
    type: ObjectId,
    ref: 'VisionBoardPro',
    default: null
  }
}
```

---

## 5. API Endpoints

### 5.1 VisionBoard (Basic) Routes (`/api/vision-board`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new vision board |
| GET | `/` | Get all vision boards for user |
| GET | `/:id` | Get single vision board |
| PUT | `/:id` | Update vision board |
| DELETE | `/:id` | Delete vision board |
| POST | `/:id/duplicate` | Duplicate vision board |
| GET | `/:id/collection` | Get all images in collection |
| POST | `/:id/consolidate` | Migrate images to collection |

### 5.2 VisionBoardPro Routes (`/api/vision-board-pro`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new vision board |
| GET | `/` | Get all vision boards |
| GET | `/count` | Get board count and limit status |
| GET | `/:id` | Get single vision board |
| PUT | `/:id` | Update vision board |
| DELETE | `/:id` | Delete vision board |
| POST | `/:id/duplicate` | Duplicate vision board |
| GET | `/active` | Get active vision board |
| PUT | `/active/:id` | Set active vision board |
| DELETE | `/active` | Clear active vision |

### 5.3 UserVisionBoard Routes (`/api/user-vision-boards`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gallery` | Get user gallery |
| POST | `/upload` | Upload new image (max 3) |
| PUT | `/image/:imageId` | Update image metadata |
| DELETE | `/image/:imageId` | Delete image |
| PUT | `/reorder` | Reorder images |
| PUT | `/settings` | Update gallery settings |

---

## 6. Features

### 6.1 User Authentication
- JWT-based authentication
- Session management with cookies
- Protected routes requiring authentication
- User ID extraction from session storage

### 6.2 Image Upload and Management
- **Cloudinary Integration**: Images stored in Cloudinary with automatic optimization
- **Multi-tier Storage**: Web (1200px), Mobile (600px), Thumbnail (300px)
- **Format Optimization**: Automatic WebP conversion
- **File Validation**: JPEG, PNG, GIF support (5MB limit)
- **Memory Upload**: Buffer-based upload with folder organization

### 6.3 Board Creation and Organization
- Multiple board types (Basic, New, Pro)
- Template selection (grid-2x2, grid-3x3, etc.)
- Canvas settings customization
- Title and description fields
- Thumbnail generation via html2canvas

### 6.4 Drag-and-Drop Functionality
- Canvas-based editor with element positioning
- Image slot management
- Text overlay positioning
- Scale and rotation controls

### 6.5 Goal Tracking
- Active vision board for dashboard display
- Board count limits (3 boards for Pro version)
- Image reordering
- Progress visualization

### 6.6 Visualization Features
- Splash screen animation on dashboard
- Widget display on main dashboard
- Download as PNG
- Preview modal with resolution options

---

## 7. Code Structure

### 7.1 Backend Structure

```
back-end/
├── controllers/
│   ├── visionBoardController.js       # Basic vision board logic
│   ├── visionBoardProController.js    # Pro version logic
│   └── userVisionBoardController.js   # User gallery logic
├── models/
│   ├── VisionBoard.js                 # Basic board schema
│   ├── VisionBoardNew.js              # Enhanced board schema
│   ├── VisionBoardPro.js              # Pro board schema
│   ├── UserVisionBoard.js             # User gallery schema
│   └── User.js                        # User model with activeVisionBoardId
├── routes/
│   ├── visionBoardRoutes.js           # Basic routes
│   ├── visionBoards.js                # Legacy routes
│   ├── visionBoardProRoutes.js        # Pro routes
│   └── userVisionBoardRoutes.js      # Gallery routes
├── helpers/
│   ├── cloudinaryHelper.js            # Cloudinary utilities
│   ├── nsfwModeration.js              # Content moderation
│   └── textModeration.js              # Text moderation
├── middleware/
│   ├── auth.js                        # Authentication middleware
│   └── upload.js                      # Upload middleware
└── server.js                          # Express server setup
```

### 7.2 Frontend Structure

```
front-end/src/
├── features/
│   └── visionBoard/
│       ├── components/
│       │   ├── editor/                # Editor components
│       │   │   ├── ImageSlot.jsx
│       │   │   └── TextOverlay.jsx
│       │   ├── layout/                # Layout components
│       │   │   ├── EditorBottomBar.jsx
│       │   │   ├── EditorCanvas.jsx
│       │   │   ├── EditorDrawer.jsx
│       │   │   ├── EditorSidebar.jsx
│       │   │   ├── EditorTopBar.jsx
│       │   │   └── SelectionControls.jsx
│       │   ├── modals/               # Modal components
│       │   │   └── PreviewModal.jsx
│       │   └── panels/               # Side panels
│       │       ├── StylePanel.jsx
│       │       ├── TemplateSelector.jsx
│       │       └── TypographyPanel.jsx
│       ├── pages/
│       │   ├── VisionBoardEditorPro.jsx
│       │   ├── VisionBoardGalleryPro.jsx
│       │   └── VisionBoardView.jsx
│       ├── services/
│       │   ├── visionBoardApi.js
│       │   └── visionBoardProApi.js
│       ├── templates/
│       │   └── gridTemplates.js
│       └── utils/
│           ├── constants.js
│           ├── contentModeration.js
│           └── imageModeration.js
├── components/                       # Shared components
│   ├── VisionBoardCard.jsx
│   ├── VisionBoardGallery.jsx
│   ├── VisionBoardWidget.jsx
│   ├── VisionBoardSplash.jsx
│   └── CreateVisionBoardModal.jsx
└── pages/
    └── Dashboard.jsx                 # Main dashboard with widget
```

---

## 8. Bug Reports and Fixes

### Bug #1: User ID Mismatch in Vision Board Queries

**Issue**: Vision boards not loading for users because userId was stored as different types (String vs ObjectId).

**Symptoms**:
- Users unable to see their created vision boards
- Empty gallery even after creating boards

**Root Cause**: 
The `userId` field in `VisionBoardPro` model was being stored sometimes as a plain string and sometimes as MongoDB ObjectId, causing query mismatches.

**Fix Applied** (in `visionBoardProController.js`):

```javascript
// Helper function to build user query that handles both string and ObjectId formats
const buildUserQuery = (userId) => {
  const queries = [{ userId: userId }]; // String match
  
  if (isValidObjectId(userId)) {
    queries.push({ userId: new mongoose.Types.ObjectId(userId) }); // ObjectId match
  }
  
  return { $or: queries };
};
```

**Resolution**: The query now uses `$or` to match both string and ObjectId formats, ensuring all boards are retrieved regardless of how userId was stored.

---

### Bug #2: Active Vision Board Not Displaying on Dashboard

**Issue**: Users set a vision board as active, but it doesn't appear on the dashboard widget.

**Symptoms**:
- Set Active button appears to work
- Dashboard shows no vision board
- Widget displays empty state

**Root Cause**:
The `activeVisionBoardId` was being updated in only one collection (User or Student) but not checking both.

**Fix Applied** (in `visionBoardProController.js` - `setActiveVision` function):

```javascript
// Update user's activeVisionBoardId - try Student first, then User
let updateResult = await Student.findByIdAndUpdate(
  userId,
  { activeVisionBoardId: id },
  { new: true }
);

if (updateResult) {
  console.log('Student update successful');
} else {
  // Fall back to User collection
  console.log('Student not found, trying User collection...');
  updateResult = await User.findByIdAndUpdate(
    userId,
    { activeVisionBoardId: id },
    { new: true }
  );
}
```

**Resolution**: Now the system tries to update both Student and User collections, ensuring the active vision is saved regardless of account type.

---

### Bug #3: Gallery Image Upload Limit Not Being Enforced

**Issue**: Users could upload more than 3 images despite the limit.

**Symptoms**:
- Users able to exceed 3 image limit
- Gallery displays more than 3 images

**Fix Applied** (in `userVisionBoardController.js`):

```javascript
// Check max 3 images before upload
if (gallery.images.length >= 3) {
  return res.status(400).json({
    success: false,
    message: "Maximum 3 images allowed. Please delete an image first.",
  });
}
```

Also enforced at schema level:

```javascript
// Ensure max 3 images
userVisionBoardSchema.pre("save", function (next) {
  if (this.images && this.images.length > 3) {
    return next(new Error("Maximum 3 images allowed per user"));
  }
  this.updatedAt = Date.now();
  next();
});
```

**Resolution**: Limit enforced at both API and database levels.

---

### Bug #4: Invalid ObjectId Causing Server Errors

**Issue**: Invalid ObjectId format in API requests causing 500 errors.

**Symptoms**:
- Server crashes on malformed IDs
- Poor error messages

**Fix Applied** (in all controllers):

```javascript
// Helper to validate ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Usage in routes
if (!isValidObjectId(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid vision board ID",
  });
}
```

**Resolution**: All endpoints now validate ObjectId format before querying database.

---

### Bug #5: Image URLs Not Updating After Board Update

**Issue**: When updating a vision board with new images, the old thumbnails weren't being cleaned up.

**Symptoms**:
- Old images remain in Cloudinary
- Storage usage increases unnecessarily

**Fix Applied** (in `visionBoardController.js`):

```javascript
// Handle thumbnail update
if (thumbnail && thumbnail.startsWith("data:image")) {
  // Delete old thumbnail if exists
  if (existingBoard.thumbnail) {
    const oldPublicId = getPublicIdFromUrl(existingBoard.thumbnail);
    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }
  }
  // Upload new thumbnail
  const uploadResult = await uploadBase64Image(/* ... */);
}
```

**Resolution**: Old images are now deleted from Cloudinary before uploading new ones.

---

### Bug #6: Vision Board Count Exceeding Limit After Duplication

**Issue**: Users could duplicate boards even when at the limit, causing count to exceed 3.

**Fix Applied** (in `visionBoardProController.js`):

```javascript
// Check if user has reached the maximum limit BEFORE duplicating
const existingBoardsCount = await VisionBoardPro.countDocuments(userQuery);
if (existingBoardsCount >= MAX_VISION_BOARDS_PER_USER) {
  return res.status(400).json({
    success: false,
    message: `You can only save up to ${MAX_VISION_BOARDS_PER_USER} vision boards. Please delete an existing board to duplicate.`,
    maxReached: true,
  });
}
```

**Resolution**: Limit check now happens before any duplication operation.

---

### Bug #7: CORS Issues with API Calls

**Issue**: Cross-origin requests failing from different domains/ports.

**Fix Applied** (in `back-end/server.js`):

```javascript
const cors = require('cors');

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
```

**Resolution**: CORS properly configured with credentials support.

---

### Bug #8: Session Storage Empty After Page Refresh

**Issue**: User session lost on refresh, causing authentication errors.

**Fix Applied** (in `visionBoardProApi.js`):

```javascript
// Try sessionStorage first, then localStorage
let userStr = sessionStorage.getItem("user");

if (!userStr || userStr === '{}' || userStr === 'undefined') {
  userStr = localStorage.getItem("user");
}

// If still no valid user, fetch from backend
if (user.email && !userId) {
  const data = await globalApiCall(`/students/by-email/${encodeURIComponent(user.email)}`);
  if (data.success && data.data && data.data._id) {
    userId = data.data._id;
    // Update storage for future requests
    sessionStorage.setItem("user", JSON.stringify({...user, id: userId}));
  }
}
```

**Resolution**: Multiple fallback mechanisms to retrieve user ID.

---

## 9. Implementation Details

### 9.1 Image Upload Flow

```
User Selects Image
       │
       ▼
┌──────────────────┐
│ Validate Format  │ ──→ JPEG/PNG/GIF only
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Check File Size  │ ──→ Max 5MB
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Upload to        │
│ Cloudinary       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate         │
│ Optimized URLs   │ ──→ Web/Mobile/Thumbnail
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Save to MongoDB  │
└──────────────────┘
```

### 9.2 Vision Board Editor Flow

```
User Opens Editor
       │
       ▼
┌──────────────────┐
│ Select Template │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Configure Canvas│ ──→ Aspect ratio, colors, etc.
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Add Images to    │
│ Slots            │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Add Text         │
│ Overlays         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate         │ ──→ html2canvas
│ Collage Image   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Save to Database│
└──────────────────┘
```

### 9.3 Active Vision Board Flow

```
User Creates/Selects Board
       │
       ▼
┌──────────────────┐
│ Click "Set as    │
│ Active"          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update User or  │
│ Student record  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard loads  │
│ activeVision     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Display in       │
│ Widget           │
└──────────────────┘
```

---

## 10. Testing Checklist

### Authentication
- [x] User can log in with email/password
- [x] User can log in with OTP
- [x] Session persists across page refreshes
- [x] Protected routes redirect to login

### Vision Board Creation
- [x] User can create new vision board
- [x] User can select template
- [x] User can upload images
- [x] User can add text overlays
- [x] User can customize canvas settings
- [x] Board saves successfully

### Vision Board Management
- [x] User can view all their boards
- [x] User can edit existing board
- [x] User can delete board
- [x] User can duplicate board
- [x] Limit of 3 boards enforced

### Gallery Features
- [x] User can upload up to 3 images
- [x] Images auto-optimize for different devices
- [x] User can reorder images
- [x] User can delete images
- [x] Gallery settings can be customized

### Active Vision
- [x] User can set board as active
- [x] Active board appears on dashboard
- [x] User can change active board
- [x] User can clear active board

### Bug Fixes Verified
- [x] User ID matching works for both String and ObjectId
- [x] Active vision updates correctly
- [x] Image limit enforced
- [x] Invalid ObjectIds handled gracefully
- [x] Old images cleaned up on update
- [x] Duplication respects limit

---

## 11. API Request/Response Examples

### Create Vision Board (Pro)

**Request:**
```http
POST /api/vision-board-pro?userId=507f1f77bcf86cd799439011
Content-Type: application/json

{
  "title": "My 2024 Goals",
  "templateId": "grid-2x2",
  "canvasSettings": {
    "aspectRatio": "1:1",
    "width": 1080,
    "height": 1080,
    "backgroundColor": "#ffffff"
  },
  "collageImage": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vision board created successfully",
  "data": {
    "_id": "65abc123def4567890123456",
    "title": "My 2024 Goals",
    "templateId": "grid-2x2",
    "collageImage": "https://res.cloudinary.com/.../image.png",
    "userId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get All Vision Boards

**Request:**
```http
GET /api/vision-board-pro?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "maxAllowed": 3,
  "canCreateMore": true,
  "data": [
    {
      "_id": "65abc123def4567890123456",
      "title": "My 2024 Goals",
      "collageImage": "https://res.cloudinary.com/.../image.png",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Set Active Vision

**Request:**
```http
PUT /api/vision-board-pro/active/65abc123def4567890123456?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Vision board set as active",
  "data": {
    "id": "65abc123def4567890123456",
    "title": "My 2024 Goals",
    "image": "https://res.cloudinary.com/.../image.png"
  }
}
```

---

## 12. Error Handling

All API endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (optional)"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

---

## 13. Security Considerations

1. **Authentication**: All routes protected with JWT middleware
2. **Input Validation**: ObjectId format validation on all ID parameters
3. **File Upload Validation**: MIME type checking, file size limits
4. **Content Moderation**: NSFW detection for uploaded images
5. **Rate Limiting**: Express rate limiter configured
6. **CORS**: Configured for secure cross-origin requests
7. **Error Messages**: Generic messages to prevent information leakage

---

## 14. Performance Optimizations

1. **Image Optimization**: Cloudinary automatic format conversion and resizing
2. **Lazy Loading**: React lazy loading for routes
3. **Caching**: User ID caching in frontend API service
4. **Database Indexing**: Indexes on userId and createdAt fields
5. **Query Optimization**: Selective field retrieval (`.lean()`)

---

## 15. Future Enhancements

1. Add more template options
2. Implement collaborative boards
3. Add sharing functionality
4. Export to PDF
5. Mobile app integration
6. AI-powered image suggestions

---

*Document Version: 1.0*
*Last Updated: 2026-02-26*
*Author: Technical Documentation Team*
