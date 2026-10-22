import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, inviteMember, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let member;
let project;
let channel;

beforeAll(async () => {
  owner = await bootstrapOwner();
  member = await inviteMember(owner, 'member', 'Team Member');

  // Create project
  const pRes = await owner.post('/projects').send({
    code: 'DSH',
    title: 'Dashboard Test Project',
    status: 'in_progress',
  });
  project = pRes.body.data;

  // Create episode
  await owner.post(`/projects/${project._id}/episodes`).send({
    title: 'Tập 1 Dashboard',
    status: 'scripting',
  });

  // Create task
  await owner.post('/tasks').send({
    projectId: project._id,
    title: 'Vẽ storyboard',
    status: 'in_progress',
    priority: 'high',
  });

  // Create channel and scheduled post
  const cRes = await owner.post('/channels').send({
    platform: 'youtube',
    name: 'Dashboard Channel',
  });
  channel = cRes.body.data;

  const future = new Date(Date.now() + 3 * 86_400_000);
  await owner.post('/posts').send({
    channelId: channel._id,
    title: 'Bài đăng sắp tới',
    status: 'scheduled',
    scheduledAt: future.toISOString(),
  });
});

describe('Dashboard API', () => {
  it('returns overview statistics with accurate counts', async () => {
    const res = await owner.get('/dashboard/overview');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    expect(data.totalProjects).toBeGreaterThanOrEqual(1);
    expect(data.activeProjects).toBeGreaterThanOrEqual(1);
    expect(data.totalEpisodes).toBeGreaterThanOrEqual(1);
    expect(data.pendingTasks).toBeGreaterThanOrEqual(1);
    expect(data.upcomingPosts).toBeGreaterThanOrEqual(1);
    expect(data.members).toBeGreaterThanOrEqual(2);
    expect(data.recentActivity).toBeInstanceOf(Array);
    expect(data.recentActivity.length).toBeGreaterThan(0);
  });

  it('returns project status and episode status aggregation breakdown', async () => {
    const res = await owner.get('/dashboard/project-status');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('projects');
    expect(res.body.data).toHaveProperty('episodes');
    expect(res.body.data.projects.in_progress).toBeGreaterThanOrEqual(1);
    expect(res.body.data.episodes.scripting).toBeGreaterThanOrEqual(1);
  });

  it('returns tasks summary breakdown by status and priority', async () => {
    const res = await owner.get('/dashboard/tasks-summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('byStatus');
    expect(res.body.data).toHaveProperty('byPriority');
    expect(res.body.data).toHaveProperty('mine');
    expect(res.body.data.byStatus.in_progress).toBeGreaterThanOrEqual(1);
    expect(res.body.data.byPriority.high).toBeGreaterThanOrEqual(1);
  });

  it('returns upcoming posts within scheduled window', async () => {
    const res = await owner.get('/dashboard/upcoming-posts');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title).toBe('Bài đăng sắp tới');
    expect(res.body.data[0]).toHaveProperty('channel');
  });

  it('breaks posts down by channel platform in the overview', async () => {
    const res = await owner.get('/dashboard/overview');

    expect(res.body.data.postsByPlatform.youtube).toBeGreaterThanOrEqual(1);
  });

  it('returns real production throughput for the current week', async () => {
    const before = (await owner.get('/dashboard/production')).body.data;

    await owner.post('/posts').send({ channelId: channel._id, title: 'Đã đăng hôm nay', status: 'published' });
    const done = await owner.post('/tasks').send({ projectId: project._id, title: 'Xong rồi', status: 'done', dueDate: new Date().toISOString() });
    expect(done.status).toBe(201);

    const res = await owner.get('/dashboard/production?period=week');
    expect(res.status).toBe(200);
    const data = res.body.data;

    expect(data.period).toBe('week');
    expect(data.series).toHaveLength(7);
    expect(data.series.map((s) => s.label)).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
    expect(data.totals.published).toBe(before.totals.published + 1);
    expect(data.totals.tasksCompleted).toBe(before.totals.tasksCompleted + 1);
    expect(data.totals.tasksDue).toBe(before.totals.tasksDue + 1);
    expect(data.series.reduce((a, s) => a + s.published, 0)).toBe(data.totals.published);
    expect(data.previous).toEqual({ published: 0, tasksCompleted: 0 });
  });

  it('buckets month by day and quarter by week, falling back to week for unknown periods', async () => {
    const month = (await owner.get('/dashboard/production?period=month')).body.data;
    expect(month.series.length).toBeGreaterThanOrEqual(28);
    expect(month.totals.published).toBeGreaterThanOrEqual(1);

    const quarter = (await owner.get('/dashboard/production?period=quarter')).body.data;
    expect(quarter.series.length).toBeGreaterThanOrEqual(13);
    expect(quarter.series[0].label).toBe('Tuần 1');

    const fallback = (await owner.get('/dashboard/production?period=bogus')).body.data;
    expect(fallback.period).toBe('week');
  });

  it('allows studio manager to access financial summary on dashboard', async () => {
    const res = await owner.get('/dashboard/financial-summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('month');
    expect(res.body.data).toHaveProperty('cashflow');
  });

  it('forbids regular member from accessing financial summary', async () => {
    const res = await member.get('/dashboard/financial-summary');

    expect(res.status).toBe(403);
  });
});
