import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const contentRoot = path.join(root, 'content', 'entries')
const FORCE = process.argv.includes('--force')
const META_ONLY = process.argv.includes('--meta-only')

const LANDSCAPE = [1600, 1067]
const PORTRAIT = [1067, 1600]
const SQUARE = [1400, 1400]

const SEEDS = [
  {
    slug: 'demo-01', title: '极光落在黑沙滩', category: '自然风光', tags: ['极光', '海岸', '夜景'],
    date: '2026-03-14', location: '冰岛 · 维克', word: 'AURORA', count: 6,
    palette: ['#0b1f33', '#1f5c7a', '#7fd1d9'],
    summary: '三月的维克，极光在玄武岩柱上方铺开，风把海雾吹成一层薄纱。',
  },
  {
    slug: 'demo-02', title: '雾中的山脊线', category: '自然风光', tags: ['山', '晨雾', '黑白'],
    date: '2026-01-08', location: '四川 · 牛背山', word: 'RIDGE', count: 5,
    palette: ['#1a1a1f', '#3d4a5c', '#c9d4e0'],
    summary: '日出前半小时，山脊从云海里浮出来，只剩一条浅浅的线。',
  },
  {
    slug: 'demo-03', title: '城市醒来之前', category: '城市街头', tags: ['城市', '清晨', '街拍'],
    date: '2025-11-23', location: '上海 · 外滩', word: 'DAWN', count: 3,
    palette: ['#2a1e2e', '#6b4a63', '#f0b8a8'],
    summary: '五点半的外滩，清洁工和第一班轮渡比游客更早到场。',
  },
  {
    slug: 'demo-04', title: '雨夜便利店', category: '城市街头', tags: ['雨', '夜景', '霓虹'],
    date: '2025-12-02', location: '东京 · 新宿', word: 'NEON', count: 3,
    palette: ['#141018', '#4b1f3a', '#ff5f7e'],
    summary: '雨把霓虹揉碎在柏油路上，便利店的灯光是整条街最暖的一块。',
  },
  {
    slug: 'demo-05', title: '窗边的静物', category: '静物', tags: ['静物', '光', '室内'],
    date: '2026-02-11', location: '家中', word: 'STILL', count: 2,
    palette: ['#2b2118', '#7a5a3a', '#f2d3a0'],
    summary: '下午四点的斜光落在旧木桌上，一只杯子就能撑起一个下午。',
  },
  {
    slug: 'demo-06', title: '海边的风', category: '人像', tags: ['人像', '海', '逆光'],
    date: '2025-09-18', location: '青岛', word: 'TIDE', count: 3,
    palette: ['#0f2436', '#2f6f8f', '#bfe3ee'],
    summary: '退潮后的礁石上，风把头发吹得乱七八糟，反而比摆拍好看。',
  },
  {
    slug: 'demo-07', title: '沙漠里的星轨', category: '自然风光', tags: ['星空', '沙漠', '长曝光'],
    date: '2025-08-05', location: '甘肃 · 敦煌', word: 'ORBIT', count: 4,
    palette: ['#0a0f26', '#233a7a', '#9fb4ff'],
    summary: '两个小时的曝光，星星在沙丘上方画出一圈同心圆。',
  },
  {
    slug: 'demo-08', title: '老城区的午后', category: '城市街头', tags: ['街拍', '老城', '光影'],
    date: '2025-10-30', location: '重庆', word: 'ALLEY', count: 3,
    palette: ['#231d16', '#6b5236', '#e8c89a'],
    summary: '巷子里的光被楼间距切成一条一条，行人从光里穿过。',
  },
  {
    slug: 'demo-09', title: '山间民宿的清晨', category: '旅行', tags: ['旅行', '民宿', '清晨'],
    date: '2026-04-02', location: '莫干山', word: 'MORNING', count: 2,
    palette: ['#132a22', '#2f6b52', '#b8e0c8'],
    summary: '竹海起雾的清晨，民宿的木平台像漂在云上。',
  },
  {
    slug: 'demo-10', title: '花市', category: '静物', tags: ['花', '市集', '色彩'],
    date: '2026-02-14', location: '昆明', word: 'BLOOM', count: 3,
    palette: ['#2b1520', '#8a3550', '#ffc2c8'],
    summary: '斗南的凌晨，成捆的玫瑰还带着露水，颜色浓得不像真的。',
  },
  {
    slug: 'demo-11', title: '雪后寺庙', category: '旅行', tags: ['雪', '建筑', '寺庙'],
    date: '2026-01-20', location: '京都', word: 'TEMPLE', count: 3,
    palette: ['#1a1f26', '#4a5a6b', '#e8eef5'],
    summary: '雪落在木阶和石灯笼上，整座院子只剩下踩雪的声音。',
  },
  {
    slug: 'demo-12', title: '地铁末班车', category: '城市街头', tags: ['地铁', '夜景', '通勤'],
    date: '2025-11-10', location: '北京', word: 'TRANSIT', count: 2,
    palette: ['#101014', '#3a3a4a', '#8f8fb0'],
    summary: '末班车的车厢里，每个人都靠着自己的影子打盹。',
  },
  {
    slug: 'demo-13', title: '湖面上的晨雾', category: '自然风光', tags: ['湖', '晨雾', '倒影'],
    date: '2025-12-19', location: '泸沽湖', word: 'MIST', count: 4,
    palette: ['#10202a', '#2e5a6b', '#a8d8e0'],
    summary: '日出前湖面平得像一块玻璃，雾贴着水走。',
  },
  {
    slug: 'demo-14', title: '咖啡与旧书', category: '静物', tags: ['咖啡', '书', '暖光'],
    date: '2026-03-01', location: '家中', word: 'WARMTH', count: 2,
    palette: ['#241a12', '#6b4a2e', '#e0b98a'],
    summary: '周末早上的固定节目：一杯手冲，一本读到一半的旧书。',
  },
  {
    slug: 'demo-15', title: '夏日泳池', category: '人像', tags: ['人像', '夏天', '泳池'],
    date: '2025-07-21', location: '三亚', word: 'POOL', count: 3,
    palette: ['#0e2a33', '#2f7a8a', '#a8e6ef'],
    summary: '正午的水面晃得人睁不开眼，蓝色被晒得发白。',
  },
  {
    slug: 'demo-16', title: '港口黄昏', category: '旅行', tags: ['港口', '黄昏', '船'],
    date: '2025-09-02', location: '挪威 · 卑尔根', word: 'HARBOR', count: 3,
    palette: ['#1c1a24', '#5a4a6b', '#e0c8a8'],
    summary: '渔船回港，桅杆在暮色里排成一片细细的线。',
  },
  {
    slug: 'demo-17', title: '城市天际线', category: '城市街头', tags: ['建筑', '天际线', '蓝调'],
    date: '2026-01-03', location: '深圳', word: 'SKYLINE', count: 2,
    palette: ['#0d1522', '#2a3f6b', '#9ab0e0'],
    summary: '蓝调时刻只有二十分钟，楼宇的窗格一盏盏亮起来。',
  },
  {
    slug: 'demo-18', title: '林间小路', category: '自然风光', tags: ['森林', '徒步', '绿'],
    date: '2025-10-12', location: '杭州 · 九溪', word: 'FOREST', count: 4,
    palette: ['#122218', '#2f5a35', '#b0d8a0'],
    summary: '雨后进山，绿得发黑，光从叶缝里漏下来。',
  },
  {
    slug: 'demo-19', title: '夜市烟火', category: '城市街头', tags: ['夜市', '烟火气', '小吃'],
    date: '2025-08-16', location: '成都', word: 'EMBER', count: 3,
    palette: ['#2a1410', '#7a3a25', '#ffb080'],
    summary: '炭火、油烟和吆喝声混在一起，是夏天最热闹的一小块。',
  },
  {
    slug: 'demo-20', title: '雪原上的小屋', category: '旅行', tags: ['雪', '小屋', '北欧'],
    date: '2026-02-25', location: '芬兰 · 罗瓦涅米', word: 'CABIN', count: 3,
    palette: ['#151a22', '#3a4a5c', '#d8e4f0'],
    summary: '零下二十度，小屋的窗是整片雪原上唯一的光。',
  },
  {
    slug: 'demo-21', title: '冬夜的车站', category: '城市街头', tags: ['冬', '车站', '夜景'],
    date: '2026-01-28', location: '哈尔滨', word: 'STATION', count: 2,
    palette: ['#0f1218', '#33405a', '#a8b8d8'],
    summary: '站台的灯把雪照成蓝色，等车的人把领口竖得很高。',
  },
  {
    slug: 'demo-22', title: '盐湖的倒影', category: '自然风光', tags: ['盐湖', '倒影', '天空'],
    date: '2025-07-09', location: '青海 · 茶卡', word: 'MIRROR', count: 3,
    palette: ['#12202a', '#3f6a7a', '#d8eef2'],
    summary: '没有风的下午，云和人都被湖面复制了一遍。',
  },
  {
    slug: 'demo-23', title: '巷口的理发店', category: '城市街头', tags: ['街拍', '小店', '日常'],
    date: '2025-11-02', location: '广州', word: 'CORNER', count: 3,
    palette: ['#1a1410', '#5a4030', '#e0c0a0'],
    summary: '转椅、老镜子、墙上的年历，二十年好像没变过。',
  },
  {
    slug: 'demo-24', title: '海雾里的灯塔', category: '自然风光', tags: ['海', '灯塔', '雾'],
    date: '2025-06-14', location: '福建 · 平潭', word: 'BEACON', count: 2,
    palette: ['#101820', '#3a5a6a', '#c0d8e0'],
    summary: '雾大到看不见海平线，灯塔的光每隔十二秒扫过来一次。',
  },
  {
    slug: 'demo-25', title: '旧火车厢', category: '静物', tags: ['旧物', '旅行', '怀旧'],
    date: '2025-09-27', location: '云南 · 建水', word: 'CARRIAGE', count: 2,
    palette: ['#201810', '#5a4028', '#d8b890'],
    summary: '木座椅被磨得发亮，窗外的风景慢得像另一时代。',
  },
  {
    slug: 'demo-26', title: '屋顶的猫', category: '静物', tags: ['猫', '屋顶', '午后'],
    date: '2026-04-11', location: '泉州', word: 'ROOFTOP', count: 2,
    palette: ['#2a2018', '#7a5a40', '#f0d0a8'],
    summary: '红砖屋顶晒得发烫，它换了个姿势继续睡。',
  },
  {
    slug: 'demo-27', title: '稻田里的风', category: '自然风光', tags: ['稻田', '风', '夏天'],
    date: '2025-08-24', location: '浙江 · 松阳', word: 'FIELD', count: 3,
    palette: ['#1a2410', '#5a7a30', '#d8e8a0'],
    summary: '稻穗快熟了，风一过就整片倒下去又立起来。',
  },
  {
    slug: 'demo-28', title: '午夜面馆', category: '城市街头', tags: ['深夜', '小店', '烟火气'],
    date: '2026-02-03', location: '兰州', word: 'MIDNIGHT', count: 3,
    palette: ['#201410', '#5a3020', '#f0b080'],
    summary: '凌晨一点，汤锅还冒着热气，最后一桌客人慢慢吃面。',
  },
  {
    slug: 'demo-29', title: '高原上的经幡', category: '旅行', tags: ['高原', '经幡', '风'],
    date: '2025-10-05', location: '青海 · 青海湖', word: 'PRAYER', count: 2,
    palette: ['#0f1a2a', '#3a5a8a', '#d0e0f0'],
    summary: '风把经幡吹得笔直，远处的湖蓝得没有层次。',
  },
  {
    slug: 'demo-30', title: '雨后的玻璃幕墙', category: '城市街头', tags: ['建筑', '雨', '反射'],
    date: '2026-03-22', location: '上海 · 陆家嘴', word: 'GLASS', count: 3,
    palette: ['#101820', '#2a4a5a', '#b0d0e0'],
    summary: '雨停后的十分钟，整栋楼把天空和对面的人行道都装了进去。',
  },
]

const CAPTION_WORDS = ['远景', '细节', '光影', '特写', '环境', '余韵']

function mulberry32(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeSvg({ width, height, palette, word, entryIndex, photoIndex, total }) {
  const random = mulberry32(entryIndex * 977 + photoIndex * 131 + 17)
  const circles = Array.from({ length: 4 }, (_, index) => {
    const cx = Math.round(random() * width)
    const cy = Math.round(random() * height)
    const radius = Math.round((0.18 + random() * 0.42) * Math.min(width, height))
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${palette[(index + 1) % palette.length]}" opacity="0.55"/>`
  }).join('')

  const pad = Math.round(width * 0.055)
  const small = Math.round(width * 0.016)
  const big = Math.round(width * 0.07)
  const label = String(entryIndex + 1).padStart(2, '0')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette[0]}"/>
      <stop offset="1" stop-color="${palette[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.74" cy="0.2" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g transform="rotate(${Math.round(random() * 50 - 25)} ${width / 2} ${height / 2})">${circles}</g>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <g font-family="Segoe UI, Arial, sans-serif" fill="#ffffff">
    <text x="${pad}" y="${pad + small}" font-size="${small}" letter-spacing="${Math.round(width * 0.008)}" opacity="0.55">DEMO ${label} · ${word}</text>
    <text x="${pad}" y="${height - pad - big * 0.35}" font-size="${big}" font-weight="600" opacity="0.92">${String(photoIndex + 1).padStart(2, '0')}</text>
    <text x="${pad}" y="${height - pad}" font-size="${small}" letter-spacing="${Math.round(width * 0.008)}" opacity="0.5">PHOTO ATLAS · PLACEHOLDER</text>
  </g>
</svg>`
}

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

await mkdir(contentRoot, { recursive: true })

let created = 0
let skipped = 0
let photos = 0

for (let index = 0; index < SEEDS.length; index += 1) {
  const seed = SEEDS[index]
  const dir = path.join(contentRoot, seed.slug)

  if (!FORCE && !META_ONLY && (await exists(dir))) {
    skipped += 1
    continue
  }
  if (META_ONLY && !(await exists(dir))) {
    skipped += 1
    continue
  }

  const photosDir = path.join(dir, 'photos')
  await mkdir(photosDir, { recursive: true })

  const captions = {}
  const count = seed.count

  for (let photoIndex = 0; photoIndex < count; photoIndex += 1) {
    const shape = (index + photoIndex) % 5
    const [width, height] =
      shape === 2 ? PORTRAIT : shape === 4 ? SQUARE : LANDSCAPE
    const fileName = `${String(photoIndex + 1).padStart(2, '0')}.jpg`
    const svg = makeSvg({
      width,
      height,
      palette: seed.palette,
      word: seed.word,
      entryIndex: index,
      photoIndex,
      total: count,
    })

    if (!META_ONLY) {
      await sharp(Buffer.from(svg))
        .jpeg({ quality: 82, progressive: true })
        .toFile(path.join(photosDir, fileName))
      photos += 1
    }

    captions[fileName] = `${CAPTION_WORDS[photoIndex % CAPTION_WORDS.length]} · ${seed.title}`
  }

  const meta = {
    id: seed.slug,
    title: seed.title,
    category: seed.category,
    tags: seed.tags,
    date: seed.date,
    location: seed.location,
    summary: seed.summary,
    description: `拍摄于${seed.location}。这组照片是在同一次出门里陆续拍下的，光线和心情都在慢慢变化，挑出 ${count} 张放在这里。`,
    cover: '01.jpg',
    captions,
    demo: true,
  }

  await writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  created += 1
}

console.log(`[demo] 新建 ${created} 组、${photos} 张占位图，跳过 ${skipped} 组（已存在）`)
if (skipped) console.log('[demo] 需要重新生成请加 --force')
