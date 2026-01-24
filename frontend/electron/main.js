const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');

// Reliable dev detection: when running `electron .` from source, app isn't packaged.
const isDev = !app.isPackaged;

let mainWindow;

function urlIsReachable(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('https:') ? https : http;
      const req = lib.get(url, { timeout: timeoutMs }, (res) => {
        // Any response means the server is up
        res.resume();
        resolve(true);
      });
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
        resolve(false);
      });
      req.on('error', () => resolve(false));
    } catch (_) {
      resolve(false);
    }
  });
}

async function loadApp(window) {
  // Allow override from environment (useful if Vite runs on a different port)
  const overrideUrl = process.env.ELECTRON_START_URL;
  if (overrideUrl) {
    await window.loadURL(overrideUrl);
    return;
  }

  if (isDev) {
    // Try common Vite ports. Your app is served under /app/.
    const candidates = [
      'http://localhost:5173/app/',
      'http://127.0.0.1:5173/app/',
      'http://localhost:5174/app/',
      'http://127.0.0.1:5174/app/',
      'http://localhost:5175/app/',
      'http://127.0.0.1:5175/app/',
    ];

    for (const url of candidates) {
      // Check the root (without /app/) as well, because some dev servers redirect.
      const ok = await urlIsReachable(url.replace('/app/', '/'));
      if (ok) {
        await window.loadURL(url);
        return;
      }
    }
  }

  // Fallback to built assets
  await window.loadFile(path.join(__dirname, '../dist/index.html'));
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#1f2937'
  });

  // Load the app
  loadApp(mainWindow)
    .then(() => {
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    })
    .catch((err) => {
      console.error('Failed to load app in Electron window:', err);
      // Best-effort fallback: show a local file if possible
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {});
    });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About IDS Enterprise',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/ids-enterprise');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
