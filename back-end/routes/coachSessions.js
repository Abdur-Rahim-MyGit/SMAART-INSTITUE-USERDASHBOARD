const express = require('express');
const CoachSession = require('../models/CoachSession');
        // Send notification for session scheduled
        try {
            const coach = await Coach.findById(session.coach);
            const coachName = coach?.name || 'your coach';
            await notifySessionScheduled(session.student, session, coachName);
            console.log(`🔔 Notification sent for session scheduled with ${coachName}`);
        } catch (notifyError) {
            console.error("⚠️ Error sending session notification:", notifyError);
        }
        res.status(201).json({
            success: true,
            message: 'Coach session created successfully',
            data: session
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create coach session',
            message: err.message
        });
    }
});

// Update coach session
router.put('/:id', async (req, res) => {
    try {
        const session = await CoachSession.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Coach session not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach session updated successfully',
            data: session
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update coach session',
            message: err.message
        });
    }
});

// Delete coach session
router.delete('/:id', async (req, res) => {
    try {
        const session = await CoachSession.findByIdAndDelete(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Coach session not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach session deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete coach session',
            message: err.message
        });
    }
});

module.exports = router;
