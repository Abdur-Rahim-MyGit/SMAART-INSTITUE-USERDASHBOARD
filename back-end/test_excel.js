const excelDataLoader = require('./services/excelDataLoader');

try {
    const data = excelDataLoader.loadAllExcelData();

    console.log('\n=== Testing Role Query: "Software Developer" ===');
    const roleData = excelDataLoader.getDataForRole('Software Developer');
    console.log('Matched:', roleData.matchedRole, '| Exact:', roleData.exactMatch);
    console.log('AI Tools:', roleData.aiTools.length);
    console.log('AI Skills:', roleData.aiSkills.length);
    console.log('Tech Skills:', roleData.coreTechSkills.length);
    console.log('Certs:', roleData.certifications.length);
    console.log('HI Skills:', roleData.humanSkills.length);
    if (roleData.aiTools[0]) console.log('First AI Tool:', roleData.aiTools[0].toolName, '-', roleData.aiTools[0].toolDescription);
    if (roleData.humanSkills[0]) console.log('First HI Skill:', roleData.humanSkills[0].hiQuotient, '[' + roleData.humanSkills[0].quotientCode + ']');

    console.log('\n=== Testing Sector Query: "Technology" ===');
    const sectorData = excelDataLoader.getDataForSector('Technology');
    console.log('Matched Sector:', sectorData.matchedSector);
    console.log('Existing Roles:', sectorData.existingRoles.length);
    console.log('Emerging Roles:', sectorData.emergingRoles.length);

    console.log('\n=== Testing Job Family: "Software Engineering" ===');
    const jfData = excelDataLoader.getDataForJobFamily('Software Engineering');
    console.log('Matched:', jfData.matchedFamily);
    console.log('Qualifications:', jfData.qualifications.length);
    console.log('Tech Skills:', jfData.technicalSkills.length);
    console.log('Human Judgement:', jfData.humanJudgementSkills.length);
    console.log('AI Tools:', jfData.aiTools.length);
    console.log('Automated Tasks:', jfData.automatedTasks.length);
    console.log('Job Changes:', jfData.jobChanges.length);
    console.log('Human Tasks Remain:', jfData.humanTasksRemain.length);

    console.log('\n=== Testing Certs for "Data Analyst" ===');
    const certData = excelDataLoader.getCertificationsForRole('Data Analyst', 'Data Analytics');
    console.log('By Job Title:', certData.byJobTitle.length);
    console.log('By Domain:', certData.byDomain.length);
    console.log('Free Certs:', certData.freeCerts.length);

    console.log('\n=== Sectors Available ===');
    const sectors = excelDataLoader.getAllSectors();
    console.log('Master Sectors:', sectors.masterSectors.length);
    console.log('AI Data Sectors:', sectors.aiDataSectors.length);
    console.log('Job Families:', sectors.jobFamilies.length);
    console.log('All Roles:', sectors.allRoles.length);

    console.log('\n✅ ALL TESTS PASSED!');
} catch (err) {
    console.error('❌ TEST FAILED:', err);
}
