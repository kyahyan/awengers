// import fetch from 'node-fetch'; // Native fetch in Node 18+

async function verify() {
    try {
        console.log('Checking /api/servers...');
        const res = await fetch('http://localhost:3000/api/servers');
        if (!res.ok) {
            throw new Error(`Failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Server List:', JSON.stringify(data, null, 2));

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid server list format');
        }
        const s1 = data.find(s => s.id === '1');
        if (!s1 || s1.limit !== 100) {
            throw new Error('Server 1 configuration incorrect');
        }
        console.log('Verification Passed!');
    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
}

verify();
