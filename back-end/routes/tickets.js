const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const path = require('path');
const SupportTicket = require('../models/SupportTicket');
const ITSupport = require('../models/ITSupport');
const Counter = require('../models/Counter');
const User = require('../models/User');

// Round-robin selection of the next IT support person to receive a ticket.
const getNextITSupportAssignee = async () => {
  const supports = await ITSupport.find({ status: 'active' })
    .sort({ createdAt: 1 })
    .select('_id fullName');

  if (!supports.length) return null;

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'ticketAssignment' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const index = (counter.seq - 1) % supports.length;
  return supports[index];
};
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadSupportAttachments } = require('../middleware/upload');
const itsmClient = require('../services/itsmClient');
const { notifyTicketResponse, createNotification } = require('../services/notificationService');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Rate limiter for ticket creation (10 tickets per user per hour)
// Note: This limiter is applied AFTER the protect middleware, so req.user will always be available
const ticketCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many tickets created. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // keyGenerator: (req) => req.user?._id?.toString(), // keyGenerator causing validation error in v8
  validate: {
    xForwardedForHeader: false,
  }
});

// Validation middleware
const ticketValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
     .isIn(['technical', 'billing', 'account', 'content', 'feedback', 'other', 'course & assessment', 'course issue', 'assessment issue', 'career Direction'])
     .withMessage('Invalid category'),
  body('contactName').optional().trim(),
  body('contactEmail').optional().trim().isEmail().withMessage('Invalid email format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority')
];

const responseValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Response message must be between 1 and 1000 characters')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route   POST /api/tickets
 * @desc    Create a new support ticket
 * @access  Private (Authenticated users)
 */
router.post('/',
  optionalAuth,
  ticketCreationLimiter,
  uploadSupportAttachments.array('attachments', 3), // Max 3 attachments
  ticketValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, description, category, priority, contactName, contactEmail } = req.body;

      // Verify user is authenticated OR provided contact info
      if (!req.user && (!contactName || !contactEmail)) {
        return res.status(400).json({ success: false, error: 'Name and email are required for guests' });
      }

      // Process uploaded files
      const attachments = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        publicUrl: `/uploads/${path.basename(file.path)}`,
        mimetype: file.mimetype,
        size: file.size
      })) : [];

      const ticket = new SupportTicket({
        userId: req.user ? req.user._id : undefined,
        contactName: req.user ? req.user.fullName : contactName,
        contactEmail: req.user ? req.user.email : contactEmail,
        userModel: 'Student',
        title,
        description,
        category,
        priority: priority || 'medium',
        attachments
      });

      // Auto-assign to an IT support person using round-robin distribution
      try {
        const assignee = await getNextITSupportAssignee();
        if (assignee) {
          ticket.assignedTo = assignee._id;
          ticket.assignedToModel = 'ITSupport';
          ticket.status = 'open';
        }
      } catch (assignErr) {
        console.warn('Auto-assign ticket failed:', assignErr.message);
      }

      await ticket.save();

      // Bridge to ITSM Platform (non-blocking — ticket still saves if ITSM is down)
      try {
        const itsmTicket = await itsmClient.createTicket({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category === 'technical' ? 'hardware' : 'software',
          priority: ticket.priority === 'high' ? 'P1' : ticket.priority === 'medium' ? 'P2' : 'P3',
          externalRef: ticket.ticketId
        });

        if (itsmTicket.success) {
          ticket.itsmTicketId = itsmTicket.ticketId;
          ticket.itsmTicketNumber = itsmTicket.ticketNumber;
          await ticket.save();
        }
      } catch (itsmError) {
        // Log but don't fail — dashboard ticket already saved
        console.warn('[ITSM Bridge] Failed to create ITSM ticket:', itsmError.message);
      }

      // Notify the assigned IT support person
      if (ticket.assignedTo) {
        try {
          await createNotification({
            userId: ticket.assignedTo,
            type: 'support',
            title: 'New Ticket Assigned',
            message: `Ticket ${ticket.ticketId} has been assigned to you: ${ticket.title}`,
            link: `/support/tickets/${ticket._id}`,
            metadata: {
              ticketId: ticket._id
            }
          });
        } catch (notifyErr) {
          console.warn('IT Support notification failed:', notifyErr.message);
        }
      }

      // Notify Admins about new ticket
      try {
        const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
        for (const admin of admins) {
          await createNotification({
            userId: admin._id,
            type: 'support',
            title: 'New Support Ticket',
            message: `A new ticket (${ticket.ticketId}) has been raised regarding: ${ticket.title}`,
            link: '/admin/support',
            metadata: {
              ticketId: ticket._id
            }
          });
        }
      } catch (notifyErr) {
        console.warn('Admin notification failed:', notifyErr.message);
      }

      // Populate user info for response
      await ticket.populate([
        { path: 'userId', select: 'fullName email userId' },
        { path: 'assignedTo', select: 'fullName email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create ticket',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets for the authenticated user
 * @access  Private (Authenticated users)
 */
router.get('/',
  protect,
  async (req, res) => {
    try {
      const { status, priority, category, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Build query
      const query = { userId: req.user._id };
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [tickets, total] = await Promise.all([
        SupportTicket.find(query)
          .populate('assignedTo', 'fullName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-__v'),
        SupportTicket.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tickets',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/tickets/all
 * @desc    Get all tickets (Admin only)
 * @access  Private (Admin)
 */
router.get('/all',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const {
        status,
        priority,
        category,
        search,
        userId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (userId) query.userId = userId;

      // Search by ticketId or title
      if (search) {
        const safe = require('../utils/escapeRegex')(search); // SECURITY: ReDoS-safe
        query.$or = [
          { ticketId: { $regex: safe, $options: 'i' } },
          { title: { $regex: safe, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [tickets, total, stats] = await Promise.all([
        SupportTicket.find(query)
          .populate('userId', 'fullName email userId profileImage')
          .populate('assignedTo', 'fullName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-__v'),
        SupportTicket.countDocuments(query),
        SupportTicket.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Format stats
      const statusCounts = {
        open: 0,
        'in-progress': 0,
        resolved: 0,
        closed: 0
      };
      stats.forEach(s => {
        statusCounts[s._id] = s.count;
      });

      res.json({
        success: true,
        data: tickets,
        stats: statusCounts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tickets',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get a specific ticket by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:id',
  protect,
  async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id)
        .populate('userId', 'fullName email userId profileImage')
        .populate('assignedTo', 'fullName email')
        .populate('responses.respondedBy', 'fullName email role');

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Check if user is owner or admin
      const isOwner = ticket.userId._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this ticket'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ticket',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/tickets/:id/user-response
 * @desc    Add a response to own ticket (Ticket owner only)
 * @access  Private (Authenticated - ticket owner)
 */
router.post('/:id/user-response',
  protect,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const ticket = await SupportTicket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Check if user owns this ticket
      const ticketOwnerId = ticket.userId?._id 
        ? ticket.userId._id.toString() 
        : ticket.userId.toString();

      if (ticketOwnerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to respond to this ticket'
        });
      }

      // Don't allow responses on closed/resolved tickets
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        return res.status(400).json({
          success: false,
          error: 'Cannot add response to a closed or resolved ticket'
        });
      }

      ticket.responses.push({
        message: message.trim(),
        respondedBy: req.user._id,
        respondedAt: new Date()
      });

      await ticket.save();

      // Forward student reply to ITSM as a worknote (non-blocking)
      if (ticket.itsmTicketId) {
        itsmClient.addWorknote(
          ticket.itsmTicketId,
          `[Student Reply] ${message.trim()}`,
          'user-dashboard'
        ).catch(err => console.warn('[ITSM Sync] Student worknote failed:', err.message));
      }

      // Populate for response
      await ticket.populate([
        { path: 'userId', select: 'fullName email userId profileImage' },
        { path: 'assignedTo', select: 'fullName email' },
        { path: 'responses.respondedBy', select: 'fullName email role' }
      ]);

      res.json({
        success: true,
        message: 'Response added successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error adding user response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add response',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Update ticket status or add response (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { status, response } = req.body;

      const ticket = await SupportTicket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      // Update status if provided
      if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
        ticket.status = status;
      }

      // Add response if provided
      if (response && response.trim().length > 0) {
        const responderId = req.user._id || req.user.id;

        ticket.responses.push({
          message: response.trim(),
          respondedBy: responderId,
          respondedAt: new Date()
        });

        // Auto-update status to in-progress if still open
        if (ticket.status === 'open') {
          ticket.status = 'in-progress';
        }
      }

      await ticket.save();

      // Sync status back to ITSM
      if (ticket.itsmTicketId) {
        try {
          const itsmStatus = 
            ticket.status === 'resolved' ? 'resolved' :
            ticket.status === 'closed' ? 'closed' :
            ticket.status === 'in-progress' ? 'diagnosed' : 'logged';

          await itsmClient.syncStatus(ticket.itsmTicketId, itsmStatus);
        } catch (syncErr) {
          console.warn('[ITSM Sync] Status sync failed:', syncErr.message);
        }
      }

      // Populate for response
      await ticket.populate([
        { path: 'userId', select: 'fullName email userId profileImage' },
        { path: 'assignedTo', select: 'fullName email' },
        { path: 'responses.respondedBy', select: 'fullName email role' }
      ]);

      const shouldNotifyTicketOwner = !response?.trim()
        && status && ['resolved', 'closed', 'in-progress'].includes(status);

      if (shouldNotifyTicketOwner) {
        await createNotification({
          userId: ticket.userId._id || ticket.userId,
          type: 'support',
          title: 'Ticket Status Updated',
          message: `Your support ticket "${ticket.title}" is now ${ticket.status}.`,
          link: '/tickets',
          metadata: {
            ticketId: ticket._id,
            status: ticket.status
          }
        });
      }

      if (response?.trim()) {
        await notifyTicketResponse(
          ticket.userId._id || ticket.userId,
          ticket._id.toString(),
          ticket.title,
          req.user.fullName || 'Support Team'
        );
      }

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update ticket',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/tickets/:id/response
 * @desc    Add a response to ticket (Admin only)
 * @access  Private (Admin)
 */
router.post('/:id/response',
  protect,
  authorize('admin'),
  responseValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { message } = req.body;

      const ticket = await SupportTicket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      ticket.responses.push({
        message: message.trim(),
        respondedBy: req.user._id,
        respondedAt: new Date()
      });

      // Auto-update status to in-progress if still open
      if (ticket.status === 'open') {
        ticket.status = 'in-progress';
      }

      await ticket.save();

      // Populate for response
      await ticket.populate([
        { path: 'userId', select: 'fullName email userId profileImage' },
        { path: 'assignedTo', select: 'fullName email' },
        { path: 'responses.respondedBy', select: 'fullName email role' }
      ]);

      await notifyTicketResponse(
        ticket.userId._id || ticket.userId,
        ticket._id.toString(),
        ticket.title,
        req.user.fullName || 'Support Team'
      );

      res.json({
        success: true,
        message: 'Response added successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error adding response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add response',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Delete a ticket (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        message: 'Ticket deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete ticket',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/tickets/stats/summary
 * @desc    Get ticket statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats/summary',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const [statusStats, priorityStats, categoryStats, recentActivity] = await Promise.all([
        // Status breakdown
        SupportTicket.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        // Priority breakdown
        SupportTicket.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        // Category breakdown
        SupportTicket.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        // Recent tickets (last 7 days)
        SupportTicket.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          byStatus: statusStats,
          byPriority: priorityStats,
          byCategory: categoryStats,
          recentActivity
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  }
);

// Sync worknote endpoint for ITSM → UserDashboard
// Token-protected: ITSM posts here whenever an agent adds a worknote on a linked incident
router.post('/sync-worknote', async (req, res) => {
  try {
    const { externalRef, message, agentName, syncToken } = req.body;

    if (syncToken !== process.env.USERDASHBOARD_SYNC_TOKEN) {
      return res.status(401).json({ error: 'Invalid sync token' });
    }

    const SupportTicket = require('../models/SupportTicket');
    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId: externalRef },
      {
        $push: {
          responses: {
            message: `[ITSM Agent - ${agentName}] ${message}`,
            respondedBy: null,
            respondedAt: new Date()
          }
        }
      },
      { runValidators: false, new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found for ref: ' + externalRef });
    }

    await createNotification({
      userId: ticket.userId,
      type: 'support',
      title: 'Support Reply Received',
      message: `Support replied to "${ticket.title}".`,
      link: '/tickets',
      metadata: {
        ticketId: ticket._id
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[sync-worknote] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
