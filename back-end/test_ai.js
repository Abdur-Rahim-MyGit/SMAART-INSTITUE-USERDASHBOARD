require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function testFullFlow() {
    const results = [];

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        results.push('✅ MongoDB connected');

        // 2. Load the controller dependencies
        const excelDataLoader = require('./services/excelDataLoader');
        results.push('✅ Excel data loader ready');

        // 3. Simulate the exact request that the frontend sends
        const careerInput = {
            shortTermGoal: 'Get a software engineering job at a top tech company',
            longTermGoal: 'Become a tech lead or engineering manager',
            degree: 'B.Tech',
            specialization: 'Computer Science',
            collegeType: 'Private',
            yearOfGraduation: 2025,
            academicPerformance: '8.5 CGPA',
            areaOfInterest: 'Technology',
            interestedJobRole: 'Software Developer',
            jobSector: 'IT',
            preferredLocation: 'Bangalore',
            expectedSalaryRange: '6-10 LPA',
        };
        results.push('✅ Career input prepared');

        // 4. Test buildExcelContext
        const buildExcelContext = (input) => {
            const roleData = excelDataLoader.getDataForRole(input.interestedJobRole);
            const sectorData = excelDataLoader.getDataForSector(input.areaOfInterest);
            const jobFamilyData = excelDataLoader.getDataForJobFamily(input.interestedJobRole);
            const certData = excelDataLoader.getCertificationsForRole(input.interestedJobRole, input.areaOfInterest);
            return { roleData, sectorData, jobFamilyData, certData };
        };

        const excelContext = buildExcelContext(careerInput);
        results.push(`✅ Excel context built — Role: "${excelContext.roleData.matchedRole}" (exact: ${excelContext.roleData.exactMatch})`);
        results.push(`   AI Tools: ${excelContext.roleData.aiTools.length}, HI Skills: ${excelContext.roleData.humanSkills.length}, Certs: ${excelContext.certData.byJobTitle.length}`);

        // 5. Now test the actual controller via HTTP
        const http = require('http');

        // First, find a test user
        const User = require('./models/User');
        const testUser = await User.findOne({}).lean();
        if (!testUser) {
            results.push('❌ No users found in database');
        } else {
            results.push(`✅ Found test user: ${testUser.email || testUser.name}`);

            // Generate JWT token for the user
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            results.push('✅ JWT token generated');

            // Make the actual API call
            const requestBody = JSON.stringify(careerInput);

            const response = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 5000,
                    path: '/api/career-intelligence/generate',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Content-Length': Buffer.byteLength(requestBody),
                    },
                    timeout: 180000,
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, body: data }));
                });
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('Request timed out')));
                req.write(requestBody);
                req.end();
            });

            results.push(`✅ API Response Status: ${response.status}`);

            try {
                const body = JSON.parse(response.body);
                if (response.status === 200) {
                    results.push('✅ SUCCESS — Report generated!');
                    results.push(`   Report ID: ${body.report?.id}`);
                    results.push(`   Version: ${body.report?.version}`);
                    results.push(`   Status: ${body.report?.status}`);

                    const output = body.report?.output;
                    if (output) {
                        results.push(`   Tech Skills: ${output.technicalSkills?.coreSkills?.length || 0} core skills`);
                        results.push(`   AI Skills: ${output.aiSkills?.skills?.length || 0} skills, ${output.aiSkills?.tools?.length || 0} tools`);
                        results.push(`   HI Skills: ${output.humanIntelligenceSkills?.length || 0} quotients`);
                        results.push(`   Suggested Jobs: Entry=${output.suggestedJobs?.entryLevel?.length || 0}, Mid=${output.suggestedJobs?.midLevel?.length || 0}, Senior=${output.suggestedJobs?.seniorLevel?.length || 0}`);
                        results.push(`   Emerging Jobs: ${output.emergingJobs?.length || 0}`);
                        results.push(`   Career Roadmap: ${output.careerPathRoadmap?.length || 0} stages`);
                        results.push(`   Automated Tasks: ${output.futureScope?.automatedTasks?.length || 0}`);
                        results.push(`   Human Tasks: ${output.futureScope?.humanTasksThatRemain?.length || 0}`);
                        results.push(`   Free Courses: ${output.resourceMap?.freeCourses?.length || 0}`);
                        results.push(`   Qualifications: ${output.qualificationsNeeded?.length || 0}`);
                        results.push(`   AI Enhanced: ${output.dataSource?.aiEnhanced || false}`);
                        results.push(`   Match %: ${output.careerMatchPercentage}%`);
                        results.push(`   Confidence: ${output.aiConfidenceScore}%`);
                    }
                } else {
                    results.push('❌ FAILED — Error: ' + (body.error || body.message || JSON.stringify(body)));
                    if (body.details) results.push('   Details: ' + body.details);
                }
            } catch (e) {
                results.push('❌ Response parse error: ' + e.message);
                results.push('   Raw: ' + response.body.substring(0, 500));
            }
        }

    } catch (e) {
        results.push('❌ ERROR: ' + e.message);
        results.push('   Stack: ' + e.stack?.split('\n').slice(0, 3).join('\n'));
    } finally {
        await mongoose.disconnect();
    }

    const output = results.join('\n');
    fs.writeFileSync('test_full_result.txt', output);
    console.log(output);
}

testFullFlow();
