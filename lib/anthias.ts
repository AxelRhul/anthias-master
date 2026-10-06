import axios from 'axios';

const user = process.env.ANTHIAS_USER;
const password = process.env.ANTHIAS_PASSWORD;

// Single HTTP client for every call to the Anthias devices. If the devices have "Basic authentication"
// enabled in their settings, set ANTHIAS_USER / ANTHIAS_PASSWORD and it is applied to all requests.
export const anthias = axios.create({
    auth: user && password ? { username: user, password } : undefined,
});
