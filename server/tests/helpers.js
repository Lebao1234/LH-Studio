import crypto from 'node:crypto';
import { afterAll, beforeAll, inject } from 'vitest';
import request from 'supertest';
import mongoose from '../shared/db/mongoose.js';
import { connectDatabase } from '../config/database.js';
import { createApp } from '../app.js';

export const ORIGIN = 'http://localhost:5173';
export const BOOTSTRAP_TOKEN = 'test-bootstrap-token-123456';
export const PASSWORD = 'Passw0rd!long';

export const app = createApp();

/** Each test file gets its own database on the shared in-memory replica set. */
export function useTestDatabase() {
  beforeAll(async () => {
    await connectDatabase(inject('mongoUri'), { dbName: `lh_test_${crypto.randomBytes(4).toString('hex')}` });
    // Unique / partial indexes must exist before the rules they enforce are tested.
    await Promise.all(Object.values(mongoose.models).map((m) => m.createCollection().then(() => m.syncIndexes())));
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
}

/** Browser-like client: keeps cookies and sends the CSRF header + Origin. */
export function client() {
  const agent = request.agent(app);
  let token;
  const wrap = (method) => (url) => {
    const req = agent[method](`/api/v1${url}`).set('Origin', ORIGIN).set('X-CSRF-Protection', '1');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  return {
    agent,
    get: wrap('get'),
    post: wrap('post'),
    patch: wrap('patch'),
    delete: wrap('delete'),
    setToken(t) {
      token = t;
    },
    get token() {
      return token;
    },
  };
}

let seq = 0;
export const uniqueEmail = (prefix = 'user') => `${prefix}.${Date.now()}.${(seq += 1)}@lh.test`;

export async function bootstrapOwner() {
  const c = client();
  const res = await c.post('/auth/register').send({
    name: 'Owner One',
    email: uniqueEmail('owner'),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    bootstrapToken: BOOTSTRAP_TOKEN,
    studioName: 'LH Studio Test',
  });
  if (res.status !== 201) throw new Error(`bootstrap failed: ${res.status} ${JSON.stringify(res.body)}`);
  c.setToken(res.body.data.accessToken);
  c.user = res.body.data.user;
  return c;
}

/** Owner invites a new person with `role`; returns a logged-in client for them. */
export async function inviteMember(owner, role = 'member', name = 'Member') {
  const email = uniqueEmail(role);
  const inv = await owner.post('/studios/current/members').send({ email, role });
  if (inv.status !== 201) throw new Error(`invite failed: ${inv.status} ${JSON.stringify(inv.body)}`);
  const inviteToken = new URL(inv.body.data.inviteUrl).searchParams.get('invite');

  const c = client();
  const res = await c.post('/auth/register').send({ name, email, password: PASSWORD, confirmPassword: PASSWORD, inviteToken });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  c.setToken(res.body.data.accessToken);
  c.user = res.body.data.user;
  c.email = email;
  return c;
}

