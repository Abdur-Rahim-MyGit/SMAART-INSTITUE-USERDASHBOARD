# 3D Avatar Level-Based Unlock System

A comprehensive gamification system for the SMAART Minds educational platform that features a level-based 3D avatar with unlockable accessories and animations.

## Overview

The avatar system provides visual progression as users level up through the platform. Users unlock accessories and animations at specific levels, creating an engaging and motivating experience.

### Level Unlock Rules

| Level | Unlock |
|-------|--------|
| 1 | Base avatar |
| 2 | Shoes 👟 |
| 3 | Jacket 🧥 |
| 4 | Glasses 👓 |
| 5 | Celebration animation 🎉 |

## Architecture

### Backend (Express + MongoDB)

#### Files Created:
- `back-end/models/Avatar.js` - MongoDB schema for avatar data
- `back-end/controllers/avatarController.js` - Business logic for avatar operations
- `back-end/routes/avatar.js` - API endpoints
- `back-end/middleware/auth.js` - JWT authentication middleware

#### API Endpoints

```
GET  /api/avatar              - Fetch avatar + unlock state
GET  /api/avatar/unlock-status - Get unlocked/upcoming items
POST /api/avatar/level-up      - Manual level up (testing)
POST /api/avatar/add-xp        - Add XP points
POST /api/avatar/toggle-accessory - Toggle accessory on/off
POST /api/avatar/set-animation - Set current animation
POST /api/avatar/update-streak - Update daily streak
POST /api/avatar/set-base-model - Set Ready Player Me URL
```

#### Data Schema

```javascript
User Avatar {
  userId: ObjectId,
  level: Number,
  xp: Number,
  xpToNextLevel: Number,
  streak: Number,
  baseModel: String, // GLB URL from Ready Player Me
  accessories: {
    shoes: { unlocked: Boolean, modelUrl: String, equipped: Boolean },
    jacket: { unlocked: Boolean, modelUrl: String, equipped: Boolean },
    glasses: { unlocked: Boolean, modelUrl: String, equipped: Boolean }
  },
  animations: {
    idle: { url: String, unlocked: Boolean },
    celebrate: { url: String, unlocked: Boolean }
  },
  currentAnimation: "idle" | "celebrate",
  customization: {
    skinTone: String,
    hairColor: String,
    eyeColor: String
  }
}
```

### Frontend (React + React Three Fiber)

#### Files Created:
- `front-end/src/components/Avatar3D.jsx` - 3D avatar renderer
- `front-end/src/components/AvatarProfileCard.jsx` - Profile card with avatar
- `front-end/src/components/LevelUpCelebration.jsx` - Level-up celebration modal
- `front-end/src/hooks/useAvatar.js` - Custom hook for avatar state
- `front-end/src/services/avatarService.js` - API service

#### Dependencies Added:
```bash
npm install three @react-three/fiber@8 @react-three/drei@9 --legacy-peer-deps
```

## Usage

### Adding XP from Anywhere in the App

```javascript
import { awardXP, XP_REWARDS } from '@/services/avatarService';

// Award XP for completing an assessment
await awardXP('COMPLETE_ASSESSMENT'); // 50 XP

// Award XP with custom amount
await awardXP('CUSTOM', 75);
```

### XP Reward Constants

```javascript
XP_REWARDS = {
  COMPLETE_ASSESSMENT: 50,
  ASSESSMENT_HIGH_SCORE: 25,
  COMPLETE_LESSON: 20,
  COMPLETE_MODULE: 50,
  COMPLETE_COURSE: 200,
  DAILY_LOGIN: 10,
  STREAK_BONUS_7_DAYS: 50,
  STREAK_BONUS_30_DAYS: 200,
  CREATE_POST: 15,
  HELPFUL_REPLY: 10,
  CREATE_VISION_BOARD: 30,
  COMPLETE_PROFILE: 50,
  UPLOAD_AVATAR: 25
}
```

### Using the Avatar Hook

```javascript
import useAvatar from '@/hooks/useAvatar';

const MyComponent = () => {
  const {
    avatarData,
    loading,
    celebrating,
    newUnlock,
    addXP,
    levelUp,
    toggleAccessory,
    triggerCelebration
  } = useAvatar();

  return (
    <div>
      <p>Level: {avatarData?.level}</p>
      <p>XP: {avatarData?.xp} / {avatarData?.xpToNextLevel}</p>
      <button onClick={() => addXP(50, 'bonus')}>Add XP</button>
    </div>
  );
};
```

### Rendering the 3D Avatar

```javascript
import Avatar3D from '@/components/Avatar3D';

<Avatar3D
  avatarData={avatarData}
  showControls={true}      // Allow orbit controls
  showLevelIndicator={true} // Show floating level badge
  autoRotate={true}        // Enable auto-rotation
  celebrating={false}      // Trigger celebration animation
/>
```

## Ready Player Me Integration

### Setting Up a Custom Avatar

1. User creates avatar at [Ready Player Me](https://readyplayer.me/)
2. Copy the GLB URL (e.g., `https://models.readyplayer.me/xxx.glb`)
3. Call the API to save:

```javascript
await avatarService.setBaseModel('https://models.readyplayer.me/xxx.glb');
```

### Hosting Custom Accessories

1. Create GLB files for shoes, jacket, glasses using Blender or other 3D software
2. Upload to Cloudinary or AWS S3
3. Update the default URLs in `avatarController.js`:

```javascript
const DEFAULT_ASSETS = {
  accessories: {
    shoes: 'https://your-cdn.com/shoes.glb',
    jacket: 'https://your-cdn.com/jacket.glb',
    glasses: 'https://your-cdn.com/glasses.glb'
  }
};
```

## Mixamo Animations

1. Go to [Mixamo](https://www.mixamo.com/)
2. Download animations in FBX format
3. Convert to GLB using [gltf.report](https://gltf.report/) or Blender
4. Host and configure URLs in the avatar system

## Rendering Flow

```
1. User logs in
   ↓
2. Avatar data fetched from backend
   ↓
3. Check for GLB model URL
   ├── Has GLB → Load 3D model from Ready Player Me
   └── No GLB → Use procedural avatar (geometric shapes)
   ↓
4. Apply unlocked accessories based on level
   ↓
5. Apply Mixamo animation
   ↓
6. User earns XP → Check for level up
   ↓
7. Level up → Unlock new item → Show celebration
   ↓
8. Re-render avatar with new unlocks
```

## Future Enhancements

- [ ] More accessory slots (hats, backpacks, watches)
- [ ] Color customization for accessories
- [ ] More animations (wave, dance, study)
- [ ] Achievement-based unlocks
- [ ] Premium/special items
- [ ] Avatar customization editor
- [ ] Social features (show friends' avatars)

## Troubleshooting

### 3D Avatar Not Loading
- Check browser WebGL support
- Ensure GLB URL is valid and CORS-enabled
- Check console for Three.js errors

### Level Not Updating
- Verify JWT token is valid
- Check MongoDB connection
- Ensure avatar document exists for user

### Accessories Not Showing
- Verify accessory is unlocked AND equipped
- Check GLB URLs are accessible
- Ensure proper bone/attachment setup in 3D models
