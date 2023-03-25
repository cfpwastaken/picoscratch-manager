import { Dialog } from "./dialog.js";
import { setLang, translate } from "./lang.js";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

let uuid;
let school;
let role;
let ws = new WebSocket((location.protocol == "http:" ? "ws://" : "wss://") + location.host + location.pathname.replaceAll("/manager", ""));
window.ws = ws;
let schoolCode;
let username;
let navItems;
const contentItems = [$("#selectsomething"), $("#teachers"), $("#rooms"), $("#courses"), $("#course"), $("#settings")];
let selectedCourse;
let courses = [];

setLang("en");
// await loginSchoolcode("demopsm");
// await loginSchool(uuid, "admin", "secret");

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
	console.log(packet);
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
		if(!packet.uuid) return;
		if(packet.course) $("[data-room=\"" + packet.uuid + "\"] select").value = packet.course.uuid;
		else $("[data-room=\"" + packet.uuid + "\"] select").value = "nocourse";
	} else if(packet.type == "startCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		if(selectedCourse == null) return;
		if(packet.course.uuid == selectedCourse.uuid) {
			$("#traffic-green").classList.remove("trafficOff");
			$("#traffic-red").classList.add("trafficOff");
		}
	} else if(packet.type == "stopCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		if(selectedCourse == null) return;
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
		if(selectedCourse == null) return;
		if(packet.course.uuid == selectedCourse.uuid) renderLeaderboard(packet.leaderboard);
	} else if(packet.type == "kick") {
		console.log(packet);
	} else if(packet.type == "delete") {
		console.log(packet);
	} else if(packet.type == "setLevel") {
		console.log(packet);
	} else if(packet.type == "setChannel") {
		$("#setting-channel").value = packet.channel;
	} else if(packet.type == "setLang") {
		$("#setting-lang").value = packet.lang;
	} else if(packet.type == "renameCourse") {
		if(packet.error) {
			alert(packet.error);
			return;
		}
		$("[data-course-item=\"" + packet.uuid + "\"] h2").innerText = packet.name;
		$("[data-course-nav=\"" + packet.uuid + "\"]").childNodes[1].nodeValue = " " + packet.name;
	} else if(packet.type == "verifications") {
		console.log(packet.verifications);
		$("#task-verification-counter").innerText = packet.verifications.length;
		if(packet.verifications.length == 0) {
			$("#task-verification-counter").style.display = "none";
			$("#verify-student").style.display = "none";
			return;
		}
		$("#task-verification-counter").style.display = "";
		$("#verify-student").style.display = "flex";
		$("#task-verification-student").innerText = packet.verifications[0].name;
		$("#verify-student").setAttribute("data-studentuuid", packet.verifications[0].uuid);
	}
})

async function loginSchoolcode(code) {
	const school = await fetch("../api/schoolcode/" + code).then(res => res.json());
	if(school.error) {
		$("#login-spinner").style.display = "none";
		$("#code").disabled = false;
		$("#login").disabled = false;
		$("#code").value = "";
		$("#code").focus();
		return;
	}
	$("#login").style.display = "none";
	$("#login-user").style.display = "";
	$("#login-schoolname").innerText = school.name;
	uuid = school.uuid;
	schoolCode = code;
	setLang(school.lang)
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

	$("#schoolname").innerText = school.name + " ";
	if(school.isDemo) {
		const demoBadge = document.createElement("span");
		demoBadge.innerText = "DEMO";
		demoBadge.classList.add("badge");
		$("#schoolname").appendChild(demoBadge);
	}
	username = username.toLowerCase() == "admin" ? "Admin" : school.teachers.find(t => t.name.toLowerCase() === username.toLowerCase()).name;
	$("#dashboard-username").innerText = username;
	role = username.toLowerCase() == "admin" ? "admin" : "teacher";
	$("#dashboard-role").innerText = translate(role);
	role = role.toLowerCase();

	if(role == "admin") {
		const teachersEl = document.createElement("h3");
		teachersEl.innerText = translate("teachers");
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
	roomsEl.innerText = translate("rooms");
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
	coursesEl.innerText = translate("courses");
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
	if(role == "admin") {
		const settingsEl = document.createElement("h3");
		settingsEl.innerText = translate("settings");
		settingsEl.style.marginTop = "auto";
		settingsEl.id = "settings-nav";
		settingsEl.addEventListener("click", () => {
			for(const item of navItems) {
				item.classList.remove("active");
			}
			settingsEl.classList.add("active");
			for(const item of contentItems) {
				item.style.display = "none";
			}
			selectedCourse = null;
			$("#settings").style.display = "";
		});
		navItems.push(settingsEl);
		$("#nav").appendChild(settingsEl);
	}

	$("#setting-lang").value = school.lang;
	$("#setting-lang").addEventListener("change", () => {
		ws.send(JSON.stringify({ type: "setLang", lang: $("#setting-lang").value }));
		requestAnimationFrame(() => {
			alert(translate("reload-to-apply-new-lang"))
		})
	});
	$("#setting-channel").value = school.channel;
	$("#setting-channel").addEventListener("change", () => {
		ws.send(JSON.stringify({ type: "setChannel", channel: $("#setting-channel").value }));
	});

	$("#dashboard").classList.remove("loading");
}

function createCourse(course) {
	// Array item
	courses.push(course);
	allRoomsRenderCourses();
	
	// Nav item
	createCourseNavItem(course);
	
	// Courses item
	createCourseItem(course);
}

function createCourseNavItem(course) {
	const h3 = document.createElement("h3");
	h3.setAttribute("data-course-nav", course.uuid);
	const img = document.createElement("img");
	img.src = "../arrow.svg";
	h3.appendChild(img);
	h3.appendChild(document.createTextNode(" " + course.name));
	if($("#settings-nav")) {
		$("#nav").insertBefore(h3, $("#settings-nav"))
	} else {
		$("#nav").appendChild(h3);
	}
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
		ws.send(JSON.stringify({type: "getVerifications", course: course.uuid}));
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
	const renameButton = document.createElement("button");
	renameButton.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.75 2h3.998a.75.75 0 0 1 .102 1.493l-.102.007H12.5v17h1.246a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743l-.102.007H9.75a.75.75 0 0 1-.102-1.493l.102-.007h1.249v-17H9.75a.75.75 0 0 1-.743-.648L9 2.75a.75.75 0 0 1 .648-.743L9.75 2Zm8.496 2.997a3.253 3.253 0 0 1 3.25 3.25l.004 7.504a3.249 3.249 0 0 1-3.064 3.246l-.186.005h-4.745V4.996h4.74Zm-8.249 0L9.992 19H5.25A3.25 3.25 0 0 1 2 15.751V8.247a3.25 3.25 0 0 1 3.25-3.25h4.747Z" fill="#fff"/></svg>';
	renameButton.addEventListener("click", () => {
		const newName = prompt(translate("new-name"), h2.innerText);
		if(newName) {
			ws.send(JSON.stringify({type: "renameCourse", uuid: course.uuid, name: newName}));
			course.name = newName;
			courses.splice(courses.indexOf(course), 1);
			courses.push(course);
			allRoomsRenderCourses();
		}
	});
	actions.appendChild(renameButton);
	const deleteButton = document.createElement("button");
	deleteButton.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#C34040"/></svg>';
	deleteButton.addEventListener("click", () => {
		ws.send(JSON.stringify({ type: "deleteCourse", uuid: course.uuid }));
		courses.splice(courses.indexOf(course), 1);
		allRoomsRenderCourses();
	});
	actions.appendChild(deleteButton);
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
	const changePasswordButton = document.createElement("button");
	changePasswordButton.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.25 5A3.25 3.25 0 0 0 2 8.25v7.5A3.25 3.25 0 0 0 5.25 19h13.5A3.25 3.25 0 0 0 22 15.75v-7.5A3.25 3.25 0 0 0 18.75 5H5.25Zm1.03 5.22.72.72.72-.72a.75.75 0 1 1 1.06 1.06l-.719.72.72.718A.75.75 0 1 1 7.72 13.78L7 13.06l-.72.72a.75.75 0 0 1-1.06-1.06l.72-.72-.72-.72a.75.75 0 0 1 1.06-1.06Zm5.5 0 .72.72.72-.72a.75.75 0 1 1 1.06 1.06l-.719.72.72.718a.75.75 0 1 1-1.061 1.061l-.72-.719-.72.72a.75.75 0 1 1-1.06-1.06l.72-.72-.72-.72a.75.75 0 0 1 1.06-1.06Zm3.97 4.03a.75.75 0 0 1 .75-.75h1.75a.75.75 0 0 1 0 1.5H16.5a.75.75 0 0 1-.75-.75Z" fill="#fff"/></svg>';
	changePasswordButton.addEventListener("click", () => {
		const newPw = prompt(translate("new-password"));
		if(newPw) {
			ws.send(JSON.stringify({ type: "changeTeacherPassword", uuid: teacher.uuid, password: newPw }));
		}
	});
	actions.appendChild(changePasswordButton);
	const deleteButton = document.createElement("button");
	deleteButton.innerHTML = '<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#C34040"/></svg>';
	deleteButton.addEventListener("click", () => {
		ws.send(JSON.stringify({ type: "deleteTeacher", uuid: teacher.uuid }));
	})
	actions.appendChild(deleteButton);
	$("#teachers").insertBefore(div, $("#addteacher"));
}

function roomRenderCourses(select) {
	select.innerHTML = "";
	const option = document.createElement("option");
	option.innerText = translate("no-course");
	option.value = "nocourse";
	select.appendChild(option);
	for(const course of courses) {
		const option = document.createElement("option");
		option.innerText = course.name;
		option.value = course.uuid;
		select.appendChild(option);
	}
}

function allRoomsRenderCourses() {
	for(const el of $$("[data-room] select")) {
		console.log("[RENDER] ", el);
		roomRenderCourses(el);
	}
}
window.allRoomsRenderCourses = allRoomsRenderCourses;

function createRoom(room) {
	console.log("Room", room);
	const div = document.createElement("div");
	div.classList.add("box");
	div.setAttribute("data-room", room.uuid);
	const h2 = document.createElement("h2");
	h2.innerText = room.name;
	div.appendChild(h2);
	const select = document.createElement("select");
	select.addEventListener("change", (e) => {
		ws.send(JSON.stringify({ type: "setActiveCourse", uuid: room.uuid, course: select.value }));
	});
	roomRenderCourses(select);
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
	console.log(leaderboard);
	$("#leaderboard table").innerHTML = "";
	$("#absents").innerHTML = "";
	const tr = document.createElement("tr");
	const th = document.createElement("th");
	th.innerText = translate("place");
	tr.appendChild(th);
	const th2 = document.createElement("th");
	th2.innerText = translate("name");
	tr.appendChild(th2);
	const th3 = document.createElement("th");
	th3.innerText = translate("excercise");
	tr.appendChild(th3);
	const th4 = document.createElement("th");
	th4.innerText = translate("quizpercent");
	tr.appendChild(th4);
	const th5 = document.createElement("th");
	th5.innerText = translate("actions");
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

		const nameWrapper = document.createElement("div");
		nameWrapper.style.display = "flex";
		nameWrapper.style.alignItems = "center";
		nameWrapper.style.gap = "5px";
		nameWrapper.style.justifyContent = "center";
		name.appendChild(nameWrapper);

		const statusIcon = document.createElement("div");
		statusIcon.classList.add("statusicon");
		statusIcon.classList.add("status-" + student.status);
		nameWrapper.appendChild(statusIcon);

		const nameSpan = document.createElement("span");
		nameSpan.innerText = student.name;
		nameWrapper.appendChild(nameSpan);

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
		kickAction.title = translate("kickaction").replaceAll("%s", student.name);
		actions.appendChild(kickAction);

		const deleteAction = document.createElement("button");
		deleteAction.innerHTML = `<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 6a1 1 0 0 1-.883.993L20.5 7h-.845l-1.231 12.52A2.75 2.75 0 0 1 15.687 22H8.313a2.75 2.75 0 0 1-2.737-2.48L4.345 7H3.5a1 1 0 0 1 0-2h5a3.5 3.5 0 1 1 7 0h5a1 1 0 0 1 1 1Zm-7.25 3.25a.75.75 0 0 0-.743.648L13.5 10v7l.007.102a.75.75 0 0 0 1.486 0L15 17v-7l-.007-.102a.75.75 0 0 0-.743-.648Zm-4.5 0a.75.75 0 0 0-.743.648L9 10v7l.007.102a.75.75 0 0 0 1.486 0L10.5 17v-7l-.007-.102a.75.75 0 0 0-.743-.648ZM12 3.5A1.5 1.5 0 0 0 10.5 5h3A1.5 1.5 0 0 0 12 3.5Z" fill="#A03030"/></svg>`;
		deleteAction.addEventListener("dblclick", () => {
			ws.send(JSON.stringify({ type: "delete", uuid: student.uuid, courseUUID: selectedCourse.uuid }));
		});
		deleteAction.title = translate("deleteaction").replaceAll("%s", student.name);
		actions.appendChild(deleteAction);

		const setLevelAction = document.createElement("button");
		setLevelAction.innerHTML = `<svg width="40px" height="40px" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7.975 9.689a1 1 0 1 1-1.45-1.378l4.75-5a1 1 0 0 1 1.45 0l4.75 5a1 1 0 1 1-1.45 1.378L13 6.505v10.99l3.025-3.184a1 1 0 1 1 1.45 1.378l-4.75 5a1 1 0 0 1-1.45 0l-4.75-5a1 1 0 1 1 1.45-1.378L11 17.495V6.505L7.975 9.689Z" fill="#ffffff"/></svg>`;
		setLevelAction.addEventListener("click", () => {
			const level = prompt(translate("setlevelaction").replaceAll("%s", student.name), student.level);
			if(level == null) return;
			ws.send(JSON.stringify({ type: "setLevel", uuid: student.uuid, level: parseInt(level), courseUUID: selectedCourse.uuid }));
		});
		setLevelAction.title = translate("setlevelaction").replaceAll("%s", student.name);
		actions.appendChild(setLevelAction);

		tr.appendChild(actions);
		$("#leaderboard table").appendChild(tr);

		if(student.status == "offline") {
			const absentStudent = document.createElement("absent-student");
			absentStudent.innerText = student.name;
			document.querySelector("#absents").append(absentStudent);
		}
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
			$("#login").disabled = true;
			$("#login-spinner").style.display = "";
			await loginSchoolcode($("#code").value);
		}
	}
})

$("#login-btn").addEventListener("click", async (e) => {
	$("#code").disabled = true;
	$("#login").disabled = true;
	$("#login-spinner").style.display = "";
	await loginSchoolcode($("#code").value);
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

$("#code").value = "";









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

$("#show-absents-button").addEventListener("click", () => {
	$("#absents").style.display = "";
	$("#hide-absents-button").style.display = "";
	$("#show-absents-button").style.display = "none";
});

$("#hide-absents-button").addEventListener("click", () => {
	$("#absents").style.display = "none";
	$("#hide-absents-button").style.display = "none";
	$("#show-absents-button").style.display = "";
});

$("#verify-task").addEventListener("click", () => {
	ws.send(JSON.stringify({ type: "verify", uuid: $("#verify-student").getAttribute("data-studentuuid"), course: selectedCourse.uuid }));
})

$("#decline-verification").addEventListener("click", () => {
	ws.send(JSON.stringify({ type: "dismiss", uuid: $("#verify-student").getAttribute("data-studentuuid"), course: selectedCourse.uuid }));
})
