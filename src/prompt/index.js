const path = require("path");
const electron = require("electron");

function getElectronMainExport(id) {
	if (electron[id]) {
		return electron[id];
	}

	let remote = electron.remote;
	if (!remote) {
		try {
			remote = require("@electron/remote");
		} catch (originalError) {
			const error = new Error(
				"Install and set-up package `@electron/remote` to use this module from a renderer processs.\n" +
					"It is preferable to set up message exchanges for this using `ipcMain.handle()` and `ipcRenderer.invoke()`,\n" +
					"avoiding remote IPC overhead costs, and one morepackage dependancy.\n\n" +
					"Original error message:\n\n" +
					originalError.message
			);

			error.originalError = originalError;
			throw error;
		}
	}

	if (remote && remote[id]) {
		return remote[id];
	}

	throw new Error("Unknown electron export: " + String(id));
}

const BrowserWindow = getElectronMainExport("BrowserWindow");
const ipcMain = getElectronMainExport("ipcMain");

function electronPrompt(options, parentWindow) {
	return new Promise((resolve, reject) => {
		const id = `${Date.now()}-${Math.random()}`;

		const options_ = Object.assign(
			{
				buttonLabels: null
			},
			options || {}
		);

		let promptWindow = new BrowserWindow({
			width: 370,
			height: 130,
			resizable: false,
			minimizable: false,
			fullscreenable: false,
			maximizable: false,
			skipTaskbar: true,
			modal: true,
			frame: false,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			},
			parent: parentWindow
		});

		const getOptionsListener = (event) => {
			event.returnValue = JSON.stringify(options_);
		};

		const cleanup = () => {
			ipcMain.removeListener("prompt-get-options:" + id, getOptionsListener);
			ipcMain.removeListener("prompt-post-data:" + id, postDataListener);
			ipcMain.removeListener("prompt-error:" + id, errorListener);

			if (promptWindow) {
				promptWindow.close();
				promptWindow = null;
			}
		};

		const postDataListener = (event, value) => {
			resolve(value);
			event.returnValue = null;
			cleanup();
		};

		const unresponsiveListener = () => {
			reject(new Error("Window was unresponsive"));
			cleanup();
		};

		const errorListener = (event, message) => {
			reject(new Error(message));
			event.returnValue = null;
			cleanup();
		};

		ipcMain.on("prompt-get-options:" + id, getOptionsListener);
		ipcMain.on("prompt-post-data:" + id, postDataListener);
		ipcMain.on("prompt-error:" + id, errorListener);
		promptWindow.on("unresponsive", unresponsiveListener);

		promptWindow.on("closed", () => {
			promptWindow = null;
			cleanup();
			resolve(null);
		});

		promptWindow.loadFile(path.join(__dirname, "page", "prompt.html"), {
			hash: id
		});
	});
}

module.exports = electronPrompt;
