// Stub for the app's API client: the film never calls the network. Every named
// API is an inert Proxy (add the names the mounted components import).
const inert = new Proxy({}, { get: () => () => Promise.resolve({ data: { data: {} } }) });
export const api = inert;
// export const usersAPI = inert;
// export const linksAPI = inert;
export default inert;
