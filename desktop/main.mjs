import { app, BrowserWindow, shell } from "electron";
import { startAppServer } from "./app-server.mjs";

let localServer;
let mainWindow;

async function createWindow() {
  localServer = await startAppServer();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 920,
    minHeight: 640,
    title: "Series Scout",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  await mainWindow.loadURL(localServer.url);
}

app.whenReady().then(() => createWindow()).catch((error) => {
  console.error("Unable to start Series Scout", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  localServer?.server.close();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
