/**
 * DEVELOPMENT-ONLY seed data for LH Studio.
 *
 *   npm run seed:dev            # seeds an empty database
 *   npm run seed:dev -- --reset # DROPS the database first (dev only)
 *
 * Passwords are never committed: set SEED_PASSWORD or a random one is generated
 * and printed once.
 */
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import mongoose from '../shared/db/mongoose.js';
import { hashPassword } from '../modules/auth/auth.service.js';
import { User } from '../modules/users/user.model.js';
import { Studio } from '../modules/studios/studio.model.js';
import { StudioMember } from '../modules/studios/studioMember.model.js';
import { Project } from '../modules/projects/project.model.js';
import { ProjectMember } from '../modules/projects/projectMember.model.js';
import { Episode } from '../modules/episodes/episode.model.js';
import { Task } from '../modules/tasks/task.model.js';
import { TaskAssignment } from '../modules/tasks/taskAssignment.model.js';
import { Channel } from '../modules/channels/channel.model.js';
import { Post } from '../modules/posts/post.model.js';
import { PostMetric } from '../modules/posts/postMetric.model.js';
import { FinanceCategory } from '../modules/finances/financeCategory.model.js';
import { Transaction } from '../modules/finances/transaction.model.js';
import { TransactionPayment } from '../modules/finances/transactionPayment.model.js';
import { DEFAULT_FINANCE_CATEGORIES } from '../modules/finances/finance.defaults.js';

if (env.isProd) {
  console.error('Refusing to seed: NODE_ENV=production.');
  process.exit(1);
}

const reset = process.argv.includes('--reset');
const day = 86_400_000;
const at = (days, hour = 9) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  await connectDatabase();
  if (reset) {
    console.log(`Dropping database "${mongoose.connection.name}" (--reset)...`);
    await mongoose.connection.dropDatabase();
  } else if (await Studio.exists({})) {
    console.error('Database already contains a studio. Re-run with --reset to wipe it (development only).');
    process.exit(1);
  }
  await Promise.all(Object.values(mongoose.models).map((m) => m.createCollection().then(() => m.syncIndexes())));

  const password = process.env.SEED_PASSWORD || `Dev-${crypto.randomBytes(6).toString('base64url')}1`;
  const passwordHash = await hashPassword(password);

  const people = [
    { key: 'owner', name: 'LÃª HoÃ ng (Owner)', email: 'owner@lhstudio.dev', role: 'owner' },
    { key: 'admin', name: 'Minh Anh (Admin)', email: 'admin@lhstudio.dev', role: 'admin' },
    { key: 'editor', name: 'Quá»‘c Báº£o', email: 'bao@lhstudio.dev', role: 'member' },
    { key: 'ai', name: 'Thu Trang', email: 'trang@lhstudio.dev', role: 'member' },
    { key: 'writer', name: 'Äá»©c Huy', email: 'huy@lhstudio.dev', role: 'member' },
    { key: 'viewer', name: 'KhÃ¡ch xem', email: 'viewer@lhstudio.dev', role: 'viewer' },
  ];
  const users = {};
  for (const p of people) users[p.key] = await User.create({ name: p.name, email: p.email, passwordHash });

  const studio = await Studio.create({
    name: 'LH Studio',
    slug: 'lh-studio',
    description: '[DEV SEED] AI-powered content production workspace',
    initialOwnerId: users.owner._id,
  });
  const studioId = studio._id;
  await StudioMember.insertMany(people.map((p) => ({ studioId, userId: users[p.key]._id, role: p.role })));

  // â”€â”€â”€ Projects, episodes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const projects = await Project.insertMany([
    { studioId, code: 'TKV', title: 'Truyá»n Ká»³ Viá»‡t', description: 'Series hoáº¡t hÃ¬nh AI vá» truyá»n thuyáº¿t Viá»‡t Nam.', status: 'in_progress', priority: 'high', startDate: at(-40), dueDate: at(45), createdBy: users.owner._id },
    { studioId, code: 'SGN', title: 'SÃ i GÃ²n NgÃ y áº¤y', description: 'Phim tÃ i liá»‡u ngáº¯n tÃ¡i hiá»‡n báº±ng AI.', status: 'planning', priority: 'medium', startDate: at(5), dueDate: at(90), createdBy: users.admin._id },
    { studioId, code: 'KID', title: 'BÃ© Há»c Chá»¯', description: 'Video giÃ¡o dá»¥c cho tráº» em.', status: 'completed', priority: 'low', startDate: at(-120), dueDate: at(-20), completedAt: at(-22), createdBy: users.owner._id },
  ]);
  const [tkv, sgn, kid] = projects;

  await ProjectMember.insertMany([
    { projectId: tkv._id, userId: users.owner._id, role: 'manager' },
    { projectId: tkv._id, userId: users.editor._id, role: 'editor' },
    { projectId: tkv._id, userId: users.ai._id, role: 'creator' },
    { projectId: tkv._id, userId: users.writer._id, role: 'member' },
    { projectId: tkv._id, userId: users.viewer._id, role: 'member' },
    { projectId: sgn._id, userId: users.admin._id, role: 'manager' },
    { projectId: sgn._id, userId: users.writer._id, role: 'creator' },
    { projectId: kid._id, userId: users.owner._id, role: 'manager' },
    { projectId: kid._id, userId: users.ai._id, role: 'creator' },
  ]);

  const episodeStatuses = ['completed', 'completed', 'editing', 'generating', 'scripting', 'planned'];
  const tkvEpisodes = await Episode.insertMany(
    episodeStatuses.map((status, i) => ({
      projectId: tkv._id,
      episodeNumber: i + 1,
      title: ['SÆ¡n Tinh Thá»§y Tinh', 'ThÃ¡nh GiÃ³ng', 'Má»µ ChÃ¢u Trá»ng Thá»§y', 'Chá»­ Äá»“ng Tá»­', 'Sá»± tÃ­ch Há»“ GÆ°Æ¡m', 'Láº¡c Long QuÃ¢n'][i],
      status,
      assignedTo: [users.editor._id, users.ai._id, users.writer._id][i % 3],
      dueDate: at(-20 + i * 10),
      completedAt: status === 'completed' ? at(-25 + i * 5) : undefined,
      createdBy: users.owner._id,
    })),
  );
  await Episode.insertMany([
    { projectId: sgn._id, episodeNumber: 1, title: 'Chá»£ Báº¿n ThÃ nh 1960', status: 'scripting', assignedTo: users.writer._id, dueDate: at(30), createdBy: users.admin._id },
    { projectId: kid._id, episodeNumber: 1, title: 'Chá»¯ A', status: 'completed', completedAt: at(-30), createdBy: users.owner._id },
  ]);

  // â”€â”€â”€ Tasks & assignments (multi-assignee, one lead) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const taskDefs = [
    { project: tkv, ep: 2, title: 'Dá»±ng báº£n cáº¯t thÃ´ táº­p 3', type: 'editing', status: 'in_progress', priority: 'high', due: 2, team: [['editor', 'lead'], ['ai', 'contributor']] },
    { project: tkv, ep: 3, title: 'Táº¡o hÃ¬nh nhÃ¢n váº­t Chá»­ Äá»“ng Tá»­', type: 'ai_generation', status: 'todo', priority: 'urgent', due: -1, team: [['ai', 'lead']] },
    { project: tkv, ep: 4, title: 'Viáº¿t ká»‹ch báº£n táº­p 5', type: 'script', status: 'review', priority: 'medium', due: 4, team: [['writer', 'lead'], ['owner', 'contributor']] },
    { project: tkv, ep: null, title: 'Chuáº©n hoÃ¡ báº£ng mÃ u series', type: 'other', status: 'todo', priority: 'low', due: 12, team: [] },
    { project: tkv, ep: 1, title: 'Duyá»‡t báº£n cuá»‘i táº­p 2', type: 'review', status: 'done', priority: 'high', due: -6, team: [['owner', 'lead']] },
    { project: sgn, ep: null, title: 'NghiÃªn cá»©u tÆ° liá»‡u áº£nh 1960', type: 'script', status: 'in_progress', priority: 'medium', due: 6, team: [['writer', 'lead'], ['admin', 'contributor']] },
    { project: kid, ep: null, title: 'Xuáº¥t báº£n phá»¥ Ä‘á»', type: 'editing', status: 'done', priority: 'low', due: -25, team: [['ai', 'lead']] },
  ];
  for (const t of taskDefs) {
    const task = await Task.create({
      studioId,
      projectId: t.project._id,
      episodeId: t.ep !== null && t.project === tkv ? tkvEpisodes[t.ep]._id : undefined,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      dueDate: at(t.due, 18),
      completedAt: t.status === 'done' ? at(t.due - 1) : undefined,
      createdBy: users.owner._id,
    });
    if (t.team.length) {
      await TaskAssignment.insertMany(t.team.map(([key, role]) => ({ taskId: task._id, userId: users[key]._id, role, assignedBy: users.owner._id })));
    }
  }

  // â”€â”€â”€ Channels, posts, metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [yt, tt, fb] = await Channel.insertMany([
    { studioId, platform: 'youtube', name: 'LH Studio Official', handle: '@lhstudio', channelUrl: 'https://youtube.com/@lhstudio' },
    { studioId, platform: 'tiktok', name: 'LH Studio TikTok', handle: '@lhstudio.vn' },
    { studioId, platform: 'facebook', name: 'LH Studio Fanpage' },
  ]);
  const posts = await Post.insertMany([
    { studioId, channelId: yt._id, projectId: tkv._id, episodeId: tkvEpisodes[0]._id, title: 'Truyá»n Ká»³ Viá»‡t â€“ Táº­p 1: SÆ¡n Tinh Thá»§y Tinh', status: 'published', publishedAt: at(-18, 20), publishedBy: users.admin._id, createdBy: users.admin._id },
    { studioId, channelId: tt._id, projectId: tkv._id, episodeId: tkvEpisodes[1]._id, title: 'Teaser ThÃ¡nh GiÃ³ng 30s', status: 'published', publishedAt: at(-6, 19), publishedBy: users.editor._id, createdBy: users.editor._id },
    { studioId, channelId: yt._id, projectId: tkv._id, episodeId: tkvEpisodes[2]._id, title: 'Truyá»n Ká»³ Viá»‡t â€“ Táº­p 3', status: 'scheduled', scheduledAt: at(3, 20), createdBy: users.admin._id },
    { studioId, channelId: fb._id, title: 'Háº­u trÆ°á»ng: quy trÃ¬nh lÃ m phim báº±ng AI', status: 'scheduled', scheduledAt: at(5, 11), createdBy: users.admin._id },
    { studioId, channelId: tt._id, title: 'Tuyá»ƒn cá»™ng tÃ¡c viÃªn dá»±ng phim', status: 'draft', createdBy: users.writer._id },
    { studioId, channelId: fb._id, projectId: sgn._id, title: 'Giá»›i thiá»‡u dá»± Ã¡n SÃ i GÃ²n NgÃ y áº¤y', status: 'scheduled', scheduledAt: at(10, 9), createdBy: users.admin._id },
  ]);
  await PostMetric.insertMany([
    { postId: posts[0]._id, recordedAt: at(-15), views: 12_400n, likes: 830n, comments: 96n, shares: 40n },
    { postId: posts[0]._id, recordedAt: at(-1), views: 48_950n, likes: 2_310n, comments: 301n, shares: 155n },
    { postId: posts[1]._id, recordedAt: at(-1), views: 215_000n, likes: 18_200n, comments: 640n, shares: 1_900n },
  ]);

  // â”€â”€â”€ Finance: categories, transactions, partial payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const cats = await FinanceCategory.insertMany(DEFAULT_FINANCE_CATEGORIES.map((c) => ({ ...c, studioId })));
  const cat = (code) => cats.find((c) => c.code === code)._id;

  const txDefs = [
    { title: '[DEV] Há»£p Ä‘á»“ng tÃ i trá»£ Truyá»n Ká»³ Viá»‡t', type: 'income', cat: 'SPONSOR', project: tkv, total: 120_000_000n, expected: at(20), payments: [[50_000_000n, -30], [20_000_000n, -5]] },
    { title: '[DEV] Doanh thu YouTube thÃ¡ng trÆ°á»›c', type: 'income', cat: 'ADS', total: 18_500_000n, expected: at(-10), payments: [[18_500_000n, -8]] },
    { title: '[DEV] Dá»‹ch vá»¥ dá»±ng video cho Ä‘á»‘i tÃ¡c', type: 'income', cat: 'SERVICE', total: 35_000_000n, expected: at(12), payments: [] },
    { title: '[DEV] GÃ³i Midjourney + Runway nÄƒm', type: 'expense', cat: 'AI_TOOLS', total: 24_000_000n, expected: at(-15), payments: [[24_000_000n, -15]] },
    { title: '[DEV] ThÃ¹ lao cá»™ng tÃ¡c viÃªn dá»±ng phim', type: 'expense', cat: 'STAFF', project: tkv, total: 30_000_000n, expected: at(8), payments: [[10_000_000n, -3]] },
    { title: '[DEV] Cháº¡y quáº£ng cÃ¡o ra máº¯t táº­p 3', type: 'expense', cat: 'MARKETING', project: tkv, total: 8_000_000n, expected: at(4), payments: [], status: 'planned' },
    { title: '[DEV] Mua á»• cá»©ng lÆ°u trá»¯', type: 'expense', cat: 'EQUIPMENT', total: 6_500_000n, expected: at(-40), payments: [[6_500_000n, -40]] },
  ];
  for (const t of txDefs) {
    const paid = t.payments.reduce((sum, [amount]) => sum + amount, 0n);
    const status = paid === 0n ? t.status ?? 'pending' : paid === t.total ? 'paid' : 'partially_paid';
    const tx = await Transaction.create({
      studioId,
      projectId: t.project?._id ?? null,
      categoryId: cat(t.cat),
      title: t.title,
      type: t.type,
      totalAmount: t.total,
      paidAmount: paid,
      paymentCount: t.payments.length,
      status,
      expectedDate: t.expected,
      createdBy: users.owner._id,
    });
    if (t.payments.length) {
      await TransactionPayment.insertMany(
        t.payments.map(([amount, days], i) => ({
          transactionId: tx._id,
          studioId,
          amount,
          paidAt: at(days, 14),
          method: i % 2 ? 'cash' : 'bank_transfer',
          note: '[DEV SEED]',
          recordedBy: users.owner._id,
          idempotencyKey: `seed-${tx._id}-${i}`,
        })),
      );
    }
  }

  console.log('\nDevelopment seed complete. Accounts (password shown once):');
  for (const p of people) console.log(`  ${p.role.padEnd(6)}  ${p.email}`);
  console.log(`\n  password: ${password}\n`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());

