import { v4 as uuid } from "uuid";
import { loggedIn, tasks } from "./main.js";
import { Course } from "./model/course.js";
import { Room } from "./model/room.js";
import { School } from "./model/school.js";
import { Student } from "./model/student.js";
import { Teacher } from "./model/teacher.js";
import { authenticate, hasJsonStructure, validClientTypes, capitalizeWords, courseLeaderboardJSON, studentLevelpath } from "./utils.js";

export class Connection {
	clientType = "";
	isAdmin = false;
	school;
	room;
	name;
	cid = uuid();
	ws
	uuid

	constructor(ws) {
		this.ws = ws;
		this.ws.addEventListener("message", async (msg) => {
			if(!hasJsonStructure(msg.data)) {
				this.ws.send(JSON.stringify({type: "conversationError", error: "You are speaking nonsense to me"}))
				this.ws.close();
				return;
			}
			const packet = JSON.parse(msg.data);
			if(packet.type == "hi") {
				this.school = await School.findOne({ where: { code: packet.schoolCode }, include: [Teacher, Course, Room] });
				if(!this.school) {
					this.ws.send(JSON.stringify({type: "hi", success: false}));
					return;
				}
				if(validClientTypes.indexOf(packet.clientType) != -1) {
					this.clientType = packet.clientType;
				} else {
					this.ws.send(JSON.stringify({type: "conversationError", error: "Thats not a valid client type"}));
					this.ws.close();
					return;
				}
				if(this.clientType == "teacher") {
					// Authenticate teacher using authenticate function
					const auth = await authenticate(this.school.uuid, packet.username, packet.password);
					if(auth.error) {
						this.ws.send(JSON.stringify({type: "hi", success: false}));
						return;
					}
					this.isAdmin = auth.admin;
					this.ws.send(JSON.stringify({type: "hi", success: true, school: this.school, lang: this.school.lang}));
				} else if(this.clientType == "student") {
					const rooms = await this.school.getRooms();
					this.ws.send(JSON.stringify({type: "hi", success: true, schoolname: this.school.name, rooms, lang: this.school.lang}));
				}
				return;
			}
			if(this.clientType == "") {
				this.ws.send(JSON.stringify({type: "conversationError", error: "You aren't authenticated yet"}))
				this.ws.close();
				return;
			}
			if(this.clientType == "teacher" && this.isAdmin) {
				if(packet.type == "addTeacher") {
					if(!packet.username || !packet.password) {
						this.ws.send(JSON.stringify({type: "addTeacher", success: false, error: "Missing name or password"}));
						return;
					}
					const t = await this.school.createTeacher({name: packet.username, password: packet.password});
					this.ws.send(JSON.stringify({type: "addTeacher", success: true, teacher: t}));
				} else if(packet.type == "deleteTeacher") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "deleteTeacher", success: false, error: "Missing uuid"}));
						return;
					}
					const t = await this.school.getTeachers();
					const teacher = t.find(t => t.uuid == packet.uuid);
					if(!teacher) {
						this.ws.send(JSON.stringify({type: "deleteTeacher", success: false, error: "Teacher not found"}));
						return;
					}
					await teacher.destroy();
					this.ws.send(JSON.stringify({type: "deleteTeacher", success: true, wasUUID: packet.uuid}));
				} else if(packet.type == "addCourse") {
					if(!packet.name) {
						this.ws.send(JSON.stringify({type: "addCourse", success: false, error: "Missing name"}));
						return;
					}
					const c = await this.school.createCourse({name: packet.name});
					this.ws.send(JSON.stringify({type: "addCourse", success: true, course: c}));
				} else if(packet.type == "deleteCourse") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "deleteCourse", success: false, error: "Missing uuid"}));
						return;
					}
					const c = await this.school.getCourses();
					const course = c.find(c => c.uuid == packet.uuid);
					if(!course) {
						this.ws.send(JSON.stringify({type: "deleteCourse", success: false, error: "Course not found"}));
						return;
					}
					await course.destroy();
					this.ws.send(JSON.stringify({type: "deleteCourse", success: true, wasUUID: packet.uuid}));
				} else if(packet.type == "addRoom") {
					if(!packet.name) {
						this.ws.send(JSON.stringify({type: "addRoom", success: false, error: "Missing name"}));
						return;
					}
					const r = await this.school.createRoom({name: packet.name});
					this.ws.send(JSON.stringify({type: "addRoom", success: true, room: r}));
				} else if(packet.type == "deleteRoom") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "deleteRoom", success: false, error: "Missing uuid"}));
						return;
					}
					const r = await this.school.getRooms();
					const room = r.find(r => r.uuid == packet.uuid);
					if(!room) {
						this.ws.send(JSON.stringify({type: "deleteRoom", success: false, error: "Room not found"}));
						return;
					}
					await room.destroy();
					this.ws.send(JSON.stringify({type: "deleteRoom", success: true, wasUUID: packet.uuid}));
				} else if(packet.type == "setLang") {
					if(!packet.lang) {
						this.ws.send(JSON.stringify({type: "setLang", success: false, error: "Missing lang"}));
						return;
					}
					this.school.lang = packet.lang;
					await this.school.save();
					this.ws.send(JSON.stringify({type: "setLang", success: true, lang: this.school.lang}));
				}
			}
			if(this.clientType == "teacher") {
				if(packet.type == "setActiveCourse") {
					if(!packet.uuid || !packet.course) {
						this.ws.send(JSON.stringify({type: "setActiveCourse", success: false, error: "Missing uuid or course"}));
						return;
					}
					const r = await this.school.getRooms();
					const room = r.find(r => r.uuid == packet.uuid) || null;
					if(!room) {
						this.ws.send(JSON.stringify({type: "setActiveCourse", success: false, error: "Room not found"}));
						return;
					}
					const c = await this.school.getCourses();
					const course = c.find(c => c.uuid == packet.course) || null;
					if(!course && packet.course != "nocourse") {
						this.ws.send(JSON.stringify({type: "setActiveCourse", success: false, error: "Course not found"}));
						return;
					}
					await room.setCourse(course);
					this.ws.send(JSON.stringify({type: "setActiveCourse", success: true, course: course}));
				} else if(packet.type == "startCourse") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "startCourse", success: false, error: "Missing uuid"}));
						return;
					}
					const c = await this.school.getCourses();
					const course = c.find(c => c.uuid == packet.uuid) || null;
					if(!course) {
						this.ws.send(JSON.stringify({type: "startCourse", success: false, error: "Course not found"}));
						return;
					}
					course.isRunning = true;
					await course.save();
					for(const logged of loggedIn) {
						if(logged.clientType == "student") {
							if(!logged.room) continue;
							const c = await logged.room.getCourse();
							if(!c) continue;
							if(!c.uuid == c.uuid) continue;
							logged.ws.send(JSON.stringify({type: "startCourse"}));
						} else if(logged.clientType == "teacher") {
							if(logged.cid == this.cid) continue;
							if(logged.school.uuid != this.school.uuid) continue;
							logged.ws.send(JSON.stringify({type: "startCourse", course}));
						}
					}
					this.ws.send(JSON.stringify({type: "startCourse", success: true, course}));
				} else if(packet.type == "stopCourse") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "stopCourse", success: false, error: "Missing uuid"}));
						return;
					}
					const c = await this.school.getCourses();
					const course = c.find(c => c.uuid == packet.uuid) || null;
					if(!course) {
						this.ws.send(JSON.stringify({type: "stopCourse", success: false, error: "Course not found"}));
						return;
					}
					course.isRunning = false;
					await course.save();
					for(const logged of loggedIn) {
						if(logged.clientType == "student") {
							if(!logged.room) continue;
							const c = await logged.room.getCourse();
							if(!c) continue;
							if(!c.uuid == c.uuid) continue;
							logged.ws.send(JSON.stringify({type: "stopCourse"}));
						} else if(logged.clientType == "teacher") {
							if(logged.cid == this.cid) continue;
							if(logged.school.uuid != this.school.uuid) continue;
							logged.ws.send(JSON.stringify({type: "stopCourse", course}));
						}
					}
					this.ws.send(JSON.stringify({type: "stopCourse", success: true, course}));
				} else if(packet.type == "getCourseInfo") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "getCourseInfo", success: false, error: "Missing uuid"}));
						return;
					}
					const c = await this.school.getCourses();
					const course = c.find(c => c.uuid == packet.uuid) || null;
					if(!course) {
						this.ws.send(JSON.stringify({type: "getCourseInfo", success: false, error: "Course not found"}));
						return;
					}
					this.ws.send(JSON.stringify({type: "getCourseInfo", success: true, leaderboard: await courseLeaderboardJSON(course)}));
				} else if(packet.type == "kick") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "kick", success: false, error: "Missing uuid"}));
						return;
					}
					const student = await Student.findOne({where: {uuid: packet.uuid}});
					if(!student) {
						this.ws.send(JSON.stringify({type: "kick", success: false, error: "Student not found"}));
						return;
					}
					const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
					if(logged) {
						logged.ws.send(JSON.stringify({type: "kick"}));
						logged.ws.close();
					}
				} else if(packet.type == "delete") {
					if(!packet.uuid || !packet.courseUUID) {
						this.ws.send(JSON.stringify({type: "delete", success: false, error: "Missing uuid or courseUUID"}));
						return;
					}
					const course = await Course.findOne({where: {uuid: packet.courseUUID}});
					if(!course) {
						this.ws.send(JSON.stringify({type: "delete", success: false, error: "Course not found"}));
						return;
					}
					const student = await Student.findOne({where: {uuid: packet.uuid}});
					if(!student) {
						this.ws.send(JSON.stringify({type: "delete", success: false, error: "Student not found"}));
						return;
					}
					const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
					if(logged) {
						logged.ws.send(JSON.stringify({type: "kick"}));
						logged.ws.close();
					}
					await student.destroy();
					for(const logged of loggedIn) {
						if(logged.clientType == "student") {
							if(!logged.room) continue;
							if(!logged.room.courseUuid == course.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)}));
						} else if(logged.clientType == "teacher") {
							if(logged.cid == this.cid) continue;
							if(logged.school.uuid != this.school.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)}));
						}
					}
				} else if(packet.type == "setLevel") {
					if(!packet.uuid || !packet.courseUUID) {
						this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Missing uuid or courseUUID"}));
						return;
					}
					const course = await Course.findOne({where: {uuid: packet.courseUUID}});
					if(!course) {
						this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Course not found"}));
						return;
					}
					const student = await Student.findOne({where: {uuid: packet.uuid}});
					if(!student) {
						this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Student not found"}));
						return;
					}
					student.level = packet.level;
					await student.save();
					const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
					if(logged) {
						logged.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
					}
					for(const logged of loggedIn) {
						if(logged.clientType == "student") {
							if(!logged.room) continue;
							if(!logged.room.courseUuid == course.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)}));
						} else if(logged.clientType == "teacher") {
							// if(logged.cid == this.cid) continue;
							if(logged.school.uuid != this.school.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)}));
						}
					}
				}
			}
			if(this.clientType == "student") {
				if(packet.type == "room") {
					if(!packet.uuid) {
						this.ws.send(JSON.stringify({type: "room", success: false, error: "Missing uuid"}));
						return;
					}
					const r = await this.school.getRooms();
					const _room = r.find(r => r.uuid == packet.uuid) || null;
					if(!_room) {
						this.ws.send(JSON.stringify({type: "room", success: false, error: "Room not found"}));
						return;
					}
					this.room = _room;
					this.ws.send(JSON.stringify({type: "room", success: true }));
				} else if(packet.type == "login") {
					if(!packet.name) {
						this.ws.send(JSON.stringify({type: "login", success: false, error: "Missing name"}));
						return;
					}
					if(!this.room) {
						this.ws.send(JSON.stringify({type: "login", success: false, error: "You have not joined a room yet"}));
						return;
					}
					this.room.reload();
					const course = await this.room.getCourse();
					if(course == null) {
						this.ws.send(JSON.stringify({type: "login", success: false, error: "Teacher has not set a course yet"}));
						return;
					}
					const s = await course.getStudents();
					let student = s.find(s => s.name == capitalizeWords(packet.name.split(" ")).join(" ")) || null;
					if(!student) {
						student = await course.createStudent({name: capitalizeWords(packet.name.split(" ")).join(" ")});
					}
					this.name = student.name;
					this.uuid = student.uuid;
					this.ws.send(JSON.stringify({type: "login", success: true, student}));
					this.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
					this.ws.send(JSON.stringify({type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)}));
				} else if(packet.type == "info") {
					if(!packet.level) {
						this.ws.send(JSON.stringify({type: "info", success: false, error: "Missing level id"}));
						return;
					}
					this.ws.send(JSON.stringify({ type: "info", name: tasks[packet.level].name, desc: tasks[packet.level].desc }));
				} else if(packet.type == "task") {
					if(!packet.level) {
						this.ws.send(JSON.stringify({type: "task", success: false, error: "Missing level id"}));
						return;
					}
					const course = await this.room.getCourse();
					if(course == null) return;
					if(!course.isRunning) {
						this.ws.send(JSON.stringify({type: "task", success: false, error: "Course is not running"}));
						return;
					}
					const s = await course.getStudents();
					const student = s.find(s => s.name == capitalizeWords(this.name.split(" ")).join(" ")) || null;
					if(!student) return;
					if(!(packet.level <= student.level)) {
						this.ws.send(JSON.stringify({type: "task", success: false, error: "You have not completed the previous level yet"}));
						this.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
						return;
					}
					if(!tasks[packet.level]) {
						this.ws.send(JSON.stringify({type: "task", success: false, error: "Level not found"}));
						this.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
						return;
					}
					this.ws.send(JSON.stringify({ type: "task", success: true, task: tasks[packet.level] }));
				} else if(packet.type == "done") {
					if(!packet.level) {
						this.ws.send(JSON.stringify({type: "done", success: false, error: "Missing level id"}));
						return;
					}
					const course = await this.room.getCourse();
					if(course == null) return;
					if(!course.isRunning) {
						this.ws.send(JSON.stringify({type: "done", success: false, error: "Course is not running"}));
						return;
					}
					const s = await course.getStudents();
					const student = s.find(s => s.name == capitalizeWords(this.name.split(" ")).join(" ")) || null;
					if(!student) return;
					if(packet.level != student.level) return;
					if(!tasks[packet.level]) {
						this.ws.send(JSON.stringify({type: "done", success: false, error: "Level not found"}));
						this.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
						return;
					}
					student.level++;
					if(packet.answeredqs) student.answeredqs += packet.answeredqs;
					if(packet.correctqs) student.correctqs += packet.correctqs;
					student.achievementdata.completedLevels++;
					if(student.achievementdata.completedLevels == 5) {
						if(!student.achievements.includes("fast")) {
							student.achievements.push("fast");
						}
					}
					await student.save();
					const leaderboard = await courseLeaderboardJSON(course);
					if(leaderboard[0] == leaderboard.find(u => u.name == capitalizeWords(this.name.split(" ")).join(" "))) {
						if(!student.achievements.includes("first")) {
							student.achievements.push("first");
							await student.save();
						}
					}
					for(const logged of loggedIn) {
						if(logged.clientType == "student") {
							if(!logged.room) continue;
							const c = await logged.room.getCourse();
							if(!c) continue;
							if(!c.uuid == c.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", ...courseLeaderboardJSON(await student.getCourse())}));
						} else if(logged.clientType == "teacher") {
							if(logged.school.uuid != this.school.uuid) continue;
							logged.ws.send(JSON.stringify({type: "leaderboard", course, ...courseLeaderboardJSON(await student.getCourse())}));
						}
					}
					ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student)}));
				}
			}
		});
	}
}