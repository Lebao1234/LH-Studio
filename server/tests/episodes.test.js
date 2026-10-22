import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, inviteMember, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let editor;
let viewer;
let project;
let ep1;
let ep2;

beforeAll(async () => {
  owner = await bootstrapOwner();
  editor = await inviteMember(owner, 'member', 'Editor Member');
  viewer = await inviteMember(owner, 'viewer', 'Viewer Member');

  const pRes = await owner.post('/projects').send({
    code: 'EPS',
    title: 'Dự án Phim Hoạt Hình Episodic',
  });
  project = pRes.body.data;

  // Add editor and viewer to project
  await owner.post(`/projects/${project._id}/members`).send({ userId: editor.user._id, role: 'editor' });
  await owner.post(`/projects/${project._id}/members`).send({ userId: viewer.user._id, role: 'viewer' });
});

describe('Episodes API', () => {
  it('creates episode under project with auto-incremented episode number and generated code', async () => {
    const res = await owner.post(`/projects/${project._id}/episodes`).send({
      title: 'Tập 1: Khởi nguồn',
      description: 'Mô tả mở đầu series',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.episodeNumber).toBe(1);
    expect(res.body.data.code).toBe('EPS-E01');
    expect(res.body.data.title).toBe('Tập 1: Khởi nguồn');
    expect(res.body.data.projectId).toBe(project._id);

    ep1 = res.body.data;
  });

  it('automatically increments episode number for subsequent episodes', async () => {
    const res = await owner.post(`/projects/${project._id}/episodes`).send({
      title: 'Tập 2: Gian nan',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.episodeNumber).toBe(2);
    expect(res.body.data.code).toBe('EPS-E02');

    ep2 = res.body.data;
  });

  it('rejects duplicate episode number within the same project', async () => {
    const res = await owner.post(`/projects/${project._id}/episodes`).send({
      episodeNumber: 1,
      title: 'Tập trùng số 1',
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EPISODE_NUMBER_TAKEN');
  });

  it('allows project editor to create and update episodes', async () => {
    const createRes = await editor.post(`/projects/${project._id}/episodes`).send({
      title: 'Tập 3: Tạo bởi Editor',
    });
    expect(createRes.status).toBe(201);
    const ep3Id = createRes.body.data._id;

    const patchRes = await editor.patch(`/episodes/${ep3Id}`).send({
      script: 'Nội dung kịch bản AI do editor biên soạn...',
      status: 'scripting',
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe('scripting');
    expect(patchRes.body.data.script).toBe('Nội dung kịch bản AI do editor biên soạn...');
  });

  it('forbids viewer from creating or updating episodes', async () => {
    const createRes = await viewer.post(`/projects/${project._id}/episodes`).send({
      title: 'Tập bởi Viewer',
    });
    expect(createRes.status).toBe(403);

    const patchRes = await viewer.patch(`/episodes/${ep1._id}`).send({
      title: 'Viewer sửa tên',
    });
    expect(patchRes.status).toBe(403);
  });

  it('lists episodes for a project', async () => {
    const res = await owner.get(`/projects/${project._id}/episodes`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0]).toHaveProperty('tasks');
  });

  it('gets a single episode with project info', async () => {
    const res = await owner.get(`/episodes/${ep1._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(ep1._id);
    expect(res.body.data.project.code).toBe('EPS');
  });

  it('deletes episode and unlinks associated tasks', async () => {
    // Create a task linked to ep2
    const taskRes = await owner.post('/tasks').send({
      projectId: project._id,
      episodeId: ep2._id,
      title: 'Làm kỹ xảo cho Tập 2',
    });
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data._id;

    // Delete episode 2
    const delRes = await owner.delete(`/episodes/${ep2._id}`);
    expect(delRes.status).toBe(200);

    // Episode is gone
    const epCheck = await owner.get(`/episodes/${ep2._id}`);
    expect(epCheck.status).toBe(404);

    // Task still exists, but episodeId is unlinked (null)
    const taskCheck = await owner.get(`/tasks/${taskId}`);
    expect(taskCheck.status).toBe(200);
    expect(taskCheck.body.data.episodeId).toBeNull();
  });
});
