import { SignJWT } from 'jose'

const COOKIE_NAME = 'sea-star-session'

export async function mintSessionToken(
  username = 'alicia',
  role = 'super_admin',
  displayName = 'Alicia',
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.ADMIN_COOKIE_SECRET!)
  return new SignJWT({ username, role, displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(secret)
}

export function sessionCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${token}`
}

export { COOKIE_NAME }
