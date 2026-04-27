const express = require('express');
const { protect } = require('../middleware/auth');
const chatbotService = require('../services/chatbotService');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// In-memory conversation storage (consider using Redis or MongoDB for production)
const conversations = new Map();

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot
 * @access  Private
 */
router.post('/message', protect, async (req, res) => {
    try {
        const { message, conversationId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Get or create conversation history
        const convId = conversationId || `conv_${Date.now()}_${req.user._id}`;
        const conversationHistory = conversations.get(convId) || [];

        // Send message to chatbot service
        const response = await chatbotService.sendMessage(message.trim(), conversationHistory);

        if (response.success) {
            // Store updated conversation history
            conversations.set(convId, response.conversationHistory);

            // Check if escalation is suggested
            const shouldEscalate = chatbotService.shouldEscalate(response.conversationHistory);

            return res.json({
                success: true,
                conversationId: convId,
                message: response.message,
                shouldEscalate,
                messageCount: response.conversationHistory.length / 2 // Divide by 2 for user messages only
            });
        } else {
            return res.status(500).json({
                success: false,
                error: response.error || 'Failed to get response from chatbot',
                fallbackMessage: response.message
            });
        }
    } catch (error) {
        console.error('Chatbot message error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your message'
        });
    }
});

/**
 * @route   GET /api/chatbot/conversation/:conversationId
 * @desc    Get conversation history
 * @access  Private
 */
router.get('/conversation/:conversationId', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversationHistory = conversations.get(conversationId) || [];

        res.json({
            success: true,
            conversationId,
            messages: conversationHistory,
            messageCount: conversationHistory.length
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve conversation'
        });
    }
});

/**
 * @route   POST /api/chatbot/escalate
 * @desc    Export conversation to support ticket
 * @access  Private
 */
router.post('/escalate', protect, async (req, res) => {
    try {
        const { conversationId, additionalInfo } = req.body;

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: 'Conversation ID is required'
            });
        }

        const conversationHistory = conversations.get(conversationId) || [];

        if (conversationHistory.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Format conversation for ticket
        const conversationText = conversationHistory
            .map((msg, index) => {
                const role = msg.role === 'user' ? 'You' : 'Support Bot';
                return `${role}: ${msg.content}`;
            })
            .join('\n\n');

        const ticketDescription = `**Chat Conversation:**\n\n${conversationText}${additionalInfo ? `\n\n**Additional Information:**\n${additionalInfo}` : ''
            }`;

        res.json({
            success: true,
            conversationText,
            ticketDescription,
            message: 'Conversation exported successfully'
        });
    } catch (error) {
        console.error('Escalate conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export conversation'
        });
    }
});

/**
 * @route   DELETE /api/chatbot/conversation/:conversationId
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete('/conversation/:conversationId', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        conversations.delete(conversationId);

        res.json({
            success: true,
            message: 'Conversation cleared successfully'
        });
    } catch (error) {
        console.error('Clear conversation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear conversation'
        });
    }
});

module.exports = router;
