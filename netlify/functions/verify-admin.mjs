// Verify admin status - check if user is authorized as admin
export default async function handler(req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Get user email from JWT token or request body
    const authHeader = req.headers.get('authorization');
    const email = req.headers.get('x-user-email') || null;

    // Admin email - set this to your email
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bitty0218@gmail.com';

    const isAdmin = email === ADMIN_EMAIL;

    return Response.json({ isAdmin, email });
  } catch (error) {
    console.error('Admin verification error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
