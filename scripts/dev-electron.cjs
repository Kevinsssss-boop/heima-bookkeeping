/**
 * K记 Electron 开发启动器
 * 用法: node scripts/dev-electron.cjs
 */
const { spawn } = require('child_process');
const path = require('path');

// 关键修复：清除导致 Electron 运行在 Node 模式的环境变量
delete process.env.ELECTRON_RUN_AS_NODE;

const projectDir = path.resolve(__dirname, '..');
const env = { ...process.env, VITE_PORT: '5200' };
const isWin = process.platform === 'win32';

// 直接调用 electron 二进制，不经过 .bin 包装
const electronExe = isWin
  ? path.join(projectDir, 'node_modules/electron/dist/electron.exe')
  : path.join(projectDir, 'node_modules/electron/dist/electron');

console.log('🚀 启动黑马记账 (Electron 桌面版)...');
console.log('   Electron:', electronExe);
console.log('');

// Windows 上通过 cmd.exe 启动 Vite
let vite;
if (isWin) {
  const viteCmd = path.join('node_modules', '.bin', 'vite.cmd');
  vite = spawn('cmd.exe', ['/c', `${viteCmd} --port 5200`], {
    stdio: 'inherit',
    cwd: projectDir,
    env,
  });
} else {
  vite = spawn('sh', ['-c', 'node_modules/.bin/vite --port 5173'], {
    stdio: 'inherit',
    cwd: projectDir,
    env,
  });
}

// 等 Vite 启动，然后启动 Electron
setTimeout(() => {
  console.log('\n📦 启动 Electron 窗口...\n');
  const electron = spawn(electronExe, ['.'], {
    stdio: 'inherit',
    cwd: projectDir,
    env,
  });

  electron.on('close', (code) => {
    vite.kill();
    process.exit(code || 0);
  });
}, 4000);

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
