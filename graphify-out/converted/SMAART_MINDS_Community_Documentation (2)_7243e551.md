<!-- converted from SMAART_MINDS_Community_Documentation (2).docx -->






SMAART MINDS
Craft Your Career
COMMUNITY MODULE
Feature Documentation & Complete User Flow Guide





# 1.  Overview & Purpose
The Community module is a core engagement hub built into the SMAART MINDS student dashboard. It is designed to foster peer-to-peer learning, emotional wellness, mentorship connections, and collaborative group work — all within a single, unified interface.

The module is accessible via the left sidebar under the COMMUNITY section and lives at the route /dashboard/community. It supports three distinct communication channels — each with its own purpose, audience, and behaviour — ensuring that conversations are routed to the right people and handled with the right safeguards.


## Key Objectives of the Community Module
- Enable open, topic-based discussions among all enrolled students.
- Provide a safe, AI-moderated emotional support space for student wellbeing.
- Route academic and career queries directly to assigned mentors and coaches.
- Allow students to self-organise into study or interest groups.
- Reward active participation through a Quality Score (QS) and contributor leaderboard.
- Maintain notifications for all community activity in one place.

# 2.  Accessing the Community Module
The Community module can be accessed in two ways:

Method 1 — Left Sidebar Navigation
The left-hand sidebar of the SMAART MINDS dashboard is divided into sections: MAIN MENU, SKILLS & GROWTH, and COMMUNITY. Under the COMMUNITY section, students will find:
- Notifications — with a red badge indicating the unread count.
- Dark Mode toggle.
- The Community page itself is reached by clicking the breadcrumb link or navigating to /dashboard/community.

Method 2 — Direct URL
- Community page: localhost:8081/dashboard/community
- Student Groups page: localhost:8081/dashboard/groups


# 3.  Community Page Layout & Navigation
The Community page uses a two-column layout: a wide main content area on the left and a contextual sidebar on the right. The header and channel tabs remain persistent as the student scrolls.

## 3.1  Top Header Bar
Displayed at the very top of the community content area, the header bar contains:
- Breadcrumb navigation: Dashboard > Community
- Page title: Community (large, bold text).
- Live clock displaying the current local time (e.g., 07:31 PM).
- Greeting message: Good Evening, Rahul — personalised to the logged-in student.
- Settings gear icon — for community or account settings.
- Notification bell icon — with an orange/red badge when unread notifications exist.
- User avatar thumbnail — showing the student's profile picture.

## 3.2  Search Bar
A full-width search input is positioned prominently below the header. It allows students to search across all community content without switching channels.
- Placeholder text: Search discussions, categories, or content...
- Applies to all three channels — Discussion, Support, and Mentor.
- Results appear filtered by keyword across post titles, content, and categories.

## 3.3  Channel Tabs & Descriptions
Three horizontally-arranged tabs appear below the search bar. Each tab activates a distinct channel. The currently active tab is filled with a dark background and white text. Inactive tabs appear with a light background and grey icons/text.


Each channel also shows a brief tooltip or description on the right side of the tabs row:
- Discussion: "Discussion channel is for general community conversations and peer help."
- Support: "Support channel runs Emotion Coach, safer responses, and pings staff for distressed posts."
- Mentor: "Ask your mentors and coaches directly. Posts here are visible to all mentors assigned to your college."

## 3.4  Statistics Bar
Immediately below the channel tabs, four live community statistics are shown as cards in a horizontal row:



# 4.  Discussion Channel (General)
## 4.1  Channel Description
The Discussion channel is the default landing tab when a student visits the Community page. It is an open forum for all enrolled students to post questions, share motivational content, start conversations, and engage with peers. There is no AI routing or special staff alerting in this channel — it is purely peer-driven.

## 4.2  Post Feed — Discussion List
The main content area below the Start a Discussion button displays the post feed. The feed can be filtered using three tabs:
- Discussions — shows all community posts (default).
- My Posts — shows only posts created by the logged-in student.
- Bookmarks — shows posts the student has bookmarked.

The feed can be sorted using two toggles in the top-right of the feed area:
- NEWEST — shows the most recently created posts first (default active state, dark button).
- POPULAR — shows posts ranked by engagement score and reactions.

## 4.3  Post Card Anatomy
Every post in the feed is displayed as a card. Below is a detailed breakdown of every element on a post card:


## 4.4  Pinned Posts & QS Score
Pinned Posts
Administrators can pin a post to keep it at the top of the Discussion feed regardless of sort order. Pinned posts display a PINNED badge alongside the category and QS badges. Example: the post 'Retro Cars on Trend' by Kumar (3/28/2026) shows GENERAL | PINNED | QS 1.00.

Quality Score (QS)
Every post has a QS (Quality Score) value displayed as a badge on the card header. The score is a floating-point number (e.g., 0.00, 1.00) and reflects the combined engagement and quality of the post. Higher QS scores influence ranking in the POPULAR sort view and contribute to the Top Contributors leaderboard.

## 4.5  User Flow — Browsing Discussions
Step 1:  Open Community — Student clicks Community in the left sidebar. The Discussion (General) tab is active by default.
Step 2:  View Statistics — Student sees Members (21), Discussions (17), Groups (4), Active Today (0) in the stats bar.
Step 3:  Browse Feed — Student scrolls the post feed showing the newest posts first. Each card shows category, QS, title, author, timestamp, preview, and engagement counts.
Step 4:  Filter Feed — Student can click 'My Posts' to see only their own posts, or 'Bookmarks' to see saved posts.
Step 5:  Sort Posts — Student clicks POPULAR to re-sort the feed by engagement and QS score, or stays on NEWEST.
Step 6:  Open a Post — Student clicks the chevron (>) or the post title to open the full post detail view.
Step 7:  Engage — Student upvotes, hearts, bookmarks, shares, or subscribes to notifications on any post directly from the card.

# 5.  Creating a New Discussion Post
Any student can create a new discussion post by clicking the + Start a Discussion button. This is a full-width dark call-to-action button displayed prominently above the post feed, present in all three channels.

## 5.1  New Discussion Modal — All Fields
Clicking + Start a Discussion opens a centred modal overlay titled '+ New Discussion'. The modal contains the following fields and controls:


## 5.2  Category Dropdown — All Options
The CATEGORY dropdown in the New Discussion modal offers the following seven options, each with a distinct icon:


## 5.3  Poll Feature — Full Detail
When the student clicks ADD POLL in the New Discussion modal, a CREATE A POLL section expands below the Rich Content area. The poll section contains the following fields:



## 5.4  Channel Locking Behaviour
When the student is on the Mentor channel and clicks Start a Discussion, the Channel field in the modal shows 'Mentor (locked)'. A tooltip below reads:


This ensures the post is routed exclusively to mentors and cannot accidentally be submitted to the general or support channels.

## 5.5  User Flow — Creating a New Discussion Post
Step 1:  Navigate to Community — Student opens the Community page from the left sidebar.
Step 2:  Select Channel — Student clicks the desired channel tab — Discussion, Support, or Mentor.
Step 3:  Click Start a Discussion — Student clicks the full-width '+  Start a Discussion' button above the feed.
Step 4:  Modal Opens — The New Discussion modal appears. Channel is pre-set based on the active tab.
Step 5:  Enter Post Title — Student types a title in the POST TITLE field (e.g., 'Need advice on my internship').
Step 6:  Select Category — Student opens the CATEGORY dropdown and selects from: General Discussion, Career Growth, Study Resources, Exam Prep, Skill Building, Motivation, or Other.
Step 7:  Verify Channel — Student confirms the CHANNEL field shows the correct channel. If in Mentor tab, the channel shows as 'Mentor (locked)'.
Step 8:  Write Content — Student types the full post content in the RICH CONTENT area.
Step 9:  Add Poll (Optional) — Student clicks ADD POLL if they want to attach a community poll. Fields appear: Poll Question, Option 1, Option 2, + Add another option, Ending Date (Optional).
Step 10:  Attach Media (Optional) — Student attaches an image or media file using the MEDIA ATTACHMENT field.
Step 11:  Publish — Student clicks PUBLISH DISCUSSION (dark button with send icon). The post is submitted, the modal closes, and the new post appears in the feed.


# 6.  Support Channel (Emotion Coach)
## 6.1  Channel Description & Purpose
The Support channel is a dedicated emotional wellness space within the SMAART MINDS community. It is designed to provide students with a safe, non-judgmental environment to express how they are feeling. Unlike the general Discussion channel, the Support channel has two key safety mechanisms:
- An AI-powered Emotion Coach that responds with calm, constructive suggestions.
- Automated staff alerts triggered if a post contains distressed or crisis-related language.


## 6.2  Emotion Coach AI Panel
When the Support channel is active, the right sidebar transforms to display the Emotion Coach panel. This is a persistent chat interface with a clear header section.


## 6.3  User Flow — Using the Emotion Coach
Step 1:  Navigate to Support Channel — Student clicks the 'Support / EMOTION COACH' tab in the channel selector.
Step 2:  Panel Activates — The right sidebar transforms to show the Emotion Coach panel with the personalised greeting message.
Step 3:  Read Greeting — Student reads: 'Hi [Name], I'm your Emotion Coach. Share what's on your mind and I'll suggest calm next steps.'
Step 4:  Type a Message — Student clicks the input field (placeholder: 'Type how you're feeling...') and types how they are feeling or what is bothering them.
Step 5:  Send Message — Student clicks the circular send button (paper plane icon) to submit their message.
Step 6:  Receive Response — The Emotion Coach AI analyses the input and replies with calm, constructive guidance — suggesting next steps, breathing exercises, or who to speak to.
Step 7:  Staff Alert (If Needed) — If the message contains distress signals or crisis language, the system automatically pings staff members in addition to the AI response.
Step 8:  Post to Channel (Optional) — The student may also click '+ Start a Discussion' to post publicly in the Support channel. This post is visible to peers and subject to the same safety monitoring.

## 6.4  Safety Design Principles
- All Emotion Coach responses are AI-generated and do not replace professional mental health support.
- The panel is clearly labelled 'SAFE SPACE — NOT MEDICAL ADVICE' at all times.
- Distressed post detection runs automatically on all Support channel content.
- Staff are pinged silently when distress is detected — the student does not need to take any action.
- The channel is separate from Discussion to prevent distressed posts from appearing in general feeds.

# 7.  Mentor Channel (Mentors & Coaches)
## 7.1  Channel Description
The Mentor channel is the dedicated route for students to communicate directly with their assigned mentors and coaches. Posts created in this channel are visible to all mentors assigned to the student's college — ensuring the question reaches the right person regardless of which specific mentor is online.

When the Mentor tab is active, a green-tinted info banner appears on the right side of the channel tabs row:


This channel is ideal for:
- Academic and career guidance questions.
- Seeking feedback on assignments or projects.
- Requesting mentorship on skill development.
- Escalating concerns that need professional attention.

## 7.2  User Flow — Posting to the Mentor Channel
Step 1:  Open Mentor Channel — Student clicks the 'Mentor / MENTORS & COACHES' tab. The info notice appears: 'Ask your mentors and coaches directly...'
Step 2:  Review Notice — Student reads the channel notice to confirm this post will go to all mentors.
Step 3:  Click Start a Discussion — Student clicks '+ Start a Discussion'.
Step 4:  Channel Locked — The New Discussion modal opens. The CHANNEL field shows 'Mentor (locked)'. The channel cannot be changed from within the modal.
Step 5:  Fill in Post Title — Student enters their question or topic in the POST TITLE field.
Step 6:  Select Category — Student selects the most relevant category from the dropdown.
Step 7:  Write Full Content — Student provides full context in the RICH CONTENT area — the more detail provided, the better the mentor can assist.
Step 8:  Publish — Student clicks PUBLISH DISCUSSION. The post is routed to all assigned mentors and appears in the Mentor channel feed.
Step 9:  Await Response — Mentors and coaches can see and respond to the post. The student receives a notification when a mentor replies.

# 8.  Student Groups
The Student Groups feature allows students to create, manage, and join interest-based or study-focused groups within SMAART MINDS. Groups are accessible via a dedicated page at /dashboard/groups, and are also surfaced through the My Groups sidebar widget on the Community page.

## 8.1  My Student Groups Page
The Student Groups page (/dashboard/groups) has the following layout:
- Page title: Student Groups (in the browser breadcrumb area).
- Section heading: My Student Groups.
- Subtitle: Connect and collaborate with your university peers.
- A '+ Create Group' button in the top-right corner (dark, rounded).
- Below the header, the student's existing groups are shown as cards in a grid layout.

## 8.2  Group Card Elements
Each group card on the Student Groups page displays the following:


## 8.3  Create Group Modal — All Fields
Clicking '+ Create Group' on either the Student Groups page or the My Groups sidebar widget opens the Create Group modal. It contains the following fields:


## 8.4  User Flow — Creating a Student Group
Step 1:  Access Groups Page — Student navigates to /dashboard/groups or clicks 'View My Groups' in the Community sidebar widget.
Step 2:  Click Create Group — Student clicks the '+ Create Group' button (top-right of page) or the 'Create Group' button in the sidebar widget.
Step 3:  Modal Opens — The Create Group modal appears over the page.
Step 4:  Enter Group Name — Student types the group name in the Group Name field (e.g., 'CS Study Group').
Step 5:  Add Description (Optional) — Student types a description explaining the group's purpose.
Step 6:  Choose Icon — Student clicks one of the 6 available icons to represent the group.
Step 7:  Choose Colour — Student selects one of the 6 colour swatches for the group icon background.
Step 8:  Submit — Student clicks 'Create Group'. The modal closes, the group is created, and it appears on the Student Groups page with an Admin badge.
Step 9:  Open Group — Student clicks 'Open' on the group card to access the group's dedicated collaborative space.

## 8.5  My Groups Sidebar Widget
On the Community page (Discussion and Mentor channels), the right sidebar displays the My Groups widget, which provides a quick overview of the student's group memberships without leaving the community page.
- Header: My Groups
- Each group is listed with its coloured icon, name, and member count. Example: 'friends forever — 2 members'.
- 'View My Groups' button — navigates to /dashboard/groups.
- 'Create Group' button — opens the Create Group modal directly.

## 8.6  Group Chat — Collaboration Space
When a student clicks the 'Open' button on any group card, they are taken into the group's dedicated real-time collaboration space. This is a full chat interface accessible at a unique route per group — for example: localhost:8080/dashboard/groups/69cfb3e8de3fc9c875c61ee8.

Group Chat Page Layout
The Group Chat page replaces the groups grid and presents a messenger-style interface with the following layout elements:


Chat Message Types
The group chat supports the following message interactions observed in the platform:
- Text messages — standard typed messages sent by any group member.
- Emoji reactions — members can react to any message with an emoji (e.g., heart/love reaction shown with a count badge).
- Media sharing — image/media files can be shared within the group (accessible via the media icon in the toolbar).

Message Bubble Design
The chat interface uses a clear visual distinction between sent and received messages:


Example Chat Observed
From the documented session of the group 'friends forever' (2 members: Rahul and Kumar), the following messages were visible in the chat feed:


## 8.7  User Flow — Opening and Using Group Chat
Step 1:  Navigate to Groups Page — Student goes to /dashboard/groups or clicks 'View My Groups' in the Community sidebar widget.
Step 2:  Locate Group Card — Student finds the desired group card (e.g., 'friends forever — 2 members').
Step 3:  Click Open — Student clicks the blue 'Open' button on the group card.
Step 4:  Group Chat Loads — The Group Chat page loads at /dashboard/groups/{group-id}. The group header shows the group name, member count, online indicator, and toolbar icons.
Step 5:  View Chat History — Student scrolls up through the message feed to read previous messages. Sent messages appear on the right in dark navy bubbles; received messages appear on the left in grey bubbles with the sender's name.
Step 6:  Send a Message — Student types a message in the input field at the bottom of the chat and sends it. The message appears instantly on the right side of the feed.
Step 7:  React to a Message — Student hovers over or long-presses a received message and selects an emoji reaction. The reaction appears below the message with a count.
Step 8:  Search Messages — Student clicks the search icon (top-right toolbar) to search for a specific message or keyword within the group chat.
Step 9:  View Members — Student clicks the people icon in the toolbar to see all group members.
Step 10:  Leave Group — Student clicks the exit icon in the toolbar to leave the group. This removes the student from the group and they will no longer receive messages.
Step 11:  Go Back — Student clicks the '< Back' button to return to the Student Groups page (/dashboard/groups).


# 9.  Engagement & Gamification System
SMAART MINDS includes a lightweight but meaningful gamification layer within the Community module to encourage active participation and reward quality contributions.

## 9.1  Quality Score (QS)
Every discussion post is assigned a Quality Score (QS) value, displayed as a badge on the post card header. The QS reflects the combined quality and engagement value of the post.
- Displayed as a rounded badge (e.g., QS 1.00, QS 0.00).
- Posts with higher QS scores rank higher in POPULAR sort view.
- QS is dynamically calculated based on upvotes, hearts, comments, and view engagement.
- A QS of 0.00 means the post has not yet received engagement.
- A pinned post by default may carry a higher QS (e.g., QS 1.00 for admin-pinned content).

## 9.2  Post Engagement Actions
Every post card includes a full action bar at the bottom. Here is a complete breakdown of each action:


## 9.3  Top Contributors & Leaderboard
The Top Contributors widget appears in the right sidebar on the Discussion channel. It shows a ranked leaderboard of students who have contributed the most to the community.
- Header: Top Contributors
- Shows ranked student names, avatars, and contribution metrics.
- When no contributions exist yet, displays: 'No contributors yet'.
- A student's rank is determined by their combined QS scores, post count, and engagement received.
- Top contributors are featured prominently to recognise and motivate active members.

## 9.4  Community Tip Widget
A Community Tip widget is displayed in the sidebar below the Top Contributors section:


This tip rotates or is updated periodically to guide students on how to maximise their community engagement.

# 10.  Sidebar Widgets — Full Detail
The right-hand sidebar of the Community page is contextual — its content changes based on the active channel. Below is a complete reference of all sidebar states:


# 11.  Notifications System
The Notifications system keeps students informed about all community activity relevant to them. It is accessible from two places:
- Left sidebar under COMMUNITY > Notifications (with a red badge showing the unread count).
- The notification bell icon in the top header bar of the Community page (with an orange badge).

Notification Triggers
Notifications are generated for the following events:
- A student replies to a post the user created.
- A student upvotes or hearts the user's post.
- A mentor responds to a post in the Mentor channel.
- A student comments on a post the user has subscribed to (via the bell icon on the post).
- Group activity — new members joining a group the user admins or belongs to.
- Staff alerts triggered by distress detection in the Support channel (visible to staff, not the student).

Notification Badge
- The Notifications sidebar item shows a red circular badge with the unread count (e.g., 1).
- The header bell icon shows an orange/amber badge with the count.
- Clicking either clears or opens the notification list.

# 12.  Dark Mode
SMAART MINDS includes a Dark Mode toggle accessible from the left sidebar, listed under COMMUNITY as the last item. Dark Mode applies a dark theme across the entire platform — including the Community module — reducing eye strain during low-light usage.
- Toggle label: Dark Mode (with a crescent moon icon).
- Applies platform-wide — all pages including Community, Groups, Courses, etc.
- State is remembered per user session.

# 13.  Complete End-to-End User Flows
This section documents the full journey of a student — from logging in to completing key community actions. Each flow represents a realistic scenario based on the documented platform features.

## Flow A — First-Time Community Visit
Scenario: A student logs in for the first time and explores the Community module.

Step 1:  Login — Student logs into SMAART MINDS at localhost:8081. They are taken to the Dashboard Home page. Greeting shown: 'Good Evening, Rahul'.
Step 2:  Navigate to Community — Student clicks 'Community' from the left sidebar under the COMMUNITY section.
Step 3:  Page Loads — Community page loads at /dashboard/community. Default channel: Discussion (General). Statistics bar shows: 21 Members, 17 Discussions, 4 Groups, 0 Active Today.
Step 4:  Explore Feed — Student sees the post feed. A PINNED post 'Retro Cars on Trend' by Kumar (QS 1.00) is at the top. Other posts include 'HELLO' by Rahul and 'fixing' by Kumar.
Step 5:  Check My Groups — Student sees the My Groups sidebar widget showing 'friends forever — 2 members'.
Step 6:  View Other Channels — Student clicks Support tab — Emotion Coach panel appears. Student clicks Mentor tab — green notice appears.
Step 7:  Return to Discussion — Student clicks Discussion tab and returns to the general feed.

## Flow B — Posting a Motivational Discussion
Scenario: A student wants to share a motivational post with the community.

Step 1:  Click Start a Discussion — From the Discussion channel, student clicks '+ Start a Discussion'.
Step 2:  Fill Title — Student types: 'Stay Calm and Motivated'.
Step 3:  Select Category — Student selects 'Motivation' from the CATEGORY dropdown.
Step 4:  Add Image Content — Student adds a motivational poster image in the RICH CONTENT area or via the MEDIA ATTACHMENT field.
Step 5:  Publish — Student clicks PUBLISH DISCUSSION. Post appears in the feed tagged MOTIVATION | QS 0.00.
Step 6:  Engagement — Other students can now upvote, heart, comment, or bookmark the post. QS score rises with engagement.

## Flow C — Seeking Emotional Support
Scenario: A student is feeling overwhelmed and wants to reach out for emotional support.

Step 1:  Open Support Channel — Student clicks the 'Support / EMOTION COACH' tab.
Step 2:  Emotion Coach Appears — Right sidebar shows the Emotion Coach panel: 'Hi Rahul, I'm your Emotion Coach. Share what's on your mind and I'll suggest calm next steps.'
Step 3:  Type Feelings — Student types in the input field: 'I'm feeling overwhelmed with my assignments and don't know where to start.'
Step 4:  Send — Student clicks the send button (paper plane icon).
Step 5:  AI Responds — Emotion Coach AI replies with a calm, structured response — perhaps suggesting breaking tasks into small steps, taking a break, or speaking to a mentor.
Step 6:  Staff Alert (If Needed) — If the message contains distress signals, staff are automatically pinged in the background.

## Flow D — Asking a Mentor for Help
Scenario: A student needs career guidance and wants to post a question directly to their mentors.

Step 1:  Open Mentor Channel — Student clicks the 'Mentor / MENTORS & COACHES' tab. Green notice appears.
Step 2:  Start Discussion — Student clicks '+ Start a Discussion'.
Step 3:  Channel Locked — Modal shows: CHANNEL = 'Mentor (locked)'. Tooltip: 'Your question will be visible to all mentors and coaches'.
Step 4:  Enter Question — Student types: 'How do I prepare for my upcoming campus placement interview?'
Step 5:  Add Details — Student adds context in the RICH CONTENT area — year, company, domain, etc.
Step 6:  Publish — Student clicks PUBLISH DISCUSSION. Post is routed to all mentors.
Step 7:  Notification — Student receives a notification when a mentor replies to the post.

## Flow E — Creating and Joining a Student Group
Scenario: A student wants to form a study group for data science peers.

Step 1:  Open Groups Page — Student clicks 'View My Groups' in the sidebar widget or navigates to /dashboard/groups.
Step 2:  Click Create Group — Student clicks '+ Create Group'.
Step 3:  Name the Group — Student enters: 'Data Science Study Circle'.
Step 4:  Add Description — Student types: 'For students interested in ML, AI, and data analytics'.
Step 5:  Pick Icon — Student selects the Lightning icon.
Step 6:  Pick Colour — Student selects Purple.
Step 7:  Create — Student clicks 'Create Group'. Group card appears with Admin badge, purple lightning icon, and '1 member'.
Step 8:  Invite Members — Student shares the group with peers. Members join, count increases.
Step 9:  Open Group Chat — Student clicks 'Open' to enter the Group Chat space. The messenger interface loads showing the chat history, member count, and toolbar.
Step 10:  Start Chatting — Student types a message in the input field and sends it. It appears as a dark navy bubble on the right. Peers' replies appear as grey bubbles on the left with their name above.

# 14.  Feature Summary Reference Table
A complete reference of all Community module features, their location, and key behaviour:



# 15.  Conclusion
The SMAART MINDS Community module is a thoughtfully designed, multi-layered engagement platform that goes far beyond a simple discussion forum. It integrates peer collaboration, emotional wellness support, mentorship routing, group management, and real-time group chat into a single, cohesive interface — all underpinned by a gamification system that rewards genuine participation and quality contributions.

This documentation has covered every aspect of the Community module in full detail — from the page layout and channel architecture to the precise field-level breakdown of every modal, widget, and user flow. The three-channel model (Discussion, Support, and Mentor) ensures that conversations are always routed appropriately: open discussions stay visible to peers, sensitive emotional content is handled safely by the Emotion Coach AI with staff oversight, and academic or career queries reach the right mentors without delay.

The Student Groups feature empowers students to self-organise around shared goals, with each group providing a dedicated real-time Group Chat space where members can send messages, react with emojis, share media, and collaborate freely. The Quality Score system and Top Contributors leaderboard create healthy incentives for meaningful engagement. The notification system ensures no important reply or update goes unnoticed, and Dark Mode reflects the platform's commitment to user comfort across all environments.

## Key Takeaways
- Three dedicated channels — Discussion, Support, and Mentor — each serve a distinct, carefully considered purpose.
- The Emotion Coach AI provides immediate, safe, and clearly-labelled emotional support with built-in staff escalation.
- The New Discussion modal is feature-rich yet intuitive, supporting categories, polls, rich content, and media attachments.
- The Quality Score (QS) system drives post quality and surfaces the best content through the Popular sort and leaderboard.
- Student Groups allow self-directed community building with a dedicated real-time Group Chat space per group.
- Group Chat supports text messaging, emoji reactions, media sharing, member management, and message search — all within a clean messenger-style interface.
- The platform is designed with student wellbeing, safety, and engagement as its core priorities at every touchpoint.



End of Document  —  SMAART MINDS Community Module Feature Documentation
Documented by Dharsini J  |  April 2026  |  Confidential
| Documented By
Dharsini J | Version
1.0 — April 2026 |
| --- | --- |
| Platform
localhost:8081 / Student Dashboard | Module
Community — All Sub-Features |
| INFO: Platform: SMAART MINDS — Craft Your Career
URL: localhost:8081/dashboard/community
Module: Community (Discussion, Support, Mentor)
User Documented: Rahul (Student Role) |
| --- |
| INFO: After login, students land on the Dashboard Home. They click Community in the breadcrumb or sidebar to reach the Community page. The default channel shown is Discussion (General). |
| --- |
| Tab Name | Icon / Label | Channel Purpose & Behaviour |
| --- | --- | --- |
| Discussion | GENERAL | Default open channel. Peer-to-peer discussions, questions, motivational posts, and general community content. No special AI or routing. |
| Support | EMOTION COACH | Activates the Emotion Coach AI panel on the right sidebar. Posts here trigger safer AI responses and alert staff if distress is detected. |
| Mentor | MENTORS & COACHES | Routes all posts to mentors and coaches assigned to the student's college. All mentors can see and respond to posts in this channel. |
| Members | Discussions | Groups | Active Today |
| --- | --- | --- | --- |
| 21 — Total enrolled community members | 17 — Total discussion posts created | 4 — Total student groups formed | 0 — Members active right now |
| INFO: These statistics update in real time and reflect counts across all three channels combined. |
| --- |
| Element | Description & Behaviour |
| --- | --- |
| Category Badge | A pill-shaped tag at the top-left of the card showing the post category. Examples: GENERAL (grey), MOTIVATION (teal/green). Helps users scan by topic. |
| PINNED Badge | A badge shown on posts that an admin has pinned. Pinned posts appear at the top of the feed regardless of sort order. |
| QS Badge | Quality Score badge (e.g., QS 1.00 or QS 0.00). Reflects the quality and value of the post based on engagement. Shown in a rounded chip. |
| Chevron Arrow (>) | Appears on the top-right of each card. Clicking navigates to the full post detail view. |
| Post Title | Large, bold text. The headline of the discussion post. Examples: 'Retro Cars on Trend', 'HELLO', 'fixing'. |
| Author Avatar & Name | Small circular avatar with first-letter initial or photo. Followed by the author's display name (e.g., Kumar, Rahul). |
| Timestamp | Relative time shown next to author name. Example: '20m ago', '3/16/2026', '3/28/2026'. |
| Post Body / Preview | Short text preview of the post content. Example: 'STAY CALM AND MOTIVATED', 'my problems'. |
| Inline Image | If the post includes an image (e.g., motivational poster), it is rendered inline below the text preview. Full width of the card. |
| Upvote | Thumbs-up icon with count. Clicking upvotes the post. Count increments in real time. |
| Downvote | Thumbs-down icon with count. Clicking downvotes the post. |
| Heart | Love/favourite reaction with count. Separate from upvote — allows emotional appreciation. |
| Comment | Speech bubble icon with comment count. Clicking opens the post for replies. |
| Bookmark | Bookmark icon. Saves the post to the student's Bookmarks tab. Toggles on/off. |
| Share | Share icon. Copies or provides a shareable link to the post. |
| Bell | Subscribe icon. Enables push/bell notification for new comments on that post. |
| Field | Input Type | Detail & Behaviour |
| --- | --- | --- |
| POST TITLE | Short text input | Placeholder: 'What's on your mind?' — The headline of the discussion. Required field. |
| CATEGORY | Dropdown selector | Default: General Discussion. Seven options available (see Section 5.2). Selecting a category tags the post with a coloured badge. |
| CHANNEL | Channel selector (may be locked) | Shows the active channel. Pre-set based on which tab the student is on. If opened from Mentor tab, displays 'Mentor (locked)' and cannot be changed. |
| RICH CONTENT | Large multi-line text area | Placeholder: 'Go ahead, share your story or ask a question...' — Full post body. Supports rich text formatting. |
| ADD POLL / REMOVE POLL | Toggle button (top-right of content area) | Clicking ADD POLL expands the poll creation section below the content area. Button changes to REMOVE POLL when active. |
| MEDIA ATTACHMENT | File upload area | Appears below the poll section. Allows student to attach an image or media file to the post. |
| CANCEL | Button (bottom-left) | Dismisses the modal without creating a post. No data is saved. |
| PUBLISH DISCUSSION | Primary CTA button (bottom-right) | Dark rounded button with a send icon. Submits the post to the selected channel. Greyed/disabled until the title field is filled. |
| Category | Description / Use Case |
| --- | --- |
| General Discussion (default) | For everyday community conversations, general questions, and topics that don't fit other categories. |
| Career Growth | For discussions about career development, job hunting, industry insights, and professional growth. |
| Study Resources | For sharing or requesting study materials, notes, links, and academic resources. |
| Exam Prep | For conversations related to upcoming exams, study strategies, and exam-specific questions. |
| Skill Building | For posts about learning new skills, tool recommendations, tutorials, and self-improvement. |
| Motivation | For motivational posts, inspirational content, and encouraging peers through challenges. |
| Other | For topics that do not fit into any of the above categories. |
| Field | Input Type | Detail & Behaviour |
| --- | --- | --- |
| Poll Question | Text input | Placeholder: 'Poll Question (e.g., Which framework do you prefer?)' — The main question the community will vote on. |
| Option 1 | Text input | First poll answer option. Required to create a valid poll. |
| Option 2 | Text input | Second poll answer option. Required to create a valid poll. |
| + Add another option | Link / button | Allows the student to add more answer options beyond the two defaults. Multiple additional options can be added. |
| Ending Date (Optional) | Date-time picker | Field format: dd-mm-yyyy --:-- . Allows the student to set an expiry date and time for the poll. If left blank, the poll remains open indefinitely. |
| NOTE: The poll section is revealed only after clicking ADD POLL. It does not appear by default.
Clicking REMOVE POLL collapses the poll section and discards any poll data entered.
Polls are attached to the discussion post and appear inline in the feed for other students to vote. |
| --- |
| MENTOR CHANNEL: Mentor Channel — Your question will be visible to all mentors and coaches. |
| --- |
| IMPORTANT: Pressing CANCEL at any time dismisses the modal without saving.
Posts submitted to the Mentor channel are immediately visible to all mentors assigned to the college.
Posts submitted to the Support channel trigger the Emotion Coach and staff alert systems.
The PUBLISH DISCUSSION button remains greyed/disabled until the POST TITLE field is filled. |
| --- |
| IMPORTANT: The Support channel is a SAFE SPACE — NOT a substitute for professional medical or psychological support.
All responses from the Emotion Coach are AI-generated and clearly labelled as such.
Staff are automatically notified when distress signals are detected in posts. |
| --- |
| Element | Description |
| --- | --- |
| Panel Header | Shows the EMOTION COACH label with a sparkle/star icon, followed by the subtitle: 'Here to support you'. |
| Greeting Message | Personalised opening message: 'Hi [Student Name], I'm your Emotion Coach. Share what's on your mind and I'll suggest calm next steps.' Displayed as a speech bubble. |
| Input Field | Text input at the bottom of the panel. Placeholder: 'Type how you're feeling...' Student types their message here. |
| Send Button | Circular send (paper plane) icon button to the right of the input. Submits the message to the Emotion Coach AI. |
| Footer Disclaimer | 'SAFE SPACE — NOT MEDICAL ADVICE.' displayed in small grey text below the input field. |
| MENTOR CHANNEL: Ask your mentors and coaches directly. Posts here are visible to all mentors assigned to your college. |
| --- |
| Element | Description |
| --- | --- |
| Group Icon | Large rounded-square icon using the colour and symbol chosen during group creation. Example: Blue square with a people/group icon. |
| Admin Badge | An 'Admin' badge shown in the top-right corner of the card if the logged-in student is the group admin/creator. |
| Group Name | Bold large text. The name given to the group during creation. Example: 'friends forever'. |
| Description | Short descriptive text below the name. If no description was provided during creation, shows: 'No description provided.' |
| Member Count | Shows the number of members in the group with a people icon. Example: '2 members'. |
| Open Button | A blue 'Open' link in the bottom-right of the card. Navigates the student into the group's dedicated space. |
| Field | Input Type | Detail & Options |
| --- | --- | --- |
| Group Name | Text input | Placeholder: 'e.g., CS Study Group'. Required. This becomes the displayed name of the group. |
| Description | Multi-line text area | Placeholder: 'What is this group about?' Optional. Shown on the group card as the subtitle. |
| Icon | Icon picker (6 options) | Six selectable icons: People (default), Book, Coffee/Mug, Badge/Award, Lightning/Bolt, Hash (#). Selected icon has a dark background. |
| Color | Colour swatch picker (6 options) | Six colour swatches: Blue (default), Green, Purple, Pink/Magenta, Orange, Teal. The selected colour is applied to the group icon background. |
| Create Group | Submit button | Full-width button at the bottom. Creates the group and closes the modal. Greyed out until the Group Name field is filled. |
| Close (x) | Icon button (top-right) | Dismisses the modal without creating a group. |
| Element | Description & Behaviour |
| --- | --- |
| Back Button | An arrow and 'Back' label in the top-left corner. Returns the student to the Student Groups page (/dashboard/groups). |
| Group Avatar | A large circular icon displaying the group's chosen colour and first letter of the group name. Example: Green circle with 'f' for 'friends forever'. A green dot overlay indicates the group is currently active. |
| Group Name | Bold large text next to the avatar. Displays the full group name (e.g., 'friends forever'). |
| Online Indicator | A green dot beside the group name confirms the group is active/online. |
| Member Count | Displayed below the group name as '2 MEMBERS •' — shows the total count of members in the group. |
| Search Icon | Magnifying glass icon in the top-right toolbar. Allows searching within the group chat messages. |
| Media/Image Icon | Image/gallery icon in the top-right toolbar. Allows viewing or sharing media files shared within the group. |
| Members Icon | People icon in the top-right toolbar. Opens the group member list. |
| Leave/Exit Icon | An exit/logout icon (arrow pointing out) in the top-right toolbar. Allows the student to leave the group. |
| Message Feed | The main body of the page displays all chat messages in chronological order. Sent messages appear on the right (dark navy bubble). Received messages appear on the left (light grey bubble with sender name above). |
| Sender Name | For messages received from other group members, the sender's name (e.g., KUMAR) is displayed in small bold text above their message bubble. |
| Timestamp | Each message shows its sent time beneath the bubble (e.g., 06:05 PM, 04:53 PM, 02:09 AM). |
| Message Reactions | Members can react to messages with emoji reactions. Reactions are displayed below the message bubble with a count (e.g., heart emoji with '1'). |
| Message Status Icon | A small icon (double tick or similar) appears beside the sender's message to indicate delivery or read status. |
| Message Type | Appearance | Position |
| --- | --- | --- |
| Sent (by logged-in student) | Dark navy / dark blue filled bubble with white text. | Right-aligned in the chat feed. |
| Received (from other members) | Light grey / white bubble with dark text. Sender name shown above in small bold caps. |
| Sender | Message | Bubble Style | Timestamp |
| --- | --- | --- | --- |
| Rahul (sent) | Hello Kumar | Dark navy — right side | 06:05 PM |
| Rahul (sent) | Hiii!! | Dark navy — right side | 04:53 PM |
| Kumar (received) | hii | Light grey — left side | 02:09 AM |
| Kumar (received) | how are you its been a long time brotha | Light grey — left side | 02:09 AM |
| Kumar (received) | hey  (with heart reaction x1) | Light grey — left side with emoji reaction | 02:09 AM |
| NOTE: The Group Chat route is unique per group — format: /dashboard/groups/{group-id}.
The group URL shown in the platform uses an 8080 port (localhost:8080) for the group chat space, separate from the main dashboard at 8081.
Messages are displayed in real-time for all group members currently active.
Emoji reactions are visible to all group members and persist across sessions.
The green online dot indicates current group activity status. |
| --- |
| Action | Icon | Behaviour & Effect |
| --- | --- | --- |
| Upvote | Thumbs Up | Positive vote on the post. Increments the upvote count. Contributes to QS and POPULAR ranking. Toggles on/off. |
| Downvote | Thumbs Down | Negative vote. Decrements the engagement score. Toggles on/off. |
| Heart | Heart | Emotional appreciation reaction. Separate from upvote — represents connection or motivation. Toggles on/off. |
| Comment | Bubble | Opens the post detail view or comment section. Count shows total replies to the post. |
| Bookmark | Ribbon | Saves the post to the student's Bookmarks tab in the feed filter. Toggles saved/unsaved state. |
| Share | Chain/Link | Provides a shareable link to the post. May copy to clipboard or open a share menu. |
| Notification Bell | Bell | Subscribe to updates on this specific post. Student receives a notification when new comments are added. |
| TIP: Community Tip: Engage with discussions and help others to earn points and badges. Top contributors get featured on the leaderboard! |
| --- |
| Active Channel | Widget(s) Shown | Widget Description |
| --- | --- | --- |
| Discussion (General) | My Groups | Quick view of student's groups with member counts. Buttons: View My Groups, Create Group. |
| Discussion (General) | Top Contributors | Leaderboard of most active community members by contribution score. |
| Discussion (General) | Community Tip | Rotating engagement tip — explains QS points, badges, and leaderboard. |
| Support (Emotion Coach) | Emotion Coach Panel | Full AI chat interface. Header, greeting message, input field, send button, disclaimer. |
| Mentor (Mentors & Coaches) | My Groups | Same groups widget as in Discussion channel. |
| Feature | Location / Route | Key Behaviour & Notes |
| --- | --- | --- |
| Community Page | /dashboard/community | Accessible from left sidebar. Three channel tabs. Default: Discussion. |
| Search Bar | Community Page — Top | Full-text search across all channels and categories. |
| Statistics Bar | Community Page — Below Tabs | Live counts: Members, Discussions, Groups, Active Today. |
| Discussion Channel | Tab 1 — General | Open peer forum. No AI routing. Posts visible to all community members. |
| Support Channel | Tab 2 — Emotion Coach | Activates AI Emotion Coach panel. Staff alerted for distress. |
| Mentor Channel | Tab 3 — Mentors & Coaches | Routes posts to all mentors assigned to the college. |
| + Start a Discussion | All Channels — CTA Button | Opens New Discussion modal. Channel pre-set based on active tab. |
| New Discussion Modal | Overlay Modal | Fields: Title, Category, Channel (lockable), Rich Content, Poll, Media Attachment. |
| Category Dropdown | New Discussion Modal | 7 options: General Discussion, Career Growth, Study Resources, Exam Prep, Skill Building, Motivation, Other. |
| Poll Feature | New Discussion Modal | Add Poll section with: Poll Question, Option 1, Option 2, + Add another option, Ending Date (Optional). |
| Media Attachment | New Discussion Modal | File upload field to attach images or media to a post. |
| Post Card | Feed — Each Post | Shows: Category, Pinned, QS, Title, Author, Time, Content, Image, Actions. |
| Post Actions | Post Card — Bottom Bar | Upvote, Downvote, Heart, Comment, Bookmark, Share, Bell. |
| NEWEST / POPULAR Sort | Feed Top-Right | Toggles sort order of the discussion feed. |
| My Posts Tab | Feed Filter | Filters feed to show only the logged-in student's posts. |
| Bookmarks Tab | Feed Filter | Shows all posts the student has bookmarked. |
| Emotion Coach Panel | Support Channel — Right Sidebar | AI chat interface. Input, send button, safe space disclaimer. |
| Top Contributors | Discussion Channel — Right Sidebar | Leaderboard widget. Shows most active members. |
| Community Tip | Discussion Channel — Right Sidebar | Rotating engagement guidance tip. |
| My Groups Widget | Discussion & Mentor — Right Sidebar | Shows student's groups. Links to Create Group and View My Groups. |
| Student Groups Page | /dashboard/groups | Full groups management page. Grid of group cards with Admin badge. |
| Create Group Modal | Groups Page / Sidebar Widget | Fields: Name, Description, Icon (6 options), Colour (6 swatches). |
| Group Card | Groups Page | Shows: Icon, Name, Description, Member Count, Admin Badge, Open button. |
| Group Chat Space | /dashboard/groups/{group-id} | Real-time group messaging. Accessed via 'Open' on a group card. Port 8080. |
| Chat Message Feed | Group Chat Page | Sent messages (dark navy, right). Received messages (grey, left). Timestamps shown. |
| Emoji Reactions | Group Chat — Messages | Members react to messages with emoji. Reactions shown with count below bubble. |
| Group Chat Toolbar | Group Chat Page — Top Right | Icons: Search messages, View media, View members, Leave group. |
| Quality Score (QS) | Every Post Card | Floating-point engagement score. Influences Popular sort and leaderboard. |
| Notifications | Left Sidebar / Header Bell | Red/orange badge. Triggered by replies, upvotes, mentor responses. |
| Dark Mode | Left Sidebar — Last Item | Platform-wide dark theme toggle. |
| Pinned Posts | Discussion Feed | Admin-pinned posts with PINNED badge. Always shown at top. |