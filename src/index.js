/* eslint-disable no-undef */
const { BrowserWindow, dialog } = require("@electron/remote");
const prompt = require("./prompt");
const fs = require("fs");

const curProject = {
	listed: [],
	completed: []
};

function isValidFile(d) {
	if (!d["listed"] || !d["completed"]) {
		return false;
	}

	return true;
}

function renderProject() {
	document.getElementById("listed").innerHTML = "";
	document.getElementById("completed").innerHTML = "";
	renderTask("listed", curProject.listed);
	renderTask("completed", curProject.completed);
}

function renderTask(id, tasks) {
	const list = document.getElementById(id);

	for (const task of tasks) {
		const node = createTaskElement(task);

		list.appendChild(node);
	}
}

function createTaskElement(name) {
	const node = document.createElement("li");
	const checkbox = document.createElement("input");
	const span = document.createElement("span");
	span.innerText = name;

	checkbox.setAttribute("type", "checkbox");
	checkbox.addEventListener("click", function () {
		if (checkbox.checked) {
			checkbox.parentElement.classList.add("selected");
		} else {
			checkbox.parentElement.classList.remove("selected");
		}
	});
	node.append(checkbox, span);
	return node;
}

document.getElementById("minimize").onclick = function () {
	BrowserWindow.getFocusedWindow().minimize();
};
document.getElementById("close").onclick = function () {
	BrowserWindow.getFocusedWindow().close();
};

document.getElementById("open-project").onclick = function () {
	dialog
		.showOpenDialog({
			properties: ["openFile"],
			filters: [{ name: "Project File", extensions: ["todo.json"] }]
		})
		.then((value) => {
			const filePath = value.filePaths[0];

			if (!filePath?.length) {
				return;
			}

			const raw = fs.readFileSync(filePath, { encoding: "utf-8" });
			const data = JSON.parse(raw);

			if (!isValidFile(data)) {
				dialog.showErrorBox("Error", "Unable to load this file.");
				return;
			}

			Object.assign(curProject, {
				listed: data["listed"],
				completed: data["completed"],
				filePath
			});
			renderProject();
		});
};
document.getElementById("save").onclick = function () {
	if (curProject["filePath"]?.length) {
		fs.writeFileSync(
			curProject["filePath"],
			JSON.stringify({
				listed: curProject.listed,
				completed: curProject.completed
			})
		);
		return;
	}

	dialog
		.showSaveDialog({
			properties: ["createDirectory", "showOverwriteConfirmation"],
			filters: [{ name: "Project File", extensions: ["todo.json"] }]
		})
		.then(({ filePath }) => {
			fs.writeFileSync(filePath, JSON.stringify(curProject));
			Object.assign(curProject, { filePath });
		});
};
document.getElementById("new-task").onclick = function () {
	prompt(
		{
			label: "Task name:",
			buttonLabels: {
				ok: "Add task",
				cancel: "Cancel"
			}
		},
		BrowserWindow.getFocusedWindow()
	).then((value) => {
		if (!value?.length) {
			return;
		}

		const listed = document.getElementById("listed");
		const node = createTaskElement(value);

		listed.appendChild(node);
		curProject.listed.push(value);
	});
};
document.getElementById("del-task").onclick = function () {
	const selected = document.querySelectorAll(".selected").values();

	for (const task of selected) {
		const type = task.parentElement.id;
		const index = curProject[type].indexOf(task.lastChild.textContent);

		task.remove();
		curProject[type].splice(index, 1);
	}
};
document.getElementById("complete-task").onclick = function () {
	const selected = document.querySelectorAll(".selected").values();
	const completed = document.getElementById("completed");

	for (const task of selected) {
		const type = task.parentElement.id;

		if (type === "completed") {
			continue;
		}

		const content = task.lastChild.textContent;
		const index = curProject.listed.indexOf(content);

		task.remove();
		completed.prepend(task);
		curProject.listed.splice(index, 1);
		curProject.completed.unshift(content);
	}
};
