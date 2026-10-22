import { beforeAll, describe, expect, it } from 'vitest';
import { bootstrapOwner, inviteMember, useTestDatabase } from './helpers.js';

useTestDatabase();

let owner;
let admin;
let member;
let youtubeChannel;
let emptyChannel;

beforeAll(async () => {
  owner = await bootstrapOwner();
  admin = await inviteMember(owner, 'admin', 'Admin Manager');
  member = await inviteMember(owner, 'member', 'Regular Member');
});

describe('Channels API', () => {
  it('allows owner to create a channel', async () => {
    const res = await owner.post('/channels').send({
      platform: 'youtube',
      name: 'LH Studio Animation',
      handle: '@lh_studio_official',
      channelUrl: 'https://youtube.com/@lh_studio_official',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.platform).toBe('youtube');
    expect(res.body.data.name).toBe('LH Studio Animation');
    expect(res.body.data.status).toBe('active');

    youtubeChannel = res.body.data;
  });

  it('allows admin to create another channel', async () => {
    const res = await admin.post('/channels').send({
      platform: 'tiktok',
      name: 'LH Studio TikTok',
      handle: '@lh_tiktok',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.platform).toBe('tiktok');
  });

  it('forbids regular member from creating channels', async () => {
    const res = await member.post('/channels').send({
      platform: 'facebook',
      name: 'LH Fanpage',
    });

    expect(res.status).toBe(403);
  });

  it('lists channels with post counts and platform filter', async () => {
    const res = await owner.get('/channels?platform=youtube');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((c) => c.platform === 'youtube')).toBe(true);
    expect(res.body.data[0]).toHaveProperty('postCounts');
  });

  it('updates channel properties and status', async () => {
    const res = await owner.patch(`/channels/${youtubeChannel._id}`).send({
      handle: '@lh_studio_updated',
      status: 'inactive',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.handle).toBe('@lh_studio_updated');
    expect(res.body.data.status).toBe('inactive');
  });

  it('prevents deleting a channel that has linked posts', async () => {
    // Re-activate channel first
    await owner.patch(`/channels/${youtubeChannel._id}`).send({ status: 'active' });

    // Create a post linked to youtubeChannel
    const postRes = await owner.post('/posts').send({
      channelId: youtubeChannel._id,
      title: 'Video Teaser Tập 1',
      status: 'draft',
    });
    expect(postRes.status).toBe(201);

    // Attempt to delete channel
    const delRes = await owner.delete(`/channels/${youtubeChannel._id}`);
    expect(delRes.status).toBe(409);
    expect(delRes.body.code).toBe('CHANNEL_HAS_POSTS');
  });

  it('deletes an unused channel with no posts', async () => {
    const createRes = await owner.post('/channels').send({
      platform: 'other',
      name: 'Kênh tạm',
    });
    expect(createRes.status).toBe(201);
    emptyChannel = createRes.body.data;

    const delRes = await owner.delete(`/channels/${emptyChannel._id}`);
    expect(delRes.status).toBe(200);

    const getRes = await owner.get(`/channels/${emptyChannel._id}`);
    expect(getRes.status).toBe(404);
  });
});
