/**
 * 生成 K记 App 图标
 * 设计：深蓝底 + 金色 K + ¥ 符号
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const SIZES = [16, 32, 48, 64, 128, 256, 512];

// ====== K记 SVG 图标 ======
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0f23"/>
      <stop offset="100%" stop-color="#1a1a3e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5d06b"/>
      <stop offset="50%" stop-color="#f0a820"/>
      <stop offset="100%" stop-color="#c78510"/>
    </linearGradient>
    <linearGradient id="coinShine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.3)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>

  <!-- 背景圆角矩形 -->
  <rect x="0" y="0" width="512" height="512" rx="110" ry="110" fill="url(#bg)"/>

  <!-- 装饰：细边框 -->
  <rect x="8" y="8" width="496" height="496" rx="104" ry="104"
        fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

  <!-- 装饰：外围圆环 -->
  <circle cx="256" cy="256" r="200" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- 金币底纹（半透明） -->
  <circle cx="256" cy="256" r="130" fill="url(#coinShine)" opacity="0.08"/>

  <!-- 主文字：K -->
  <text x="256" y="310" font-family="Georgia, 'Times New Roman', serif"
        font-size="260" font-weight="bold" fill="url(#gold)"
        text-anchor="middle" dominant-baseline="middle"
        letter-spacing="-5">K</text>

  <!-- ¥ 符号 -->
  <text x="256" y="425" font-family="Arial, Helvetica, sans-serif"
        font-size="48" font-weight="900" fill="#f0a820"
        text-anchor="middle" opacity="0.9">¥</text>

  <!-- 底部装饰线 -->
  <line x1="220" y1="446" x2="292" y2="446" stroke="#f0a820" stroke-width="2" opacity="0.4"/>
</svg>`;

async function generate() {
  console.log('🎨 生成 K记 图标...\n');

  // SVG
  const svgPath = path.join(PUBLIC, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon);
  console.log('  ✓ icon.svg');

  // 各尺寸 PNG
  for (const size of SIZES) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(PUBLIC, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);
  }

  // 主图标
  await sharp(Buffer.from(svgIcon)).resize(512, 512).png()
    .toFile(path.join(PUBLIC, 'icon.png'));
  await sharp(Buffer.from(svgIcon)).resize(256, 256).png()
    .toFile(path.join(PUBLIC, 'icon-192.png'));

  // ICO (使用最大 PNG)
  const icon256 = await sharp(Buffer.from(svgIcon))
    .resize(256, 256).png().toBuffer();
  fs.writeFileSync(path.join(PUBLIC, 'icon.ico'), icon256);
  console.log('  ✓ icon.ico');

  // 更新 manifest
  const manifestPath = path.join(PUBLIC, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.icons = [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('  ✓ manifest.json');

  console.log('\n✅ K记 图标生成完成！');
}

generate().catch((err) => {
  console.error('图标生成失败：', err);
  process.exit(1);
});
