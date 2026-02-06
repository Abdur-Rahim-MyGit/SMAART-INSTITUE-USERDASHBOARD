const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Issue a new certificate (Protected)
router.post('/issue', protect, async (req, res) => {
    try {
        const { certificateType, certificateTitle, validatedSkills, readinessBand, assessmentWindow } = req.body;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: 'User object not found in request context' });
        }

        // Generate unique certificate ID
        const certificateCode = {
            'capacity': 'CAP',
            'capability': 'APC',
            'leadership': 'ELR'
        }[certificateType] || 'CRT';

        const year = new Date().getFullYear();
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const certificateId = `SMAART-${certificateCode}-${year}-${randomStr}`;

        // Create certificate record
        const certificate = new Certificate({
            certificateId,
            userId: user._id,
            studentId: user.studentId || user.email,
            fullName: user.fullName,
            email: user.email,
            certificateType,
            certificateTitle,
            validatedSkills: validatedSkills || [],
            readinessBand: readinessBand || 'Proficient',
            assessmentWindow: assessmentWindow || `TST-${year}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                generatedBy: user.email
            }
        });


        await certificate.save();

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            certificate: {
                certificateId: certificate.certificateId,
                certificateType: certificate.certificateType,
                certificateTitle: certificate.certificateTitle,
                issueDate: certificate.issueDate,
                verificationUrl: `${frontendUrl}/verify-certificate/${certificate.certificateId}`
            }
        });
    } catch (error) {
        console.error('❌ Error issuing certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to issue certificate',
            error: error.message
        });
    }
});

// Get all certificates for the logged-in user (Protected)
router.get('/my-certificates', protect, async (req, res) => {
    try {
        const certificates = await Certificate.find({
            userId: req.user._id,
            status: 'active'
        }).sort({ issueDate: -1 });

        res.json({
            success: true,
            count: certificates.length,
            certificates: certificates.map(cert => ({
                certificateId: cert.certificateId,
                certificateType: cert.certificateType,
                certificateTitle: cert.certificateTitle,
                issueDate: cert.issueDate,
                readinessBand: cert.readinessBand,
                verificationCount: cert.verificationCount,
                verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-certificate/${cert.certificateId}`
            }))
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Failed to fetch certificates', error: error.message });
    }
});

// Public route to verify a certificate by ID
router.get('/verify/:certificateId', async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                verified: false,
                message: 'Certificate not found. Please check the certificate ID and try again.'
            });
        }

        if (certificate.status === 'revoked') {
            return res.status(200).json({
                success: true,
                verified: false,
                status: 'revoked',
                message: 'This certificate has been revoked and is no longer valid.',
                certificateId: certificate.certificateId,
                issueDate: certificate.issueDate
            });
        }

        if (certificate.status === 'expired') {
            return res.status(200).json({
                success: true,
                verified: false,
                status: 'expired',
                message: 'This certificate has expired.',
                certificateId: certificate.certificateId,
                issueDate: certificate.issueDate
            });
        }

        // Record verification
        await certificate.recordVerification();

        res.json({
            success: true,
            verified: true,
            message: 'Certificate is valid and authentic',
            certificate: {
                certificateId: certificate.certificateId,
                fullName: certificate.fullName,
                studentId: certificate.studentId,
                certificateType: certificate.certificateType,
                certificateTitle: certificate.certificateTitle,
                issueDate: certificate.issueDate,
                readinessBand: certificate.readinessBand,
                assessmentWindow: certificate.assessmentWindow,
                issuingAuthority: certificate.issuingAuthority,
                validatedSkills: certificate.validatedSkills,
                status: certificate.status,
                verificationCount: certificate.verificationCount
            }
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying certificate',
            error: error.message
        });
    }
});

// Get certificate details by ID (Protected - for the owner)
router.get('/details/:certificateId', protect, async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({
            certificateId,
            userId: req.user._id
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found or access denied' });
        }

        res.json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error('Error fetching certificate details:', error);
        res.status(500).json({ message: 'Failed to fetch certificate details', error: error.message });
    }
});

// Revoke a certificate (Admin only - you can add admin middleware)
router.patch('/revoke/:certificateId', protect, async (req, res) => {
    try {
        // Add admin check here if needed
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId });

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        certificate.status = 'revoked';
        await certificate.save();

        res.json({
            success: true,
            message: 'Certificate revoked successfully',
            certificateId: certificate.certificateId
        });
    } catch (error) {
        console.error('Error revoking certificate:', error);
        res.status(500).json({ message: 'Failed to revoke certificate', error: error.message });
    }
});

module.exports = router;
