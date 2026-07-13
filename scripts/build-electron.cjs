/**
 * 构建 Electron 桌面安装包
 * 1. 先编译 React (vite build)
 * 2. 再用 electron-builder 打包 exe
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

// 清除问题环境变量
delete process.env.ELECTRON_RUN_AS_NODE;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: projectDir,
      shell: isWin,
      env: { ...process.env },
      ...opts,
    });
    child.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`Exit code: ${code}`));
    });
  });
}

async function build() {
  console.log('🏗️  开始构建黑马记账桌面版...\n');

  // Step 1: Vite 构建前端
  console.log('📦 Step 1/2: 编译前端 (Vite)...');
  try {
    execSync('npx vite build', { cwd: projectDir, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error('❌ 前端编译失败');
    process.exit(1);
  }

  // Step 2: Electron Builder 打包
  console.log('\n📦 Step 2/2: 打包桌面应用 (Electron Builder)...');
  console.log('   (这一步需要 3-8 分钟，请耐心等待)\n');

  try {
    execSync('npx electron-builder --win --x64 --config.electronDist=node_modules/electron/dist --config.electronVersion=31.7.7', {
      cwd: projectDir,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
    });
  } catch (err) {
    console.error('❌ 打包失败');
    process.exit(1);
  }

  // 检查输出
  const releaseDir = path.join(projectDir, 'release');
  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.exe'));
    console.log('\n✅ 构建完成！输出文件：');
    files.forEach(f => {
      const filePath = path.join(releaseDir, f);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
      console.log(`   📁 release/${f}  (${sizeMB} MB)`);
    });
    console.log('\n💡 双击 release/黑马记账 Setup *.exe 安装，或直接运行 黑马记账.exe');
  }
}

build().catch((err) => {
  console.error('构建失败：', err);
  process.exit(1);
});
