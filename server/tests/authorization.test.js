import { beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD, bootstrapOwner, client, inviteMember, uniqueEmail, useTestDatabase } from './helpers.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { User } from '../modules/users/user.model.js';
import { Studio } from '../modules/studios/studio.model.js';
import { StudioMember } from '../modules/studios/studioMember.model.js';

useTestDatabase();

let owner;
let member;
let viewer;
let outsider; // owner of a different studio
let project;

async function createForeignStudioOwner() {
  const email = uniqueEmail('foreign');
  const user = await User.create({ name: 'Foreign Owner', email, passwordHash: await hashPassword(PASSWORD) });
  const studio = await Studio.create({ name: 'Other Studio', slug: `other-${Date.now()}`, initialOwnerId: user._id });
  await StudioMember.create({ studioId: studio._id, userId: user._id, role: 'owner' });
  const c = client();
  const res = await c.post('/auth/login').send({ email, password: PASSWORD });
  c.setToken(res.body.data.accessToken);
  return c;
}

beforeAll(async () => {
  owner = await bootstrapOwner();
  member = await inviteMember(owner, 'member', 'Member');
  viewer = await inviteMember(owner, 'viewer', 'Viewer');
  outsider = await createForeignStudioOwner();

  const res = await owner.post('/projects').send({ code: 'P1', title: 'Phim 1' });
  project = res.body.data;
  await owner.post(`/projects/${project._id}/members`).send({ userId: viewer.user._id, role: 'member' });
});

describe('viewer', () => {
  it('can read permitted projects but cannot modify anything', async () => {
    expect((await viewer.get(`/projects/${project._id}`)).status).toBe(200);
    expect((await viewer.patch(`/projects/${project._id}`).send({ title: 'Hacked' })).status).toBe(403);
    expect((await viewer.post('/projects').send({ code: 'V1', title: 'Nope' })).status).toBe(403);
    expect((await viewer.post('/tasks').send({ projectId: project._id, title: 'Nope' })).status).toBe(403);
  });
});

describe('member', () => {
  it('cannot see projects they are not a member of', async () => {
    expect((await member.get(`/projects/${project._id}`)).status).toBe(404);
    const list = await member.get('/projects');
    expect(list.body.data.map((p) => p._id)).not.toContain(project._id);
  });

  it('cannot manage studio members or channels', async () => {
    expect((await member.post('/studios/current/members').send({ email: uniqueEmail(), role: 'admin' })).status).toBe(403);
    expect((await member.post('/channels').send({ platform: 'youtube', name: 'X' })).status).toBe(403);
  });

  it('is denied every finance endpoint', async () => {
    for (const path of ['/finance/categories', '/finance/transactions', '/finance/summary', '/finance/expenses-by-category']) {
      expect((await member.get(path)).status).toBe(403);
    }
    expect((await viewer.get('/finance/transactions')).status).toBe(403);
    expect((await member.get('/dashboard/financial-summary')).status).toBe(403);
  });
});

describe('cross-studio isolation', () => {
  it('rejects access to another studio resources', async () => {
    expect((await outsider.get(`/projects/${project._id}`)).status).toBe(404);
    expect((await outsider.patch(`/projects/${project._id}`).send({ title: 'x' })).status).toBe(404);
    expect((await outsider.get(`/projects/${project._id}/episodes`)).status).toBe(404);
    const tasks = await outsider.get(`/tasks?projectId=${project._id}`);
    expect(tasks.status).toBe(200);
    expect(tasks.body.data).toHaveLength(0);
  });

  it('cannot pick another studio via X-Studio-Id', async () => {
    const me = await owner.get('/studios/current');
    const res = await outsider.get('/projects').set('X-Studio-Id', me.body.data.studio._id);
    expect(res.status).toBe(403);
  });

  it('cannot attach a foreign channel to a post', async () => {
    const ch = await owner.post('/channels').send({ platform: 'youtube', name: 'LH Main' });
    const res = await outsider.post('/posts').send({ channelId: ch.body.data._id, title: 'Steal' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_CHANNEL');
  });
});

describe('studio members', () => {
  it('protects the last/initial owner', async () => {
    const members = await owner.get('/studios/current/members');
    const ownerRow = members.body.data.find((m) => m.role === 'owner');
    const demote = await owner.patch(`/studios/current/members/${ownerRow._id}`).send({ role: 'member' });
    expect(demote.status).toBe(403);
    expect(demote.body.code).toBe('PROTECTED_OWNER');
  });

  it('prevents admins from granting owner', async () => {
    const admin = await inviteMember(owner, 'admin', 'Admin');
    const members = await owner.get('/studios/current/members');
    const memberRow = members.body.data.find((m) => String(m.userId) === String(member.user._id));
    const res = await admin.patch(`/studios/current/members/${memberRow._id}`).send({ role: 'owner' });
    expect(res.status).toBe(403);
  });

  it('deactivated members lose access immediately', async () => {
    const temp = await inviteMember(owner, 'member', 'Temp');
    const members = await owner.get('/studios/current/members');
    const row = members.body.data.find((m) => String(m.userId) === String(temp.user._id));
    expect((await owner.delete(`/studios/current/members/${row._id}`)).status).toBe(200);
    const res = await temp.get('/projects');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NO_STUDIO_ACCESS');
  });
});

