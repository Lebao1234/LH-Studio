import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, inviteMember, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let member;
let admin;
let createdProject;

beforeAll(async () => {
  owner = await bootstrapOwner();
  admin = await inviteMember(owner, 'admin', 'Admin User');
  member = await inviteMember(owner, 'member', 'Team Member');
});

describe('Projects API', () => {
  it('creates a new project with creator automatically assigned as manager', async () => {
    const res = await owner.post('/projects').send({
      code: 'PRJ1',
      title: 'Dự án Phim Hoạt Hình Alpha',
      category: 'KID',
      status: 'planning',
      priority: 'high',
      startDate: '2026-05-01',
      dueDate: '2026-08-30',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('PRJ1');
    expect(res.body.data.title).toBe('Dự án Phim Hoạt Hình Alpha');
    expect(res.body.data.status).toBe('planning');

    createdProject = res.body.data;

    // Check project members
    const membersRes = await owner.get(`/projects/${createdProject._id}/members`);
    expect(membersRes.status).toBe(200);
    const creator = membersRes.body.data.find((m) => String(m.user._id || m.userId) === owner.user._id);
    expect(creator).toBeDefined();
    expect(creator.role).toBe('manager');
  });

  it('rejects duplicate project code in the same studio', async () => {
    const res = await owner.post('/projects').send({
      code: 'PRJ1',
      title: 'Dự án trùng code',
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('validates date order (dueDate must be after or equal to startDate)', async () => {
    const res = await owner.post('/projects').send({
      code: 'INVALID-DATE',
      title: 'Dự án lỗi ngày',
      startDate: '2026-05-10',
      dueDate: '2026-05-01',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('generates next available project code', async () => {
    const res = await owner.get('/projects/next-code?category=KID');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('code');
    expect(res.body.data.prefix).toBe('KID');
    expect(res.body.data).toHaveProperty('sequence');
  });

  it('updates project fields and sets completion date when completed', async () => {
    const res = await owner.patch(`/projects/${createdProject._id}`).send({
      title: 'Alpha (Đã hoàn thiện)',
      status: 'completed',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Alpha (Đã hoàn thiện)');
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).toBeDefined();
  });

  it('adds, updates and removes project members', async () => {
    // Add member
    const addRes = await owner.post(`/projects/${createdProject._id}/members`).send({
      userId: member.user._id,
      role: 'editor',
    });
    expect(addRes.status).toBe(201);

    // Verify member exists in list
    const listRes = await owner.get(`/projects/${createdProject._id}/members`);
    const found = listRes.body.data.find((m) => String(m.user?._id || m.userId) === member.user._id);
    expect(found).toBeDefined();
    expect(found.role).toBe('editor');

    // Remove member
    const delRes = await owner.delete(`/projects/${createdProject._id}/members/${member.user._id}`);
    expect(delRes.status).toBe(200);

    // Verify removed
    const listAfterRes = await owner.get(`/projects/${createdProject._id}/members`);
    const after = listAfterRes.body.data.find((m) => String(m.user?._id || m.userId) === member.user._id);
    expect(after).toBeUndefined();
  });

  it('deletes a project without transactions', async () => {
    const tempRes = await owner.post('/projects').send({
      code: 'TEMP-DEL',
      title: 'Dự án tạm xóa',
    });
    expect(tempRes.status).toBe(201);
    const tempId = tempRes.body.data._id;

    const delRes = await owner.delete(`/projects/${tempId}`);
    expect(delRes.status).toBe(200);

    const getRes = await owner.get(`/projects/${tempId}`);
    expect(getRes.status).toBe(404);
  });
});
