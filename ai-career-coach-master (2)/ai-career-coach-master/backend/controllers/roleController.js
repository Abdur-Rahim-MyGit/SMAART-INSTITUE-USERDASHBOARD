const Role = require('../models/Role');
const aiAgent = require('../services/aiAgent');

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Public
 */
exports.getRoles = async (req, res, next) => {
    try {
        const { category, seniority, search } = req.query;

        let query = { active: true };

        if (category) {
            query.category = category;
        }

        if (seniority) {
            query.seniority = seniority;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const roles = await Role.find(query).sort({ title: 1 });

        // If search query exists but no roles found, try generating with AI
        if (search && roles.length === 0) {
            try {
                console.log(`Generating role for: ${search}`);
                const generatedRoleData = await aiAgent.generateRoleDetails(search);

                // Check if a role with this title already exists (to avoid duplicates if race condition)
                // Use case-insensitive regex for title check
                let newRole = await Role.findOne({
                    title: { $regex: new RegExp(`^${generatedRoleData.title}$`, 'i') }
                });

                if (!newRole) {
                    newRole = await Role.create(generatedRoleData);
                }

                return res.json({
                    success: true,
                    count: 1,
                    data: [newRole],
                    source: 'ai-generated'
                });
            } catch (aiError) {
                console.error('AI Generation failed:', aiError);
                // Fallback to empty result if AI fails, proceed to return empty array
            }
        }

        res.json({
            success: true,
            count: roles.length,
            data: roles
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single role
 * @route   GET /api/roles/:id
 * @access  Public
 */
exports.getRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get role categories
 * @route   GET /api/roles/categories
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Role.distinct('category');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};
