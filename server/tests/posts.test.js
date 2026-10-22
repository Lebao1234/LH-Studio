import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let channel;
let projectA;
let projectB;
let episodeA;

const future = (h = 24) => new Date(Date.now() + h * 3_600_000).toISOString();

beforeAll(async () => {
  owner = await bootstrapOwner();
  channel = (await owner.post('/channels').send({ platform: 'tiktok', name: 'LH TikTok' })).body.data;
  projectA = (await owner.post('/projects').send({ code: 'PA', title: 'A' })).body.data;
  projectB = (await owner.post('/projects').send({ code: 'PB', title: 'B' })).body.data;
  episodeA = (await owner.post(`/projects/${projectA._id}/episodes`).send({ title: 'A1' })).body.data;
});

describe('posts', () => {
  it('creates an independent post without project or episode', async () => {
    const res = await owner.post('/posts').send({ channelId: channel._id, title: 'Behind the scenes' });
    expect(res.status).toBe(201);
    expect(res.body.data.projectId).toBeNull();
    expect(res.body.data.episodeId).toBeNull();
    expect(res.body.data.status).toBe('draft');

    const independent = await owner.get('/posts?independent=true');
    expect(independent.body.data.map((p) => p._id)).toContain(res.body.data._id);
  });

  it('creates a project- and episode-linked post', async () => {
    const res = await owner.post('/posts').send({ channelId: channel._id, title: 'Trailer', projectId: projectA._id, episodeId: episodeA._id });
    expect(res.status).toBe(201);
    expect(res.body.data.project.code).toBe('PA');
    expect(res.body.data.episode.title).toBe('A1');
  });

  it('rejects an episode/project mismatch and an episode without project', async () => {
    const mismatch = await owner.post('/posts').send({ channelId: channel._id, title: 'Bad', projectId: projectB._id, episodeId: episodeA._id });
    expect(mismatch.status).toBe(422);
    expect(mismatch.body.code).toBe('EPISODE_PROJECT_MISMATCH');

    const noProject = await owner.post('/posts').send({ channelId: channel._id, title: 'Bad', episodeId: episodeA._id });
    expect(noProject.status).toBe(422);
    expect(noProject.body.code).toBe('EPISODE_REQUIRES_PROJECT');
  });

  it('requires a valid scheduledAt for scheduled posts', async () => {
    const missing = await owner.post('/posts').send({ channelId: channel._id, title: 'S', status: 'scheduled' });
    expect(missing.status).toBe(422);
    expect(missing.body.code).toBe('SCHEDULE_REQUIRED');

    const invalid = await owner.post('/posts').send({ channelId: channel._id, title: 'S', status: 'scheduled', scheduledAt: 'not-a-date' });
    expect(invalid.status).toBe(400);

    const past = await owner.post('/posts').send({ channelId: channel._id, title: 'S', status: 'scheduled', scheduledAt: '2020-01-01T00:00:00Z' });
    expect(past.status).toBe(422);

    const ok = await owner.post('/posts').send({ channelId: channel._id, title: 'S', status: 'scheduled', scheduledAt: future() });
    expect(ok.status).toBe(201);
  });

  it('marks a post published with publishedAt and shows it on the calendar', async () => {
    const post = (await owner.post('/posts').send({ channelId: channel._id, title: 'Pub', status: 'scheduled', scheduledAt: future(2) })).body.data;
    const pub = await owner.patch(`/posts/${post._id}`).send({ status: 'published' });
    expect(pub.status).toBe(200);
    expect(pub.body.data.publishedAt).toBeTruthy();

    const start = new Date(Date.now() - 86_400_000).toISOString();
    const end = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const cal = await owner.get(`/calendar?start=${start}&end=${end}&platform=tiktok`);
    expect(cal.status).toBe(200);
    expect(cal.body.data.map((p) => p._id)).toContain(post._id);
  });

  it('records cumulative metrics as exact integer strings', async () => {
    const post = (await owner.post('/posts').send({ channelId: channel._id, title: 'Viral' })).body.data;
    const res = await owner.post(`/posts/${post._id}/metrics`).send({ views: '9007199254740993', likes: 12 });
    expect(res.status).toBe(201);
    expect(res.body.data.views).toBe('9007199254740993');
    const detail = await owner.get(`/posts/${post._id}`);
    expect(detail.body.data.latestMetric.views).toBe('9007199254740993');
  });
});
