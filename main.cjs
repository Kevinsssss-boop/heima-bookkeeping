const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const dataFile = path.join(app.getPath('userData'), 'expenses.json');
const customCatFile = path.join(app.getPath('userData'), 'custom-categories.json');

// ====== 数据读写 ======

function readExpenses() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, '[]', 'utf-8');
      return [];
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  } catch (err) {
    console.error('读取数据失败：', err);
    return [];
  }
}

function writeExpenses(expenses) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(expenses, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('写入数据失败：', err);
    return false;
  }
}

// ====== IPC 通信 ======

ipcMain.handle('get-expenses', () => readExpenses());

ipcMain.handle('add-expense', (_event, expense) => {
  const expenses = readExpenses();
  expenses.push(expense);
  writeExpenses(expenses);
  return { success: true };
});

ipcMain.handle('update-expense', (_event, updated) => {
  const expenses = readExpenses();
  const idx = expenses.findIndex((e) => e.id === updated.id);
  if (idx !== -1) {
    expenses[idx] = updated;
    writeExpenses(expenses);
    return { success: true };
  }
  return { success: false, error: '记录不存在' };
});

ipcMain.handle('delete-expense', (_event, id) => {
  const expenses = readExpenses();
  writeExpenses(expenses.filter((e) => e.id !== id));
  return { success: true };
});

// ====== 自定义分类 IPC ======

function readCustomCategories() {
  try {
    if (!fs.existsSync(customCatFile)) {
      const def = { customCategories: [], customSubCategories: {} };
      fs.writeFileSync(customCatFile, JSON.stringify(def, null, 2), 'utf-8');
      return def;
    }
    return JSON.parse(fs.readFileSync(customCatFile, 'utf-8'));
  } catch (err) {
    console.error('读取自定义分类失败：', err);
    return { customCategories: [], customSubCategories: {} };
  }
}

function writeCustomCategories(data) {
  try {
    fs.writeFileSync(customCatFile, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('写入自定义分类失败：', err);
    return false;
  }
}

ipcMain.handle('get-custom-categories', () => readCustomCategories());

ipcMain.handle('save-custom-categories', (_event, data) => {
  writeCustomCategories(data);
  return { success: true };
});

// ====== 窗口创建 ======

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'K记',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    frame: true,
  });

  win.maximize();

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    const port = process.env.VITE_PORT || '5200';
    win.loadURL(`http://localhost:${port}`);
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
