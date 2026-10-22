import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, inviteMember, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let alice;
let bob;
let viewer;
let outsiderMember; // studio member who is not in the project
let project;
let otherProject;
let episodeOfOther;

beforeAll(async () => {
  owner = await bootstrapOwner();
  alice = await inviteMember(owner, 'member', 'Alice');
  bob = await inviteMember(owner, 'member', 'Bob');
  viewer = await inviteMember(owner, 'viewer', 'Viewer');
  outsiderMember = await inviteMember(owner, 'member', 'Outsider');

  project = (await owner.post('/projects').send({ code: 'TSK', title: 'Task Project' })).body.data;
  otherProject = (await owner.post('/projects').send({ code: 'OTH', title: 'Other' })).body.data;
  episodeOfOther = (await owner.post(`/projects/${otherProject._id}/episodes`).send({ title: 'Ep 1' })).body.data;

  for (const u of [alice, bob, viewer]) {
    await owner.post(`/projects/${project._id}/members`).send({ userId: u.user._id, role: 'member' });
  }
});

describe('task assignments', () => {
  it('assigns multiple users to one task with one lead', async () => {
    const res = await owner.post('/tasks').send({
      projectId: project._id,
      title: 'Viết kịch bản',
      assignees: [
        { userId: alice.user._id, role: 'lead' },
        { userId: bob.user._id, role: 'contributor' },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.assignments).toHaveLength(2);
    expect(res.body.data.assignments.filter((a) => a.role === 'lead')).toHaveLength(1);

    const mine = await bob.get('/tasks?mine=true');
    expect(mine.body.data.map((t) => t._id)).toContain(res.body.data._id);
  });

  it('allows a task without assignees', async () => {
    const res = await owner.post('/tasks').send({ projectId: project._id, title: 'Unassigned' });
    expect(res.status).toBe(201);
    expect(res.body.data.assignments).toHaveLength(0);
  });

  it('prevents duplicate assignment of the same user', async () => {
    const task = (await owner.post('/tasks').send({ projectId: project._id, title: 'Dup' })).body.data;
    expect((await owner.post(`/tasks/${task._id}/assignments`).send({ userId: alice.user._id })).status).toBe(201);
    const dup = await owner.post(`/tasks/${task._id}/assignments`).send({ userId: alice.user._id });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('ALREADY_ASSIGNED');

    const inBody = await owner.post('/tasks').send({
      projectId: project._id,
      title: 'Dup body',
      assignees: [{ userId: alice.user._id }, { userId: alice.user._id }],
    });
    expect(inBody.status).toBe(400);
  });

  it('enforces at most one lead, including under concurrent requests', async () => {
    const task = (await owner.post('/tasks').send({ projectId: project._id, title: 'Lead race' })).body.data;
    const results = await Promise.all([
      owner.post(`/tasks/${task._id}/assignments`).send({ userId: alice.user._id, role: 'lead' }),
      owner.post(`/tasks/${task._id}/assignments`).send({ userId: bob.user._id, role: 'lead' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);

    const list = await owner.get(`/tasks/${task._id}/assignments`);
    expect(list.body.data.filter((a) => a.role === 'lead')).toHaveLength(1);

    const contributor = list.body.data.length === 1 ? null : list.body.data.find((a) => a.role !== 'lead');
    if (contributor) {
      const promote = await owner.patch(`/tasks/${task._id}/assignments/${contributor.userId}`).send({ role: 'lead' });
      expect(promote.status).toBe(409);
    }
  });

  it('rejects invalid assignees (viewer, non-project member, unknown user)', async () => {
    const task = (await owner.post('/tasks').send({ projectId: project._id, title: 'Invalid' })).body.data;
    const asViewer = await owner.post(`/tasks/${task._id}/assignments`).send({ userId: viewer.user._id });
    expect(asViewer.status).toBe(422);
    expect(asViewer.body.code).toBe('INVALID_ASSIGNEE');

    const notInProject = await owner.post(`/tasks/${task._id}/assignments`).send({ userId: outsiderMember.user._id });
    expect(notInProject.status).toBe(422);

    const unknown = await owner.post(`/tasks/${task._id}/assignments`).send({ userId: '64b000000000000000000000' });
    expect(unknown.status).toBe(422);
  });

  it('rejects an episode that belongs to another project', async () => {
    const res = await owner.post('/tasks').send({ projectId: project._id, episodeId: episodeOfOther._id, title: 'Mismatch' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('EPISODE_PROJECT_MISMATCH');
  });

  it('flags overdue tasks and filters them', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const t = (await owner.post('/tasks').send({ projectId: project._id, title: 'Late', dueDate: past })).body.data;
    expect(t.isOverdue).toBe(true);
    const overdue = await owner.get('/tasks?overdue=true');
    expect(overdue.body.data.map((x) => x._id)).toContain(t._id);
  });

  it('lets an assignee update status; sets completedAt on done', async () => {
    const task = (
      await owner.post('/tasks').send({ projectId: project._id, title: 'Status', assignees: [{ userId: alice.user._id, role: 'lead' }] })
    ).body.data;
    const res = await alice.patch(`/tasks/${task._id}`).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.data.completedAt).toBeTruthy();
  });
});

describe('date validation', () => {
  it('clears optional dates with null instead of storing 1970-01-01', async () => {
    const created = await owner.post('/projects').send({ code: 'NULLD', title: 'Null date', startDate: null, dueDate: '' })
    expect(created.status).toBe(201)
    expect(created.body.data.startDate ?? null).toBeNull()
    expect(created.body.data.dueDate ?? null).toBeNull()

    const withDate = await owner.patch(`/projects/${created.body.data._id}`).send({ dueDate: '2030-01-01' })
    expect(withDate.body.data.dueDate).toMatch(/^2030-01-01/)
    const cleared = await owner.patch(`/projects/${created.body.data._id}`).send({ dueDate: null })
    expect(cleared.body.data.dueDate ?? null).toBeNull()
  })

  it('rejects null for required dates', async () => {
    const res = await owner.get('/calendar?start=&end=')
    expect(res.status).toBe(400)
  })
})
