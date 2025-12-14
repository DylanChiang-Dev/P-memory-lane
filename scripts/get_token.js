const ML_API_BASE = process.env.ML_API_BASE || 'https://pyqapi.3331322.xyz';
const email = process.env.ML_EMAIL;
const password = process.env.ML_PASSWORD;

async function getToken() {
    try {
        if (!email || !password) {
            console.error('Missing credentials: set ML_EMAIL and ML_PASSWORD (and optionally ML_API_BASE).');
            process.exit(1);
        }
        const response = await fetch(`${ML_API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
            console.log(data.data.access_token);
        } else {
            console.error('Login failed:', data);
        }
    } catch (e) {
        console.error(e);
    }
}
getToken();
