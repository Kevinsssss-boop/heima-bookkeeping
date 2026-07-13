/**
 * 手动打包便携版 exe
 * 复制 Electron 运行时 + 我们的 App 代码 = 双击即用
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ELECTRON_DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');
const DEST = path.join(ROOT, 'K记');

function copyDir(src, dest, ignore = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignore.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🔧 正在打包 K记 便携版...\n');

// 1. 清理旧版本（如果失败则跳过，直接覆盖）
if (fs.existsSync(DEST)) {
  try {
    fs.rmSync(DEST, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    console.log('清理旧版本...');
  } catch (e) {
    console.log('(跳过清理，直接覆盖)');
  }
}
fs.mkdirSync(DEST, { recursive: true });

// 2. 复制 Electron 运行时
console.log('复制 Electron 运行时...');
copyDir(ELECTRON_DIST, DEST);

// 3. 创建 resources/app 目录并放入我们的代码
const appDir = path.join(DEST, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

// 复制 dist（前端构建产物）
console.log('复制前端文件...');
copyDir(path.join(ROOT, 'dist'), path.join(appDir, 'dist'));

// 复制主进程文件
console.log('复制主进程文件...');
fs.copyFileSync(path.join(ROOT, 'main.cjs'), path.join(appDir, 'main.cjs'));
fs.copyFileSync(path.join(ROOT, 'preload.cjs'), path.join(appDir, 'preload.cjs'));

// 创建简化的 package.json (只包含必要信息)
const pkgJson = {
  name: 'heima-jizhang',
  version: '1.0.0',
  main: 'main.cjs',
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

// 4. 复制图标
console.log('设置应用图标...');
const iconDest = path.join(DEST, 'resources', 'app', 'icon.png');
if (fs.existsSync(path.join(ROOT, 'public', 'icon-512.png'))) {
  fs.copyFileSync(path.join(ROOT, 'public', 'icon-512.png'), iconDest);
}

// 5. 重命名 electron.exe 为 K记.exe
const oldExe = path.join(DEST, 'electron.exe');
const newExe = path.join(DEST, 'K记.exe');
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe);
  console.log('重命名 electron.exe → K记.exe');
}

// 6. 统计大小
function getSize(dir) {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getSize(p);
    else size += fs.statSync(p).size;
  }
  return size;
}
const totalMB = (getSize(DEST) / 1024 / 1024).toFixed(0);

// 6. 设置 exe 图标
const { rcedit } = require('rcedit');
const exePath = path.join(DEST, 'K记.exe');
const icoPath = path.join(ROOT, 'public', 'icon.ico');
if (fs.existsSync(exePath) && fs.existsSync(icoPath)) {
  rcedit(exePath, { icon: icoPath }).then(() => {
    console.log('设置 exe 图标 ✓');
  }).catch(() => {});
}

console.log(`\n✅ 打包完成！`);
console.log(`📁 位置: ${DEST}`);
console.log(`📦 大小: ${totalMB} MB`);
console.log(`🚀 双击 K记.exe 启动！`);
