<!-- converted from community_requirements.docx -->

Community Feature – Requirements (Role-Based Announcements)
# 1. Overview
The Community module is a centralized communication system that allows different user roles to post and view announcements.

There are three user roles:
- SMAART Admin (Super Admin)
- College Admin
- Student

The feature enables targeted and role-based announcements across the platform.
# 2. User Roles & Permissions
SMAART Admin:
- Create announcements
- Target: All students, all colleges, specific colleges
- View all announcements
- Edit/Delete any announcement
- Pin important announcements

College Admin:
- Create announcements for their own college students
- View their announcements and SMAART Admin announcements
- Cannot edit/delete SMAART Admin posts

Students:
- View announcements from SMAART Admin and College Admin
- No posting rights
# 3. Announcement Details
Each announcement should include:
- Title
- Description (rich text)
- Attachments (PDF, image, link)
- Target audience
- Created by
- Timestamp
- Expiry date (optional)
# 4. Targeting Logic
SMAART Admin (Global): Visible to all students and college admins
SMAART Admin (Specific Colleges): Visible to selected colleges
College Admin: Visible to their students and SMAART Admin
# 5. Functional Requirements
Create Announcement:
- Role-based access
- Target selection
- Mandatory title

View Announcements:
- Feed-style listing
- Filters (role, date)
- Search

Notifications:
- In-app notifications for new announcements

Edit/Delete:
- SMAART Admin: all posts
- College Admin: own posts only

Pinning:
- SMAART Admin can pin announcements
# 6. UI Requirements
- Announcements feed
- Create announcement button
- Filters (role, college, date)
# 7. Audit & Tracking
- Track creator and timestamp
# 8. Enhancements
- Likes/Reactions
- Polls
- Analytics
# 9. Edge Cases
- College Admin cannot post to other colleges
- Students see only relevant announcements
- Deleted announcements removed
- Expired announcements archived
# 10. Data Model (High-Level)
Fields:
- id
- title
- description
- created_by_role
- created_by_id
- target_type
- target_ids
- created_at
- expiry_date
- is_pinned