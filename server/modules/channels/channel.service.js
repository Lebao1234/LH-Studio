import mongoose from 'mongoose';
import { conflict, notFound } from '../../shared/errors/AppError.js';
import { compact, escapeRegex } from '../../shared/utils/validators.js';
import { Post } from '../posts/post.model.js';
import { Channel } from './channel.model.js';

export async function listChannels(ctx, q) {
  const filter = { studioId: ctx.studioId };
  if (q.platform) filter.platform = q.platform;
  if (q.status) filter.status = q.status;
  if (q.search) filter.name = new RegExp(escapeRegex(q.search), 'i');

  const channels = await Channel.find(filter).sort({ status: 1, platform: 1, name: 1 }).lean();
  const counts = await Post.aggregate([
    { $match: { channelId: { $in: channels.map((c) => c._id) } } },
    { $group: { _id: { channelId: '$channelId', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const byChannel = new Map();
  for (const c of counts) {
    const key = String(c._id.channelId);
    const entry = byChannel.get(key) ?? { total: 0 };
    entry[c._id.status] = c.n;
    entry.total += c.n;
    byChannel.set(key, entry);
  }
  return channels.map((c) => ({ ...c, id: String(c._id), postCounts: byChannel.get(String(c._id)) ?? { total: 0 } }));
}

export async function getChannelOrThrow(ctx, channelId) {
  if (!mongoose.isValidObjectId(channelId)) throw notFound('Không tìm thấy kênh.');
  const channel = await Channel.findOne({ _id: channelId, studioId: ctx.studioId });
  if (!channel) throw notFound('Không tìm thấy kênh.');
  return channel;
}

export async function createChannel(ctx, input) {
  return Channel.create({ ...compact(input), studioId: ctx.studioId });
}

export async function updateChannel(ctx, channelId, input) {
  const channel = await getChannelOrThrow(ctx, channelId);
  channel.set(compact(input));
  await channel.save();
  return channel;
}

export async function deleteChannel(ctx, channelId) {
  const channel = await getChannelOrThrow(ctx, channelId);
  if (await Post.exists({ channelId: channel._id })) {
    throw conflict('Kênh đã có bài viết. Hãy chuyển sang "Ngừng hoạt động" thay vì xóa.', 'CHANNEL_HAS_POSTS');
  }
  await channel.deleteOne();
}
