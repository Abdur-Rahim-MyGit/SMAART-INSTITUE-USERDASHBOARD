const CommunityTaskProgress = require('../models/CommunityTaskProgress');

// @route   GET /api/community-tasks-progress
// @desc    Get user's community task progress
// @access  Private
exports.getTaskProgress = async (req, res) => {
    try {
        let progress = await CommunityTaskProgress.findOne({ user: req.user.id });
        
        if (!progress) {
            // Create default empty progress if it doesn't exist
            progress = await CommunityTaskProgress.create({
                user: req.user.id,
                completedTasks: {}
            });
        }
        
        res.status(200).json({
            success: true,
            data: progress.completedTasks
        });
    } catch (err) {
        console.error('Error fetching community task progress:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   PUT /api/community-tasks-progress
// @desc    Update user's community task progress
// @access  Private
exports.updateTaskProgress = async (req, res) => {
    try {
        const { completedTasks } = req.body;

        if (!completedTasks || typeof completedTasks !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        let progress = await CommunityTaskProgress.findOneAndUpdate(
            { user: req.user.id },
            { $set: { completedTasks: completedTasks } },
            { new: true, upsert: true } // Upsert creates if it doesn't exist
        );

        res.status(200).json({
            success: true,
            data: progress.completedTasks
        });
    } catch (err) {
        console.error('Error updating community task progress:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
