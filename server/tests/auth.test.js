import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { BOOTSTRAP_TOKEN, PASSWORD, bootstrapOwner, client, inviteMember, uniqueEmail, useTestDatabase } from './helpers.js';
import { REFRESH_COOKIE } from '../modules/auth/tokens.js';

useTestDatabase();

const refreshCookieOf = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith(`${REFRESH_COOKIE}=`));

describe('register', () => {
  it('rejects invalid payloads with field errors', async () => {
    const res = await client().post('/auth/register').send({ name: 'A', email: 'nope', password: 'short', confirmPassword: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    const paths = res.body.errors.map((e) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('rejects a wrong bootstrap token', async () => {
    const res = await client()
      .post('/auth/register')
      .send({ name: 'Eve', email: uniqueEmail(), password: PASSWORD, confirmPassword: PASSWORD, bootstrapToken: 'wrong-token-but-long-enough' });
    expect(res.status).toBe(403);
  });

  it('bootstraps the initial owner once, then closes bootstrap', async () => {
    const owner = await bootstrapOwner();
    expect(owner.user.passwordHash).toBeUndefined();
    const me = await owner.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.memberships[0].role).toBe('owner');
    expect(me.body.data.memberships[0].status).toBe('active');

    const again = await client()
      .post('/auth/register')
      .send({ name: 'Second', email: uniqueEmail(), password: PASSWORD, confirmPassword: PASSWORD, bootstrapToken: BOOTSTRAP_TOKEN });
    expect(again.status).toBe(403);
    expect(again.body.code).toBe('BOOTSTRAP_CLOSED');

    const status = await client().get('/auth/registration-status');
    expect(status.body.data.bootstrapAvailable).toBe(false);
  });

  it('registers direct user into existing studio with pending status', async () => {
    const res = await client().post('/auth/register').send({ name: 'PendingUser', email: uniqueEmail(), password: PASSWORD, confirmPassword: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.data.memberships[0].status).toBe('pending');
    expect(res.body.data.memberships[0].role).toBe('member');
  });

  it('registers through an invitation with the invited role, and rejects duplicate email', async () => {
    const owner = await bootstrapOwnerOnce();
    const member = await inviteMember(owner, 'viewer');
    const me = await member.get('/auth/me');
    expect(me.body.data.memberships[0].role).toBe('viewer');

    // Invite the same email again, then try to register: email already exists.
    const inv = await owner.post('/studios/current/members').send({ email: member.email, role: 'member' });
    expect(inv.status).toBe(409);
  });

  it('rejects registering a duplicate email with an invitation', async () => {
    const owner = await bootstrapOwnerOnce();
    const email = uniqueEmail('dup');
    const inv1 = await owner.post('/studios/current/members').send({ email, role: 'member' });
    const token1 = new URL(inv1.body.data.inviteUrl).searchParams.get('invite');
    const ok = await client().post('/auth/register').send({ name: 'Dup', email, password: PASSWORD, confirmPassword: PASSWORD, inviteToken: token1 });
    expect(ok.status).toBe(201);

    const reuse = await client().post('/auth/register').send({ name: 'Dup', email, password: PASSWORD, confirmPassword: PASSWORD, inviteToken: token1 });
    expect(reuse.status).toBe(409);
    expect(reuse.body.code).toBe('EMAIL_TAKEN');
  });
});

let sharedOwner;
async function bootstrapOwnerOnce() {
  if (sharedOwner) return sharedOwner;
  // The "bootstraps" test above created the studio; log that owner in again.
  const { User } = await import('../modules/users/user.model.js');
  const { StudioMember } = await import('../modules/studios/studioMember.model.js');
  const ownerMembership = await StudioMember.findOne({ role: 'owner' }).lean();
  const user = await User.findById(ownerMembership.userId).lean();
  const c = client();
  const res = await c.post('/auth/login').send({ email: user.email, password: PASSWORD });
  c.setToken(res.body.data.accessToken);
  sharedOwner = c;
  return c;
}

describe('login', () => {
  it('logs in, issues an HttpOnly refresh cookie and never returns the refresh token in the body', async () => {
    const owner = await bootstrapOwnerOnce();
    const me = await owner.get('/auth/me');
    const c = client();
    const res = await c.post('/auth/login').send({ email: me.body.data.user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeUndefined();
    const cookie = refreshCookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('responds identically to unknown email and wrong password', async () => {
    const owner = await bootstrapOwnerOnce();
    const me = await owner.get('/auth/me');
    const wrongPass = await client().post('/auth/login').send({ email: me.body.data.user.email, password: 'Wrong12345' });
    const unknown = await client().post('/auth/login').send({ email: uniqueEmail('ghost'), password: 'Wrong12345' });
    expect(wrongPass.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPass.body).toEqual(unknown.body);
  });

  it('rate limits repeated failed logins for one account with 429 + Retry-After', async () => {
    const email = uniqueEmail('brute');
    const statuses = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await client().post('/auth/login').send({ email, password: 'Wrong12345' });
      statuses.push(res.status);
      if (res.status === 429) {
        expect(res.headers['retry-after']).toBeDefined();
        expect(res.body.code).toBe('RATE_LIMITED');
      }
    }
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it('requires the CSRF header on cookie endpoints', async () => {
    const res = await client().agent.post('/api/v1/auth/refresh').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_HEADER_MISSING');
    const evil = await client().agent.post('/api/v1/auth/refresh').set('Origin', 'https://evil.example').set('X-CSRF-Protection', '1');
    expect(evil.status).toBe(403);
    expect(evil.body.code).toBe('CSRF_ORIGIN_REJECTED');
  });
});

describe('sessions', () => {
  async function freshLogin() {
    const owner = await bootstrapOwnerOnce();
    const me = await owner.get('/auth/me');
    const c = client();
    const res = await c.post('/auth/login').send({ email: me.body.data.user.email, password: PASSWORD });
    c.setToken(res.body.data.accessToken);
    return { c, cookie: refreshCookieOf(res).split(';')[0] };
  }

  it('rotates refresh tokens and detects reuse of an old token', async () => {
    const { c, cookie: first } = await freshLogin();

    const r1 = await c.post('/auth/refresh');
    expect(r1.status).toBe(200);
    const second = refreshCookieOf(r1).split(';')[0];
    expect(second).not.toBe(first);

    // Replaying the first token outside the grace window = theft: whole session revoked.
    const { AuthSession } = await import('../modules/auth/authSession.model.js');
    await AuthSession.updateMany({}, { $set: { rotatedAt: new Date(Date.now() - 60_000) } });
    const replay = await client().agent.post('/api/v1/auth/refresh').set('X-CSRF-Protection', '1').set('Cookie', first);
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('REFRESH_REUSED_OR_REVOKED');

    const afterReuse = await client().agent.post('/api/v1/auth/refresh').set('X-CSRF-Protection', '1').set('Cookie', second);
    expect(afterReuse.status).toBe(401);

    // Access tokens of the revoked session stop working immediately.
    const me = await c.get('/auth/me');
    expect(me.status).toBe(401);
    expect(me.body.code).toBe('SESSION_REVOKED');
  });

  it('logout revokes the session and clears the cookie', async () => {
    const { c, cookie } = await freshLogin();
    const out = await c.post('/auth/logout');
    expect(out.status).toBe(200);
    expect(refreshCookieOf(out)).toMatch(/Expires=Thu, 01 Jan 1970/);

    const refresh = await client().agent.post('/api/v1/auth/refresh').set('X-CSRF-Protection', '1').set('Cookie', cookie);
    expect(refresh.status).toBe(401);
    expect((await c.get('/auth/me')).status).toBe(401);
  });

  it('rejects expired, malformed, wrong-algorithm and missing access tokens', async () => {
    const { c } = await freshLogin();
    const payload = jwt.decode(c.token);
    const expired = jwt.sign({ sid: payload.sid, typ: 'access', exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_ACCESS_SECRET, {
      subject: payload.sub,
      issuer: 'lh-studio-api',
      audience: 'lh-studio-client',
    });
    const res = await client().agent.get('/api/v1/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');

    const none = jwt.sign({ sid: payload.sid, typ: 'access' }, '', { algorithm: 'none', subject: payload.sub });
    expect((await client().agent.get('/api/v1/auth/me').set('Authorization', `Bearer ${none}`)).status).toBe(401);
    expect((await client().agent.get('/api/v1/auth/me').set('Authorization', 'Bearer garbage')).status).toBe(401);
    expect((await client().agent.get('/api/v1/projects')).status).toBe(401);
  });

  it('change-password requires the current password and signs out other sessions', async () => {
    const { c } = await freshLogin();
    const { c: other } = await freshLogin();

    const bad = await c.post('/auth/change-password').send({ currentPassword: 'nope1234', newPassword: 'NewPassw0rd!', confirmPassword: 'NewPassw0rd!' });
    expect(bad.status).toBe(400);

    const ok = await c.post('/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'NewPassw0rd!', confirmPassword: 'NewPassw0rd!' });
    expect(ok.status).toBe(200);
    expect((await c.get('/auth/me')).status).toBe(200);
    expect((await other.get('/auth/me')).status).toBe(401);

    // Restore for the remaining tests.
    await c.post('/auth/change-password').send({ currentPassword: 'NewPassw0rd!', newPassword: PASSWORD, confirmPassword: PASSWORD });
  });
});

