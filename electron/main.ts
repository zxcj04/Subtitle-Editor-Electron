// electron/main.ts

const { app, BrowserWindow } = require("electron");
const path = require("path");

const NODE_ENV = process.env.NODE_ENV;

function createWindow() {
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "../dist/catLogo.png"),
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));

  if (NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', function(e) {
    e.preventDefault();
    mainWindow.destroy();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
