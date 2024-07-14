/* eslint-disable no-undef */
const { ipcRenderer } = require("electron");

let promptId = null;
let promptOptions = null;

function promptError(error) {
	if (error instanceof Error) {
		error = error.message;
	}

	ipcRenderer.sendSync("prompt-error:" + promptId, error);
}

function promptCancel() {
	ipcRenderer.sendSync("prompt-post-data:" + promptId, null);
}

function promptSubmit() {
	const dataElement = document.querySelector("#data");
	const data = dataElement.value;

	ipcRenderer.sendSync("prompt-post-data:" + promptId, data);
}

function promptCreateInput() {
	const dataElement = document.createElement("input");
	dataElement.setAttribute("type", "text");

	if (promptOptions.value) {
		dataElement.value = promptOptions.value;
	} else {
		dataElement.value = "";
	}

	if (
		promptOptions.inputAttrs &&
		typeof promptOptions.inputAttrs === "object"
	) {
		for (const k in promptOptions.inputAttrs) {
			if (!Object.prototype.hasOwnProperty.call(promptOptions.inputAttrs, k)) {
				continue;
			}

			dataElement.setAttribute(k, promptOptions.inputAttrs[k]);
		}
	}

	dataElement.addEventListener("keyup", (event) => {
		if (event.key === "Escape") {
			promptCancel();
		}
	});

	dataElement.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			document.querySelector("#ok").click();
		}
	});

	return dataElement;
}

function promptRegister() {
	promptId = document.location.hash.replace("#", "");

	try {
		promptOptions = JSON.parse(
			ipcRenderer.sendSync("prompt-get-options:" + promptId)
		);
	} catch (error) {
		return promptError(error);
	}

	document.querySelector("#label").textContent = promptOptions.label;

	if (promptOptions.buttonLabels && promptOptions.buttonLabels.ok) {
		document.querySelector("#ok").textContent = promptOptions.buttonLabels.ok;
	}
	if (promptOptions.buttonLabels && promptOptions.buttonLabels.cancel) {
		document.querySelector("#cancel").textContent =
			promptOptions.buttonLabels.cancel;
	}

	document.querySelector("#form").addEventListener("submit", promptSubmit);
	document.querySelector("#cancel").addEventListener("click", promptCancel);

	const dataContainerElement = document.querySelector("#data-container");
	const dataElement = promptCreateInput();

	dataContainerElement.append(dataElement);
	dataElement.setAttribute("id", "data");
	dataElement.focus();
	dataElement.select();
}

window.addEventListener("error", (error) => {
	if (promptId) {
		promptError("An error has occured on the prompt window: \n" + error);
	}
});

document.addEventListener("DOMContentLoaded", promptRegister);
