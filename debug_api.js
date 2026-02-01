const API_URL = 'http://127.0.0.1:4000/api';

const check = async () => {
    try {
        console.log("Checking Projects...");
        const pRes = await fetch(`${API_URL}/deploy/projects`);
        console.log(`Projects Status: ${pRes.status}`);
        if (pRes.ok) {
            const data = await pRes.json();
            console.log(`Projects Data Type: ${typeof data}`);
            console.log(`Projects Count: ${Array.isArray(data) ? data.length : 'N/A'}`);
            if (Array.isArray(data) && data.length > 0) {
                console.log("First Project ID:", data[0].id);
            }
        } else {
             console.log("Projects Body:", await pRes.text());
        }

        console.log("Checking History...");
        const hRes = await fetch(`${API_URL}/deploy/history`);
        console.log(`History Status: ${hRes.status}`);
        if (hRes.ok) {
            const data = await hRes.json();
            console.log(`History Data Type: ${typeof data}`);
            console.log(`History Value:`, JSON.stringify(data, null, 2));
        } else {
             console.log("History Body:", await hRes.text());
        }

    } catch (e) {
        console.error("Fetch failed:", e.message);
        if(e.cause) console.error(e.cause);
    }
};

check();
