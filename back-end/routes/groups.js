const express = require('express');
const router = express.Router();
const CommunityGroup = require('../models/CommunityGroup');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const { protect } = require('../middleware/auth');
const { uploadBase64Image, uploadBase64File } = require('../helpers/cloudinaryHelper');

// Apply protection to all group routes
router.use(protect);

// Helper to get user details including college
const getUserDetails = async (userId) => {
    let user = await User.findById(userId).select('college fullName email profileImage role');
    if (!user) user = await Student.findById(userId).select('college fullName email profileImage role');
    if (!user) user = await Teacher.findById(userId).select('college fullName email profileImage role');
    if (!user) user = await Registration.findById(userId).select('institution fullName email profileImage role');
    return user;
};

// Helper to hydrate members list
const hydrateMembers = async (memberIds) => {
    const [users, students, teachers, registrations] = await Promise.all([
        User.find({ _id: { $in: memberIds } }).select('fullName email profileImage role'),
        Student.find({ _id: { $in: memberIds } }).select('fullName email profileImage role'),
        Teacher.find({ _id: { $in: memberIds } }).select('fullName email profileImage role'),
        Registration.find({ _id: { $in: memberIds } }).select('fullName email profileImage role'),
    ]);

    const memberMap = new Map();
    [...users, ...students, ...teachers, ...registrations].forEach(m => {
        memberMap.set(m._id.toString(), m);
    });

    return memberIds.map(id => {
        const member = memberMap.get(id.toString());
        return member ? {
            _id: member._id,
            fullName: member.fullName,
            profileImage: member.profileImage,
            role: member.role || 'student'
        } : null;
    }).filter(Boolean);
};

// @desc    Create a new student group
// @route   POST /api/groups/student
// @access  Private
router.post('/student', async (req, res) => {
    try {
        const { name, description, icon, color, category } = req.body;
        const authorId = req.user.id; // From auth middleware

        const user = await getUserDetails(authorId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (!user.college && !user.institution) {
            // Allows generic users if no college is strictly required, but requirement says "students from their university"
            // So we should enforce college/institution presence for student groups
            return res.status(400).json({ success: false, error: 'You must belong to a university to create a student group.' });
        }

        const collegeId = user.college || user.institution; // Handle both schema variants if needed, usually just 'college' for Student

        // Moderate group name and description
        const { moderateText } = require('../helpers/textModeration');
        const nameCheck = moderateText(name);
        const descCheck = moderateText(description || '');

        if (!nameCheck.isClean) {
            return res.status(400).json({
                success: false,
                error: 'Group name contains inappropriate language. Please choose a different name.',
                flaggedWords: nameCheck.flaggedWords
            });
        }

        if (description && !descCheck.isClean) {
            return res.status(400).json({
                success: false,
                error: 'Group description contains inappropriate language. Please revise before creating.',
                flaggedWords: descCheck.flaggedWords
            });
        }

        const group = new CommunityGroup({
            name,
            description,
            icon: icon || 'Users',
            color: color || 'bg-blue-500',
            category: category || 'other',
            type: 'student',
            college: collegeId,
            admins: [authorId],
            members: [authorId],
            isPublic: false // Student groups are private to the university usually, or just private in general? "add other students... can leave" implies invitation or open within uni. Let's default false (invite/request) or true (open to uni). 
            // Req: "add other students" -> implies invite. "switch between groups" -> list. 
            // Let's keep isPublic=true but scoped to college in query.
        });

        await group.save();

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ success: false, error: 'Failed to create group' });
    }
});

// @desc    Get my groups (where I am member)
// @route   GET /api/groups/my
// @access  Private
router.get('/my', async (req, res) => {
    try {
        const userId = req.user.id;

        // Find groups where user is a member
        const groups = await CommunityGroup.find({
            members: userId,
            status: 'active'
        })
            .sort({ updatedAt: -1 })
            .lean();

        // Attach member count and unread/last message snippet if needed
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const formattedGroups = groups.map(g => ({
            ...g,
            memberCount: g.members.length,
            isAdmin: g.admins.map(id => id.toString()).includes(userId),
            lastActive: g.updatedAt
        }));

        res.json({ success: true, data: formattedGroups });
    } catch (error) {
        console.error('Error fetching my groups:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch your groups' });
    }
});

// @desc    Get group details (including messages)
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const group = await CommunityGroup.findOne({ _id: id, status: 'active' }).lean();

        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Check membership
        const isMember = group.members.map(m => m.toString()).includes(userId);
        if (!isMember) {
            // If public and same college, maybe allow view? For now strict membership for chat.
            return res.status(403).json({ success: false, error: 'Not a member of this group' });
        }

        // Hydrate members for side panel
        group.memberDetails = await hydrateMembers(group.members);
        group.isAdmin = group.admins.map(a => a.toString()).includes(userId);

        res.json({ success: true, data: group });
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch group details' });
    }
});

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private (Admin only)
router.post('/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body; // user ID to add
        const requesterId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) {
            return res.status(404).json({ success: false, error: 'Group not found' });
        }

        // Verify requester is admin
        if (!group.admins.map(a => a.toString()).includes(requesterId)) {
            return res.status(403).json({ success: false, error: 'Only admins can add members' });
        }

        // Check if already member
        if (group.members.includes(studentId)) {
            return res.status(400).json({ success: false, error: 'User is already a member' });
        }

        // Verify college scope
        // 1. Get student to be added
        const studentToAdd = await getUserDetails(studentId);
        if (!studentToAdd) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        // 2. Compare colleges
        const groupCollege = group.college.toString();
        const studentCollege = (studentToAdd.college || studentToAdd.institution || '').toString();

        if (groupCollege && groupCollege !== studentCollege) {
            return res.status(403).json({ success: false, error: 'Cannot add students from other universities' });
        }

        group.members.push(studentId);
        await group.save();

        // Return updated member list
        const memberDetails = await hydrateMembers(group.members);

        res.json({ success: true, data: memberDetails });

    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ success: false, error: 'Failed to add member' });
    }
});

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:memberId
// @access  Private (Admin only)
router.delete('/:id/members/:memberId', async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const requesterId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify requester is admin
        if (!group.admins.map(a => a.toString()).includes(requesterId)) {
            return res.status(403).json({ success: false, error: 'Only admins can remove members' });
        }

        // Check if member exists in group
        if (!group.members.map(m => m.toString()).includes(memberId)) {
            return res.status(400).json({ success: false, error: 'User is not a member of this group' });
        }

        // Prevent removing admins directly - must demote first
        const isTargetAdmin = group.admins.map(a => a.toString()).includes(memberId);
        if (isTargetAdmin) {
            return res.status(400).json({ success: false, error: 'Cannot remove an admin directly. Remove their admin status first.' });
        }

        // Remove from members (admins are already blocked above)
        group.members = group.members.filter(m => m.toString() !== memberId);

        // If no members left, deactivate group
        if (group.members.length === 0) {
            group.status = 'inactive';
        }

        await group.save();

        // Return updated member list
        const memberDetails = await hydrateMembers(group.members);
        res.json({ success: true, data: memberDetails });

    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
});

// @desc    Promote member to admin
// @route   POST /api/groups/:id/admins/:memberId
// @access  Private (Admin only)
router.post('/:id/admins/:memberId', async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const requesterId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify requester is admin
        if (!group.admins.map(a => a.toString()).includes(requesterId)) {
            return res.status(403).json({ success: false, error: 'Only admins can promote members' });
        }

        // Check if user is a member
        if (!group.members.map(m => m.toString()).includes(memberId)) {
            return res.status(400).json({ success: false, error: 'User is not a member of this group' });
        }

        // Check if already admin
        if (group.admins.map(a => a.toString()).includes(memberId)) {
            return res.status(400).json({ success: false, error: 'User is already an admin' });
        }

        // Add to admins
        group.admins.push(memberId);
        await group.save();

        // Return updated member list
        const memberDetails = await hydrateMembers(group.members);
        res.json({ success: true, data: memberDetails });

    } catch (error) {
        console.error('Error promoting member:', error);
        res.status(500).json({ success: false, error: 'Failed to promote member' });
    }
});

// @desc    Demote admin to regular member
// @route   DELETE /api/groups/:id/admins/:memberId
// @access  Private (Admin only)
router.delete('/:id/admins/:memberId', async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const requesterId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify requester is admin
        if (!group.admins.map(a => a.toString()).includes(requesterId)) {
            return res.status(403).json({ success: false, error: 'Only admins can demote members' });
        }

        // Check if user is an admin
        if (!group.admins.map(a => a.toString()).includes(memberId)) {
            return res.status(400).json({ success: false, error: 'User is not an admin' });
        }

        // Prevent demoting the last admin
        if (group.admins.length === 1) {
            return res.status(400).json({ success: false, error: 'Cannot demote the last admin. Promote another member first.' });
        }

        // Remove from admins (keep in members)
        group.admins = group.admins.filter(a => a.toString() !== memberId);
        await group.save();

        // Return updated member list
        const memberDetails = await hydrateMembers(group.members);
        res.json({ success: true, data: memberDetails });

    } catch (error) {
        console.error('Error demoting admin:', error);
        res.status(500).json({ success: false, error: 'Failed to demote admin' });
    }
});

// @desc    Leave group
// @route   DELETE /api/groups/:id/members
// @access  Private
router.delete('/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Remove from members
        group.members = group.members.filter(m => m.toString() !== userId);

        // Remove from admins if admin
        group.admins = group.admins.filter(a => a.toString() !== userId);

        // If no members left, maybe deactivate group?
        if (group.members.length === 0) {
            group.status = 'inactive';
        }

        await group.save();

        res.json({ success: true, message: 'Left group successfully' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ success: false, error: 'Failed to leave group' });
    }
});

// @desc    Send message
// @route   POST /api/groups/:id/messages
// @access  Private
router.post('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, image, video, poll } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        if (!group.members.map(m => m.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Not a member' });
        }

        // Moderate message content
        const { moderateText } = require('../helpers/textModeration');
        if (content && content.trim()) {
            const contentCheck = moderateText(content);
            if (!contentCheck.isClean) {
                return res.status(400).json({
                    success: false,
                    error: 'Your message contains inappropriate language. Please revise before sending.',
                    flaggedWords: contentCheck.flaggedWords
                });
            }
        }

        let imageUrl = null;
        let videoUrl = null;

        // Handle Image Attachment
        if (image) {
            try {
                // Check image for NSFW content
                const { scanImage } = require('../helpers/nsfwModeration');
                const nsfwCheck = await scanImage(image);

                if (!nsfwCheck.isSafe) {
                    return res.status(400).json({
                        success: false,
                        error: 'The uploaded image contains inappropriate content. Please choose a different image.',
                        reason: nsfwCheck.reason
                    });
                }

                const uploadResult = await uploadBase64File(image, 'group-chats');
                if (uploadResult.success) {
                    imageUrl = uploadResult.url;
                } else {
                    return res.status(400).json({ success: false, error: uploadResult.error });
                }
            } catch (err) {
                console.error('Image upload failed:', err);
                return res.status(500).json({ success: false, error: 'Image upload failed' });
            }
        }

        // Handle Video Attachment
        if (video) {
            try {
                const uploadResult = await uploadBase64File(video, 'group-chats');
                if (uploadResult.success) {
                    videoUrl = uploadResult.url;
                } else {
                    return res.status(400).json({ success: false, error: uploadResult.error });
                }
            } catch (err) {
                console.error('Video upload failed:', err);
                return res.status(500).json({ success: false, error: 'Video upload failed' });
            }
        }

        // Get sender details for cache
        const sender = await getUserDetails(userId);

        const message = {
            sender: userId,
            senderName: sender.fullName || 'Unknown',
            senderModel: 'Student', // Simplify for MVP or dynamic based on user role
            content,
            image: imageUrl,
            video: videoUrl,
            poll: poll ? {
                question: poll.question,
                options: poll.options.map(o => ({ text: o.text, voters: [] })),
                expiresAt: poll.expiresAt
            } : null,
            createdAt: new Date()
        };

        group.messages.push(message);
        await group.save();

        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// @desc    Vote in poll
// @route   POST /api/groups/:id/messages/:messageId/vote
// @access  Private
router.post('/:id/messages/:messageId/vote', async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const message = group.messages.id(messageId);
        if (!message || !message.poll) {
            return res.status(404).json({ success: false, error: 'Poll not found' });
        }

        // Check if poll expired
        if (message.poll.expiresAt && new Date() > new Date(message.poll.expiresAt)) {
            return res.status(400).json({ success: false, error: 'Poll has expired' });
        }

        // Check if user already voted in this poll
        const alreadyVoted = message.poll.options.some(opt =>
            opt.voters.map(v => v.toString()).includes(userId)
        );

        if (alreadyVoted) {
            return res.status(400).json({ success: false, error: 'You have already voted' });
        }

        if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
            return res.status(400).json({ success: false, error: 'Invalid option' });
        }

        // Add vote
        message.poll.options[optionIndex].voters.push(userId);
        await group.save();

        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Error voting in poll:', error);
        res.status(500).json({ success: false, error: 'Failed to vote' });
    }
});

// @desc    Search students in same college
// @route   GET /api/groups/search/students
// @access  Private
router.get('/search/students', async (req, res) => {
    try {
        const { query } = req.query;
        const requesterId = req.user.id;

        const requester = await getUserDetails(requesterId);
        if (!requester || (!requester.college && !requester.institution)) {
            return res.status(400).json({ success: false, error: 'College affiliation required' });
        }

        const collegeId = requester.college || requester.institution;

        // Search in Student collection (and maybe others if needed)
        // Find students in same college, matching name/email, exclude requester
        const students = await Student.find({
            college: collegeId,
            _id: { $ne: requesterId },
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { role: { $regex: query, $options: 'i' } } // allow searching by role if needed?
            ]
        }).select('fullName email profileImage').limit(20);

        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ success: false, error: 'Failed to search students' });
    }
});

// @desc    Share community post to group
// @route   POST /api/groups/:id/share-post
// @access  Private
router.post('/:id/share-post', async (req, res) => {
    try {
        const { id } = req.params;
        const { postData } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is a member
        if (!group.members.map(m => m.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Not a member of this group' });
        }

        // Get sender details
        const sender = await getUserDetails(userId);

        // Create message with shared post data
        const message = {
            sender: userId,
            senderName: sender.fullName || 'Unknown',
            senderModel: 'Student',
            content: `Shared a post from Community: "${postData.title}"`,
            poll: null,
            image: null,
            video: null,
            sharedPost: {
                discussionId: postData.discussionId,
                title: postData.title,
                content: postData.content,
                author: postData.author,
                category: postData.category,
                media: postData.media,
                poll: postData.poll,
                createdAt: postData.createdAt
            },
            createdAt: new Date()
        };

        group.messages.push(message);
        await group.save();

        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Error sharing post to group:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: Object.values(error.errors).map(val => val.message).join(', ') });
        }
        res.status(500).json({ success: false, error: error.message || 'Failed to share post' });
    }
});

// @desc    Create a channel in a group
// @route   POST /api/groups/:id/channels
// @access  Private (Admin only)
router.post('/:id/channels', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is admin
        if (!group.admins.map(a => a.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Only admins can create channels' });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Channel name is required' });
        }

        // Check if channel name already exists
        const existingChannel = group.channels.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
        if (existingChannel) {
            return res.status(400).json({ success: false, error: 'Channel name already exists' });
        }

        const channel = {
            name: name.trim(),
            description: description || '',
            icon: icon || 'Hash',
            isDefault: group.channels.length === 0 // First channel is default
        };

        group.channels.push(channel);
        await group.save();

        res.json({ success: true, data: group.channels });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ success: false, error: 'Failed to create channel' });
    }
});

// @desc    Get all channels in a group
// @route   GET /api/groups/:id/channels
// @access  Private
router.get('/:id/channels', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id).select('channels members');
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is member
        if (!group.members.map(m => m.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Not a member of this group' });
        }

        res.json({ success: true, data: group.channels || [] });
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch channels' });
    }
});

// @desc    Update a channel
// @route   PUT /api/groups/:id/channels/:channelId
// @access  Private (Admin only)
router.put('/:id/channels/:channelId', async (req, res) => {
    try {
        const { id, channelId } = req.params;
        const { name, description, icon } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is admin
        if (!group.admins.map(a => a.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Only admins can update channels' });
        }

        const channel = group.channels.id(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        if (name) channel.name = name.trim();
        if (description !== undefined) channel.description = description;
        if (icon) channel.icon = icon;

        await group.save();

        res.json({ success: true, data: group.channels });
    } catch (error) {
        console.error('Error updating channel:', error);
        res.status(500).json({ success: false, error: 'Failed to update channel' });
    }
});

// @desc    Delete a channel
// @route   DELETE /api/groups/:id/channels/:channelId
// @access  Private (Admin only)
router.delete('/:id/channels/:channelId', async (req, res) => {
    try {
        const { id, channelId } = req.params;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is admin
        if (!group.admins.map(a => a.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Only admins can delete channels' });
        }

        const channel = group.channels.id(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        // Prevent deleting default channel if it's the only one
        if (channel.isDefault && group.channels.length === 1) {
            return res.status(400).json({ success: false, error: 'Cannot delete the only channel' });
        }

        channel.remove();
        await group.save();

        res.json({ success: true, data: group.channels });
    } catch (error) {
        console.error('Error deleting channel:', error);
        res.status(500).json({ success: false, error: 'Failed to delete channel' });
    }
});

// @desc    Pin/Unpin a message
// @route   POST /api/groups/:id/messages/:messageId/pin
// @access  Private (Admin only)
router.post('/:id/messages/:messageId/pin', async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is admin
        if (!group.admins.map(a => a.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Only admins can pin messages' });
        }

        const message = group.messages.id(messageId);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        // Toggle pin status
        message.isPinned = !message.isPinned;

        // Update pinnedMessages array
        if (message.isPinned) {
            if (!group.pinnedMessages.includes(messageId)) {
                group.pinnedMessages.push(messageId);
            }
        } else {
            group.pinnedMessages = group.pinnedMessages.filter(id => id.toString() !== messageId);
        }

        await group.save();

        res.json({
            success: true,
            data: {
                isPinned: message.isPinned,
                pinnedMessages: group.pinnedMessages
            }
        });
    } catch (error) {
        console.error('Error pinning message:', error);
        res.status(500).json({ success: false, error: 'Failed to pin message' });
    }
});

// @desc    Add reaction to a message
// @route   POST /api/groups/:id/messages/:messageId/react
// @access  Private
router.post('/:id/messages/:messageId/react', async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        if (!emoji) {
            return res.status(400).json({ success: false, error: 'Emoji is required' });
        }

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        // Verify user is member
        if (!group.members.map(m => m.toString()).includes(userId)) {
            return res.status(403).json({ success: false, error: 'Not a member of this group' });
        }

        const message = group.messages.id(messageId);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        // Initialize reactions array if it doesn't exist
        if (!message.reactions) {
            message.reactions = [];
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            r => r.user.toString() === userId && r.emoji === emoji
        );

        if (existingReaction) {
            // Remove reaction (toggle off)
            message.reactions = message.reactions.filter(
                r => !(r.user.toString() === userId && r.emoji === emoji)
            );
        } else {
            // Add new reaction
            message.reactions.push({ user: userId, emoji });
        }

        await group.save();

        res.json({ success: true, data: message.reactions });
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ success: false, error: 'Failed to add reaction' });
    }
});

// @desc    Remove reaction from a message
// @route   DELETE /api/groups/:id/messages/:messageId/react
// @access  Private
router.delete('/:id/messages/:messageId/react', async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const group = await CommunityGroup.findById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const message = group.messages.id(messageId);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        // Remove user's reaction
        if (message.reactions) {
            message.reactions = message.reactions.filter(
                r => !(r.user.toString() === userId && (emoji ? r.emoji === emoji : true))
            );
        }

        await group.save();

        res.json({ success: true, data: message.reactions || [] });
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ success: false, error: 'Failed to remove reaction' });
    }
});

module.exports = router;
