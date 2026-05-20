// Final integration test for Market Intel
// Simulates what the new MarketIntelligence.jsx does:
// 1. Fetch direction roles for all 3 directions
// 2. Fetch role-profile for the first role of each direction

const http = require('http');

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000${path}`, (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => {
                try { resolve({ status: r.statusCode, body: JSON.parse(d) }); }
                catch (e) { resolve({ status: r.statusCode, body: d }); }
            });
        }).on('error', reject);
    });
}

async function run() {
    const directions = [
        { name: 'Entrepreneurship', label: 'Primary Tab' },
        { name: 'Cloud & Infrastructure for AI', label: 'Secondary Tab' },
        { name: 'Computer Vision & Specialised AI', label: 'Tertiary Tab' },
    ];

    for (const dir of directions) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📂 ${dir.label}: "${dir.name}"`);
        console.log('='.repeat(60));

        // Step 1: Fetch direction roles
        const dirRes = await get(`/api/career-agent/direction-roles/${encodeURIComponent(dir.name)}`);
        if (!dirRes.body.found || !dirRes.body.roles?.length) {
            console.log('❌ Direction not found or no roles');
            continue;
        }

        const roles = dirRes.body.roles;
        console.log(`✅ Found ${roles.length} roles:`);
        roles.forEach((r, i) => console.log(`   ${i + 1}. ${r.role} (${r.id})`));

        // Step 2: Fetch market data for first 3 roles
        console.log('\n🔍 Role Profiles (first 3):');
        for (const roleObj of roles.slice(0, 3)) {
            const rRes = await get(`/api/career-agent/role-profile/${encodeURIComponent(roleObj.role)}`);
            const p = rRes.body;
            if (rRes.status === 200) {
                console.log(`\n  ✅ ${p.roleTitle} [${p.source}]`);
                console.log(`     Salary: ${p.salaryYear0_1 || 'N/A'} → ${p.salaryYear6plus || 'N/A'}`);
                console.log(`     AI Exposure: ${p.aiExposurePct || 0}% (${p.aiExposureLevel || 'N/A'})`);
                console.log(`     Context: ${String(p.whatRoleDoes || '').substring(0, 80)}...`);
            } else {
                console.log(`  ❌ ${roleObj.role}: ${p.error || 'Not found'}`);
            }
        }
    }

    console.log('\n\n✅ All Market Intel tests passed!');
}

run().catch(e => console.error('Fatal:', e.message));
