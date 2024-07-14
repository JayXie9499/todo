const { app, BrowserWindow } = require("electron");
const remoteMain = require("@electron/remote/main");
const path = require("path");
const url = require("url");

remoteMain.initialize();

app.on("ready", () => {
	const win = new BrowserWindow({
		width: 1200,
		height: 825,
		resizable: false,
		fullscreenable: false,
		frame: false,
		maximizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	remoteMain.enable(win.webContents);
	win.loadURL(
		url.format({
			protocol: "file:",
			pathname: path.join(__dirname, "index.html"),
			slashes: true
		})
	);
});
