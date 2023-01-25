import { Dialog } from "./dialog.js";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

let uuid;
let school;
let role;
let ws = new WebSocket((location.protocol == "http" ? "ws://" : "wss://") + location.host);
window.ws = ws;
let schoolCode;
let username;
let navItems;
const contentItems = [$("#selectsomething"), $("#teachers"), $("#rooms"), $("#courses"), $("#course")];
let selectedCourse;

function hasJsonStructure(str) {
	if(typeof str !== "string") return false;
	try {
		const result = JSON.parse(str);
		const type = Object.prototype.toString.call(result);
		return type === "[object Object]"
			|| type === "[object Array]";
	} catch (err) {
		return false;
	}
}

ws.addEventListener("message", async (msg) => {
	if(!hasJsonStructure(msg.data)) {
		return;
	}
	const packet = JSON.parse(msg.data);
	if(packet.type == "conversationError") {
		alert("Server: " + packet.error);
		location.reload();
	}
	if(packet.type == "hi") {
		if(!packet.success) {
			$("#username").value = "";
			$("#password").value = "";
			$("#username").focus();
			return;
		}
		school = packet.school;
		await loadSchool();
		// $("#nav").lastChild.click();
		// click the 2nd nav item
		//navItems[1].click(); "picoscratch", "picoscratch", "Passwort#0000"
	} else if(packet.type == "addTeacher") {
		if(packet.error) {
			alert(result.error);
			return;
		}
		new Dialog("#new-teacher-dialog").hide();
		createTeacher(packet.teacher);
	} else if(packet.type == "deleteTeacher") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		$("[data-teacher=\"" + packet.wasUUID + "\"]").remove();
	} else if(packet.type == "addCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		new Dialog("#new-course-dialog").hide();
		createCourse(packet.course);
	} else if(packet.type == "deleteCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		$("[data-course-item=\"" + packet.wasUUID + "\"]").remove();
		$("[data-course-nav=\"" + packet.wasUUID + "\"]").remove();
	} else if(packet.type == "addRoom") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		new Dialog("#new-room-dialog").hide();
		createRoom(packet.room);
	} else if(packet.type == "deleteRoom") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		$("[data-room=\"" + packet.wasUUID + "\"]").remove();
	} else if(packet.type == "setActiveCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
	} else if(packet.type == "startCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		if(packet.course.uuid == selectedCourse.uuid) {
			$("#traffic-green").classList.remove("trafficOff");
			$("#traffic-red").classList.add("trafficOff");
		}
	} else if(packet.type == "stopCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		if(packet.course.uuid == selectedCourse.uuid) {
			$("#traffic-red").classList.remove("trafficOff");
			$("#traffic-green").classList.add("trafficOff");
		}
	} else if(packet.type == "getCourseInfo") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		renderLeaderboard(packet.leaderboard);
	} else if(packet.type == "leaderboard") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		if(packet.course.uuid == selectedCourse.uuid) renderLeaderboard(packet.leaderboard);
	} else if(packet.type == "kick") {
		console.log(packet);
	} else if(packet.type == "delete") {
		console.log(packet);
	} else if(packet.type == "setLevel") {
		console.log(packet);
	}
})

async function loginSchoolcode(code) {
	const school = await fetch("/api/schoolcode/" + code).then(res => res.json());
	if(school.error) {
		$("#login-spinner").style.display = "none";
		$("#code").disabled = false;
		$("#code").value = "";
		$("#code").focus();
		return;
	}
	$("#login").style.display = "none";
	$("#login-user").style.display = "";
	$("#login-schoolname").innerText = school.name;
	uuid = school.uuid;
	schoolCode = code;
}

async function loginSchool(uuid, user, password) {
	username = user;
	ws.send(JSON.stringify({ type: "hi", clientType: "teacher", schoolCode, username: user, password }));
}

async function loadSchool() {
	if(school.error) {
		$("#username").value = "";
		$("#password").value = "";
		$("#username").focus();
		return;
	}
	console.log(school);
	navItems = [];
	$("#login-user").style.display = "none";
	$("#dashboard").style.display = "";

	$("#schoolname").innerText = school.name;
	$("#dashboard-username").innerText = username.toLowerCase() == "admin" ? "Admin" : school.teachers.find(t => t.name.toLowerCase() === username.toLowerCase()).name;
	role = $("#dashboard-username").innerText.toLowerCase() == "admin" ? "Admin" : "Lehrer";
	$("#dashboard-role").innerText = role;
	role = role.toLowerCase();

	if(role == "admin") {
		const teachersEl = document.createElement("h3");
		teachersEl.innerText = "Lehrer";
		teachersEl.addEventListener("click", () => {
			for(const item of navItems) {
				item.classList.remove("active");
			}
			teachersEl.classList.add("active");
			for(const item of contentItems) {
				item.style.display = "none";
			}
			selectedCourse = null;
			$("#teachers").style.display = "";
		});
		navItems.push(teachersEl);
		$("#nav").appendChild(teachersEl);
	}
	const roomsEl = document.createElement("h3");
	roomsEl.innerText = "Räume";
	roomsEl.addEventListener("click", () => {
		for(const item of navItems) {
			item.classList.remove("active");
		}
		roomsEl.classList.add("active");
		for(const item of contentItems) {
			item.style.display = "none";
		}
		selectedCourse = null;
		$("#rooms").style.display = "";
	});
	if(role != "admin") {
		$("#addroom").style.display = "none";
	}
	navItems.push(roomsEl);
	$("#nav").appendChild(roomsEl);

	const coursesEl = document.createElement("h3");
	coursesEl.innerText = "Kurse";
	if(role == "admin") {
		coursesEl.addEventListener("click", () => {
			for(const item of navItems) {
				item.classList.remove("active");
			}
			coursesEl.classList.add("active");
			for(const item of contentItems) {
				item.style.display = "none";
			}
			selectedCourse = null;
			$("#courses").style.display = "";
		});
		navItems.push(coursesEl);
	}
	$("#nav").appendChild(coursesEl);

	for(const course of school.courses) {
		createCourse(course);
	}
	for(const teacher of school.teachers) {
		createTeacher(teacher);
	}
	for(const room of school.rooms) {
		createRoom(room);
	}

	$("#dashboard").classList.remove("loading");
}

function createCourse(course) {
	// Nav item
	createCourseNavItem(course);

	// Courses item
	createCourseItem(course);
}

function createCourseNavItem(course) {
	const h3 = document.createElement("h3");
	h3.setAttribute("data-course-nav", course.uuid);
	const img = document.createElement("img");
	img.src = "arrow.svg";
	h3.appendChild(img);
	h3.appendChild(document.createTextNode(" " + course.name));
	$("#nav").appendChild(h3);
	h3.addEventListener("click", () => {
		for(const item of navItems) {
			item.classList.remove("active");
		}
		h3.classList.add("active");
		for(const item of contentItems) {
			item.style.display = "none";
		}
		selectedCourse = course;
		$("#course").style.display = "";
		if(course.isRunning) {
			$("#traffic-green").classList.remove("trafficOff");
			$("#traffic-red").classList.add("trafficOff");
		} else {
			$("#traffic-red").classList.remove("trafficOff");
			$("#traffic-green").classList.add("trafficOff");
		}
		ws.send(JSON.stringify({type: "getCourseInfo", uuid: course.uuid}));
	});
	navItems.push(h3);
}

function createCourseItem(course) {
	const div = document.createElement("div");
	div.classList.add("box");
	div.setAttribute("data-course-item", course.uuid);
	const h2 = document.createElement("h2");
	h2.innerText = course.name;
	div.appendChild(h2);
	const actions = document.createElement("div");
	actions.id = "actions";
	div.appendChild(actions);
	const button = document.createElement("button");
	button.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#C34040"/></svg>';
	button.addEventListener("click", () => {
		ws.send(JSON.stringify({ type: "deleteCourse", uuid: course.uuid }));
	});
	actions.appendChild(button);
	$("#courses").insertBefore(div, $("#addcourse"));
}

function createTeacher(teacher) {
	const div = document.createElement("div");
	div.classList.add("box");
	div.setAttribute("data-teacher", teacher.uuid);
	const h2 = document.createElement("h2");
	h2.innerText = teacher.name;
	div.appendChild(h2);
	const actions = document.createElement("div");
	actions.id = "actions";
	div.appendChild(actions);
	const button = document.createElement("button");
	button.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#C34040"/></svg>';
	button.addEventListener("click", () => {
		ws.send(JSON.stringify({ type: "deleteTeacher", uuid: teacher.uuid }));
	})
	actions.appendChild(button);
	$("#teachers").insertBefore(div, $("#addteacher"));
}

function createRoom(room) {
	console.log("Room", room);
	const div = document.createElement("div");
	div.classList.add("box");
	div.setAttribute("data-room", room.uuid);
	const h2 = document.createElement("h2");
	h2.innerText = room.name;
	div.appendChild(h2);
	const select = document.createElement("select");
	const option = document.createElement("option");
	option.innerText = "Kein Kurs";
	option.value = "nocourse";
	select.appendChild(option);
	select.addEventListener("change", (e) => {
		ws.send(JSON.stringify({ type: "setActiveCourse", uuid: room.uuid, course: select.value }));
	});
	for(const course of school.courses) {
		const option = document.createElement("option");
		option.innerText = course.name;
		option.value = course.uuid;
		select.appendChild(option);
	}
	select.value = room.courseUuid || "nocourse";
	div.appendChild(select);
	if(role == "admin") {
		const actions = document.createElement("div");
		actions.id = "actions";
		div.appendChild(actions);
		const button = document.createElement("button");
		button.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#C34040"/></svg>';
		button.addEventListener("click", () => {
			ws.send(JSON.stringify({ type: "deleteRoom", uuid: room.uuid }));
		});
		actions.appendChild(button);
	}
	$("#rooms").insertBefore(div, $("#addroom"));
}

function renderLeaderboard(leaderboard) {
	$("#leaderboard table").innerHTML = "";
	const tr = document.createElement("tr");
	const th = document.createElement("th");
	th.innerText = "Platz";
	tr.appendChild(th);
	const th2 = document.createElement("th");
	th2.innerText = "Name";
	tr.appendChild(th2);
	const th3 = document.createElement("th");
	th3.innerText = "Übung";
	tr.appendChild(th3);
	const th4 = document.createElement("th");
	th4.innerText = "Quiz %";
	tr.appendChild(th4);
	const th5 = document.createElement("th");
	th5.innerText = "Aktionen";
	tr.appendChild(th5);
	$("#leaderboard table").appendChild(tr);
	// for(const user of school.users) {
	for(let i = 0; i < leaderboard.length; i++) {
		const student = leaderboard[i];
		const tr = document.createElement("tr");
		const place = document.createElement("td");
		place.innerText = i + 1;
		tr.appendChild(place);
		const name = document.createElement("td");
		name.innerText = student.name;
		tr.appendChild(name);
		const exercise = document.createElement("td");
		exercise.innerText = student.level;
		tr.appendChild(exercise);
		const quiz = document.createElement("td");
		quiz.innerText = student.percentage + "%";
		tr.appendChild(quiz);
		const actions = document.createElement("td");
		actions.id = "leaderboardactions";
		const kickAction = document.createElement("button");
		kickAction.innerHTML = `<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 17.5a6.47 6.47 0 0 1 1.022-3.5h-7.77a2.249 2.249 0 0 0-2.249 2.25v.919c0 .572.179 1.13.51 1.596C4.057 20.929 6.58 22 10 22c.931 0 1.796-.08 2.592-.238A6.475 6.475 0 0 1 11 17.5ZM10 2.005a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill="#ffffff"/><path d="M23 17.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Zm-4.647-2.853a.5.5 0 0 0-.707.707L19.293 17H15a.5.5 0 1 0 0 1h4.293l-1.647 1.647a.5.5 0 0 0 .707.707l2.5-2.5a.497.497 0 0 0 .147-.345V17.5a.498.498 0 0 0-.15-.357l-2.497-2.496Z" fill="#ffffff"/></svg>`;
		kickAction.addEventListener("click", () => {
			ws.send(JSON.stringify({ type: "kick", uuid: student.uuid }));
		});
		kickAction.title = "Kick " + student.name;
		actions.appendChild(kickAction);
		const deleteAction = document.createElement("button");
		deleteAction.innerHTML = `<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#A03030"/></svg>`;
		deleteAction.addEventListener("dblclick", () => {
			ws.send(JSON.stringify({ type: "delete", uuid: student.uuid, courseUUID: selectedCourse.uuid }));
		});
		deleteAction.title = "Delete " + student.name;
		actions.appendChild(deleteAction);
		const setLevelAction = document.createElement("button");
		setLevelAction.innerHTML = `<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.975 9.689a1 1 0 1 1-1.45-1.378l4.75-5a1 1 0 0 1 1.45 0l4.75 5a1 1 0 1 1-1.45 1.378L13 6.505v10.99l3.025-3.184a1 1 0 1 1 1.45 1.378l-4.75 5a1 1 0 0 1-1.45 0l-4.75-5a1 1 0 1 1 1.45-1.378L11 17.495V6.505L7.975 9.689Z" fill="#ffffff"/></svg>`;
		setLevelAction.addEventListener("click", () => {
			const level = prompt("Set level for " + student.name, student.level);
			if(level == null) return;
			ws.send(JSON.stringify({ type: "setLevel", uuid: student.uuid, level, courseUUID: selectedCourse.uuid }));
		});
		setLevelAction.title = "Set level for " + student.name;
		actions.appendChild(setLevelAction);
		tr.appendChild(actions);
		$("#leaderboard table").appendChild(tr);
	}
}

// await loginSchoolcode("86583-69062-02563-05283");
// await loginSchoolcode("yH28qBq");
// await loginSchool(uuid, "admin", "secret");

$("#schoolcode-container").addEventListener("keyup", async (e) => {
	if(!e.key) return;
	if(e.key.length != 1) return;

	if(e.target.value.length === e.target.maxLength) {
		let nextInput = e.target.nextElementSibling;
		if(nextInput) nextInput = nextInput.nextElementSibling
		if(nextInput) nextInput.focus();
		else {
			e.target.blur();
			$("#code").disabled = true;
			$("#login-spinner").style.display = "";
			await loginSchoolcode($("#code").value);
		}
	}
})

$("#login-user-btn").addEventListener("click", async () => {
	await loginSchool(uuid, $("#username").value, $("#password").value);
});

$("#start").addEventListener("click", async () => {
	ws.send(JSON.stringify({ type: "startCourse", uuid: selectedCourse.uuid }));
})

$("#stop").addEventListener("click", async () => {
	ws.send(JSON.stringify({ type: "stopCourse", uuid: selectedCourse.uuid }));
})











$("#addteacher button").addEventListener("click", () => {
	$("#teacher-name").value = "";
	$("#teacher-password").value = "";
	new Dialog("#new-teacher-dialog").show();
});

$("#cancel-teacher").addEventListener("click", () => {
	new Dialog("#new-teacher-dialog").hide();
});

$("#teacher-name").addEventListener("keyup", () => {
	$("#teacher-name").classList.remove("error");
});

$("#teacher-password").addEventListener("keyup", () => {
	$("#teacher-password").classList.remove("error");
});

$("#submit-teacher").addEventListener("click", async () => {
	if($("#teacher-name").value === "") {
		$("#teacher-name").focus();
		$("#teacher-name").classList.add("error");
		return;
	}
	if($("#teacher-password").value === "") {
		$("#teacher-password").focus();
		$("#teacher-password").classList.add("error");
		return;
	}
	ws.send(JSON.stringify({ type: "addTeacher", username: $("#teacher-name").value, password: $("#teacher-password").value }))
});

$("#addcourse button").addEventListener("click", () => {
	$("#course-name").value = "";
	new Dialog("#new-course-dialog").show();
});

$("#cancel-course").addEventListener("click", () => {
	new Dialog("#new-course-dialog").hide();
});

$("#course-name").addEventListener("keyup", () => {
	$("#course-name").classList.remove("error");
});

$("#submit-course").addEventListener("click", async () => {
	if($("#course-name").value === "") {
		$("#course-name").focus();
		$("#course-name").classList.add("error");
		return;
	}
	ws.send(JSON.stringify({ type: "addCourse", name: $("#course-name").value }))
});

$("#addroom button").addEventListener("click", () => {
	$("#room-name").value = "";
	new Dialog("#new-room-dialog").show();
});

$("#cancel-room").addEventListener("click", () => {
	new Dialog("#new-room-dialog").hide();
});

$("#room-name").addEventListener("keyup", () => {
	$("#room-name").classList.remove("error");
});

$("#submit-room").addEventListener("click", async () => {
	if($("#room-name").value === "") {
		$("#room-name").focus();
		$("#room-name").classList.add("error");
		return;
	}
	ws.send(JSON.stringify({ type: "addRoom", name: $("#room-name").value }))
});
