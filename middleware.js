export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/properties/add', '/properties/sell', '/profile', '/properties/saved', '/messages'],
};
