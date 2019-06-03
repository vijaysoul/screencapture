const {app, BrowserWindow, ipcMain} = require('electron')

let mainWindow
let pickerDialog

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 500,
    width: 600
  });

  pickerDialog = new BrowserWindow({
    parent: mainWindow,
    skipTaskbar: true,
    modal: true,
    show: false,
    height: 390,
    width: 680
  })
  screenShot = new BrowserWindow({
    parent: mainWindow,
    skipTaskbar: true,
    modal: true,
    show: false,
    height: 390,
    width: 680
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  pickerDialog.loadURL('file://' + __dirname + '/picker.html')
  screenShot.loadURL('file://' + __dirname + '/screenshot.html')
});

ipcMain.on('screen-shot', (event, options) => {
  screenShot.show()
})

ipcMain.on('show-picker', (event, options) => {
  pickerDialog.show()
  pickerDialog.webContents.send('get-sources', options)
})

ipcMain.on('source-id-selected', (event, sourceId) => {
  pickerDialog.hide()
  mainWindow.webContents.send('source-id-selected', sourceId)
})
