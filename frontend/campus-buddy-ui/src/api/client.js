const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body = null) {
  const token = localStorage.getItem('token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (res.status === 401) {
    // Treat as error if it's an intentional login request 401 (bad credentials)
    if (path.includes('/auth/login')) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Invalid credentials');
    }
    
    // Otherwise it's an expired token — redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong');
  return data;
}

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const patch = (path, body) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path);

const client = { get, post, patch, del };
export default client;
