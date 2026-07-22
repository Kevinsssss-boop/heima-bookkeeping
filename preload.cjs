const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getExpenses: () => ipcRenderer.invoke('get-expenses'),
  addExpense: (expense) => ipcRenderer.invoke('add-expense', expense),
  updateExpense: (expense) => ipcRenderer.invoke('update-expense', expense),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
  getCustomCategories: () => ipcRenderer.invoke('get-custom-categories'),
  saveCustomCategories: (data) => ipcRenderer.invoke('save-custom-categories', data),
});
