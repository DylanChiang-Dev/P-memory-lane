
const ML_API_BASE = 'https://pyqapi.3331322.xyz';
const email = '3331322@gmail.com';
const password = 'ca123456789';

async function getToken() {
    try {
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
