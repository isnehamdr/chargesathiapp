const BASE = process.env.EXPO_PUBLIC_API_URL;

export async function api(path, { method = 'GET', body, token } = {}) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw { status: 0, message: 'Cannot reach the server. Check your Wi-Fi.' };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const firstError = data.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw { status: res.status, message: firstError || data.message || 'Something went wrong.', errors: data.errors };
    }

    return data;
}