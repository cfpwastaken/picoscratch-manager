import { v4 as uuid } from "uuid";
import { lastPing, loggedIn, tasks, demoTasks } from "./main.js";
import Course from "./model/course.js";
import Room from "./model/room.js";
import School from "./model/school.js";
import Student from "./model/student.js";
import Teacher from "./model/teacher.js";
import { authenticate, hasJsonStructure, validClientTypes, capitalizeWords, courseLeaderboardJSON, studentLevelpath, studentSections } from "./utils.js";
import { InPacket, InTeacherHiPacket } from "./types/Packet.js";
import CodeGroup from "./model/codegroups.js";
const TASK_VERIFICATION_NEEDED = true;
const awaitingVerification = {};
const peopleInGroup = {};
const peopleInGroupRequestingSync = {};
function broadcastAdmins(school, packet, exceptCID) {
    for (const connection of loggedIn) {
        if (exceptCID && connection.cid == exceptCID)
            continue;
        if (connection.isAdmin && connection.school.uuid == school.uuid) {
            connection.ws.send(JSON.stringify(packet));
        }
    }
}
function broadcastTeachers(school, packet, exceptCID) {
    for (const connection of loggedIn) {
        if (connection.clientType != "teacher")
            continue;
        if (exceptCID && connection.cid == exceptCID)
            continue;
        if (connection.school.uuid != school.uuid)
            continue;
        connection.ws.send(JSON.stringify(packet));
    }
}
async function broadcastStudentsInCourse(course, packet) {
    for (const connection of loggedIn) {
        if (connection.clientType != "student")
            continue;
        if (!connection.room)
            continue;
        const c = await connection.room.$get("course");
        if (!c)
            continue;
        if (c.uuid != course.uuid)
            continue;
        connection.ws.send(JSON.stringify(packet));
    }
}
async function resendLeaderboard(school, course) {
    const leaderboard = await courseLeaderboardJSON(course);
    await broadcastStudentsInCourse(course, { type: "leaderboard", leaderboard });
    broadcastTeachers(school, { type: "leaderboard", course, leaderboard });
}
function sendVerifications(courseUUID, ws) {
    ws.send(JSON.stringify(getVerifications(courseUUID)));
}
function getVerifications(courseUUID) {
    if (!awaitingVerification[courseUUID]) {
        return { type: "verifications", verifications: [] };
    }
    return { type: "verifications", verifications: awaitingVerification[courseUUID].map(v => {
            const logged = loggedIn.find(l => l.uuid == v.uuid);
            if (!logged)
                return null;
            return {
                uuid: logged.uuid,
                name: logged.name
            };
        }) };
}
function broadcastVerifications(school, courseUUID, exceptCID) {
    broadcastTeachers(school, getVerifications(courseUUID), exceptCID);
}
export class Connection {
    clientType = "";
    isAdmin = false;
    school;
    room;
    name;
    cid = uuid();
    ws;
    uuid;
    idle;
    thisTeacher;
    constructor(ws) {
        this.ws = ws;
        this.ws.addEventListener("message", async (msg) => {
            if (!hasJsonStructure(msg.data.toString())) {
                this.ws.send(JSON.stringify({ type: "conversationError", error: "You are speaking nonsense to me" }));
                this.ws.close();
                return;
            }
            const rawpacket = JSON.parse(msg.data.toString());
            const zodVerify = InPacket.safeParse(rawpacket);
            if (!zodVerify.success) {
                this.ws.send(JSON.stringify({ type: "conversationError", error: "I don't know of such a packet!", zoderror: zodVerify.error.issues }));
                this.ws.close();
                return;
            }
            const packet = zodVerify.data;
            console.log("USER SENDS", JSON.stringify(packet));
            if (packet.type == "hi") {
                const s = await School.findOne({ where: { code: packet.schoolCode }, include: [Teacher, Course, Room] });
                if (s == null) {
                    this.ws.send(JSON.stringify({ type: "hi", success: false }));
                    return;
                }
                this.school = s;
                if (!this.school) {
                    this.ws.send(JSON.stringify({ type: "hi", success: false }));
                    return;
                }
                if (validClientTypes.indexOf(packet.clientType) != -1) {
                    this.clientType = packet.clientType;
                }
                else {
                    this.ws.send(JSON.stringify({ type: "conversationError", error: "Thats not a valid client type" }));
                    this.ws.close();
                    return;
                }
                if (this.clientType == "teacher") {
                    if (!InTeacherHiPacket.safeParse(packet).success) {
                        this.ws.send(JSON.stringify({ type: "conversationError", error: "You are speaking nonsense to me" }));
                        this.ws.close();
                        return;
                    }
                    const pack = packet;
                    // Authenticate teacher using authenticate function
                    const auth = await authenticate(this.school.uuid, pack.username, pack.password);
                    if (auth.error) {
                        this.ws.send(JSON.stringify({ type: "hi", success: false }));
                        return;
                    }
                    this.isAdmin = auth.admin;
                    if (!(pack.username.toLowerCase() == "admin")) {
                        const ts = await s.$get("teachers");
                        const t = ts.find(t => t.name.toLowerCase() == pack.username.toLowerCase());
                        if (t)
                            this.thisTeacher = t;
                    }
                    this.ws.send(JSON.stringify({ type: "hi", success: true, school: this.school, lang: this.school.lang }));
                }
                else if (this.clientType == "student") {
                    const rooms = await this.school.$get("rooms");
                    this.ws.send(JSON.stringify({ type: "hi", success: true, schoolname: this.school.name, rooms, lang: this.school.lang }));
                }
                return;
            }
            else if (packet.type == "pong") {
                // Calculate ping time using the lastPing variable
                const ping = Date.now() - lastPing;
                // If thats too long, send a warning packet
                if (ping > 1000) {
                    this.ws.send(JSON.stringify({ type: "pingWarn", warning: "Your ping is too high. You might experience lag" }));
                }
                ws.send(JSON.stringify({ type: "pingTime", ping }));
                return;
            }
            if (this.clientType == "") {
                this.ws.send(JSON.stringify({ type: "conversationError", error: "You aren't authenticated yet" }));
                this.ws.close();
                return;
            }
            if (this.clientType == "teacher" && this.isAdmin) {
                if (packet.type == "addTeacher") {
                    if (!packet.username || !packet.password) {
                        this.ws.send(JSON.stringify({ type: "addTeacher", success: false, error: "Missing name or password" }));
                        return;
                    }
                    if (this.school.isDemo) {
                        if ((await this.school.$count("teachers")) >= 10) {
                            this.ws.send(JSON.stringify({ type: "addTeacher", success: false, error: "Demo schools can only have up to 10 teachers" }));
                            return;
                        }
                    }
                    const t = await this.school.$create("teacher", { name: packet.username, password: packet.password });
                    this.ws.send(JSON.stringify({ type: "addTeacher", success: true, teacher: t }));
                    broadcastAdmins(this.school, { type: "addTeacher", teacher: t }, this.cid);
                }
                else if (packet.type == "deleteTeacher") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "deleteTeacher", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const t = await this.school.$get("teachers");
                    const teacher = t.find(t => t.uuid == packet.uuid);
                    if (!teacher) {
                        this.ws.send(JSON.stringify({ type: "deleteTeacher", success: false, error: "Teacher not found" }));
                        return;
                    }
                    await teacher.destroy();
                    this.ws.send(JSON.stringify({ type: "deleteTeacher", success: true, wasUUID: packet.uuid }));
                    broadcastAdmins(this.school, { type: "deleteTeacher", wasUUID: packet.uuid }, this.cid);
                }
                else if (packet.type == "addCourse") {
                    if (!packet.name) {
                        this.ws.send(JSON.stringify({ type: "addCourse", success: false, error: "Missing name" }));
                        return;
                    }
                    if (this.school.isDemo) {
                        if ((await this.school.$count("courses")) >= 10) {
                            this.ws.send(JSON.stringify({ type: "addCourse", success: false, error: "Demo schools can only have up to 10 courses" }));
                            return;
                        }
                    }
                    const c = await this.school.$create("course", { name: packet.name });
                    this.ws.send(JSON.stringify({ type: "addCourse", success: true, course: c }));
                    broadcastAdmins(this.school, { type: "addCourse", course: c }, this.cid);
                }
                else if (packet.type == "deleteCourse") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "deleteCourse", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.uuid);
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "deleteCourse", success: false, error: "Course not found" }));
                        return;
                    }
                    await course.destroy();
                    this.ws.send(JSON.stringify({ type: "deleteCourse", success: true, wasUUID: packet.uuid }));
                    broadcastAdmins(this.school, { type: "deleteCourse", wasUUID: packet.uuid }, this.cid);
                }
                else if (packet.type == "addRoom") {
                    if (!packet.name) {
                        this.ws.send(JSON.stringify({ type: "addRoom", success: false, error: "Missing name" }));
                        return;
                    }
                    if (this.school.isDemo) {
                        if ((await this.school.$count("rooms")) >= 10) {
                            this.ws.send(JSON.stringify({ type: "addRoom", success: false, error: "Demo schools can only have up to 10 rooms" }));
                            return;
                        }
                    }
                    const r = await this.school.$create("room", { name: packet.name });
                    this.ws.send(JSON.stringify({ type: "addRoom", success: true, room: r }));
                    broadcastAdmins(this.school, { type: "addRoom", room: r }, this.cid);
                }
                else if (packet.type == "deleteRoom") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "deleteRoom", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const r = await this.school.$get("rooms");
                    const room = r.find(r => r.uuid == packet.uuid);
                    if (!room) {
                        this.ws.send(JSON.stringify({ type: "deleteRoom", success: false, error: "Room not found" }));
                        return;
                    }
                    await room.destroy();
                    this.ws.send(JSON.stringify({ type: "deleteRoom", success: true, wasUUID: packet.uuid }));
                    broadcastAdmins(this.school, { type: "deleteRoom", wasUUID: packet.uuid }, this.cid);
                }
                else if (packet.type == "setLang") {
                    if (!packet.lang) {
                        this.ws.send(JSON.stringify({ type: "setLang", success: false, error: "Missing lang" }));
                        return;
                    }
                    this.school.lang = packet.lang;
                    await this.school.save();
                    this.ws.send(JSON.stringify({ type: "setLang", success: true, lang: this.school.lang }));
                    broadcastAdmins(this.school, { type: "setLang", lang: this.school.lang }, this.cid);
                }
                else if (packet.type == "setChannel") {
                    if (!packet.channel) {
                        this.ws.send(JSON.stringify({ type: "setChannel", success: false, error: "Missing channel" }));
                        return;
                    }
                    this.school.channel = packet.channel;
                    await this.school.save();
                    this.ws.send(JSON.stringify({ type: "setChannel", success: true, channel: this.school.channel }));
                    broadcastAdmins(this.school, { type: "setChannel", channel: this.school.channel }, this.cid);
                }
                else if (packet.type == "changeTeacherPassword") {
                    if (!packet.uuid || !packet.password) {
                        this.ws.send(JSON.stringify({ type: "changeTeacherPassword", success: false, error: "Missing uuid or password" }));
                        return;
                    }
                    const t = await this.school.$get("teachers");
                    const teacher = t.find(t => t.uuid == packet.uuid);
                    if (!teacher) {
                        this.ws.send(JSON.stringify({ type: "changeTeacherPassword", success: false, error: "Teacher not found" }));
                        return;
                    }
                    teacher.password = packet.password;
                    await teacher.save();
                    this.ws.send(JSON.stringify({ type: "changeTeacherPassword", success: true, uuid: teacher.uuid }));
                }
                else if (packet.type == "renameCourse") {
                    if (!packet.uuid || !packet.name) {
                        this.ws.send(JSON.stringify({ type: "renameCourse", success: false, error: "Missing uuid or name" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.uuid);
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "renameCourse", success: false, error: "Course not found" }));
                        return;
                    }
                    course.name = packet.name;
                    await course.save();
                    broadcastTeachers(this.school, { type: "renameCourse", uuid: course.uuid, name: course.name });
                }
            }
            if (this.clientType == "teacher") {
                if (packet.type == "setActiveCourse") {
                    if (!packet.uuid || !packet.course) {
                        this.ws.send(JSON.stringify({ type: "setActiveCourse", success: false, error: "Missing uuid or course" }));
                        return;
                    }
                    const r = await this.school.$get("rooms");
                    const room = r.find(r => r.uuid == packet.uuid) || null;
                    if (!room) {
                        this.ws.send(JSON.stringify({ type: "setActiveCourse", success: false, error: "Room not found" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.course) || null;
                    if (!course && packet.course != "nocourse") {
                        this.ws.send(JSON.stringify({ type: "setActiveCourse", success: false, error: "Course not found" }));
                        return;
                    }
                    await room.$set("course", course);
                    this.ws.send(JSON.stringify({ type: "setActiveCourse", success: true, course: course }));
                    broadcastTeachers(this.school, { type: "setActiveCourse", uuid: packet.uuid, course: course }, this.cid);
                }
                else if (packet.type == "startCourse") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "startCourse", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.uuid) || null;
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "startCourse", success: false, error: "Course not found" }));
                        return;
                    }
                    course.isRunning = true;
                    await course.save();
                    // for(const logged of loggedIn) {
                    // 	if(logged.clientType == "student") {
                    // 		if(!logged.room) continue;
                    // 		const c = await logged.room.getCourse();
                    // 		if(!c) continue;
                    // 		if(!c.uuid == c.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "startCourse"}));
                    // 	} else if(logged.clientType == "teacher") {
                    // 		if(logged.cid == this.cid) continue;
                    // 		if(logged.school.uuid != this.school.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "startCourse", course}));
                    // 	}
                    // }
                    await broadcastStudentsInCourse(course, { type: "startCourse" });
                    broadcastTeachers(this.school, { type: "startCourse", course }, this.cid);
                    this.ws.send(JSON.stringify({ type: "startCourse", success: true, course }));
                }
                else if (packet.type == "stopCourse") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "stopCourse", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.uuid) || null;
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "stopCourse", success: false, error: "Course not found" }));
                        return;
                    }
                    course.isRunning = false;
                    await course.save();
                    // for(const logged of loggedIn) {
                    // 	if(logged.clientType == "student") {
                    // 		if(!logged.room) continue;
                    // 		const c = await logged.room.getCourse();
                    // 		if(!c) continue;
                    // 		if(!c.uuid == c.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "stopCourse"}));
                    // 	} else if(logged.clientType == "teacher") {
                    // 		if(logged.cid == this.cid) continue;
                    // 		if(logged.school.uuid != this.school.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "stopCourse", course}));
                    // 	}
                    // }
                    await broadcastStudentsInCourse(course, { type: "stopCourse" });
                    broadcastTeachers(this.school, { type: "stopCourse", course }, this.cid);
                    this.ws.send(JSON.stringify({ type: "stopCourse", success: true, course }));
                }
                else if (packet.type == "getCourseInfo") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "getCourseInfo", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const c = await this.school.$get("courses");
                    const course = c.find(c => c.uuid == packet.uuid) || null;
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "getCourseInfo", success: false, error: "Course not found" }));
                        return;
                    }
                    this.ws.send(JSON.stringify({ type: "getCourseInfo", success: true, leaderboard: await courseLeaderboardJSON(course) }));
                }
                else if (packet.type == "kick") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "kick", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const student = await Student.findOne({ where: { uuid: packet.uuid } });
                    if (!student) {
                        this.ws.send(JSON.stringify({ type: "kick", success: false, error: "Student not found" }));
                        return;
                    }
                    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
                    if (logged) {
                        logged.ws.send(JSON.stringify({ type: "kick" }));
                        logged.ws.close();
                    }
                }
                else if (packet.type == "delete") {
                    if (!packet.uuid || !packet.courseUUID) {
                        this.ws.send(JSON.stringify({ type: "delete", success: false, error: "Missing uuid or courseUUID" }));
                        return;
                    }
                    const course = await Course.findOne({ where: { uuid: packet.courseUUID } });
                    if (!course) {
                        this.ws.send(JSON.stringify({ type: "delete", success: false, error: "Course not found" }));
                        return;
                    }
                    const student = await Student.findOne({ where: { uuid: packet.uuid } });
                    if (!student) {
                        this.ws.send(JSON.stringify({ type: "delete", success: false, error: "Student not found" }));
                        return;
                    }
                    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
                    if (logged) {
                        logged.ws.send(JSON.stringify({ type: "kick" }));
                        logged.ws.close();
                    }
                    await student.destroy();
                    // for(const logged of loggedIn) {
                    // 	if(logged.clientType == "student") {
                    // 		if(!logged.room) continue;
                    // 		if(!logged.room.courseUuid == course.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)}));
                    // 	} else if(logged.clientType == "teacher") {
                    // 		if(logged.cid == this.cid) continue;
                    // 		if(logged.school.uuid != this.school.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)}));
                    // 	}
                    // }
                    // broadcastStudentsInCourse(course, {type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)});
                    // broadcastTeachers(this.school, {type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)});
                    await resendLeaderboard(this.school, course);
                }
                else if (packet.type == "setLevel") {
                    // if(!packet.uuid || !packet.courseUUID) {
                    // 	this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Missing uuid or courseUUID"}));
                    // 	return;
                    // }
                    // const course = await Course.findOne({where: {uuid: packet.courseUUID}});
                    // if(!course) {
                    // 	this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Course not found"}));
                    // 	return;
                    // }
                    // const student = await Student.findOne({where: {uuid: packet.uuid}});
                    // if(!student) {
                    // 	this.ws.send(JSON.stringify({type: "setLevel", success: false, error: "Student not found"}));
                    // 	return;
                    // }
                    // student.level = packet.level;
                    // await student.save();
                    // const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == student.uuid);
                    // if(logged) {
                    // 	logged.ws.send(JSON.stringify({type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks)}));
                    // }
                    // for(const logged of loggedIn) {
                    // 	if(logged.clientType == "student") {
                    // 		if(!logged.room) continue;
                    // 		if(!logged.room.courseUuid == course.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)}));
                    // 	} else if(logged.clientType == "teacher") {
                    // 		// if(logged.cid == this.cid) continue;
                    // 		if(logged.school.uuid != this.school.uuid) continue;
                    // 		logged.ws.send(JSON.stringify({type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)}));
                    // 	}
                    // }
                    // await resendLeaderboard(this.school, course);
                }
                else if (packet.type == "getVerifications") {
                    sendVerifications(packet.course, ws);
                }
                else if (packet.type == "verify") {
                    const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
                    if (!verification)
                        return;
                    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
                    verification.verified = true;
                    if (logged) {
                        logged.ws.emit("message", JSON.stringify(verification.packet));
                    }
                }
                else if (packet.type == "dismiss") {
                    const verification = awaitingVerification[packet.course].find(v => v.uuid == packet.uuid);
                    if (!verification)
                        return;
                    const logged = loggedIn.find(l => l.clientType == "student" && l.uuid == packet.uuid);
                    if (logged) {
                        logged.ws.send(JSON.stringify({ type: "dismiss" }));
                    }
                    awaitingVerification[packet.course] = awaitingVerification[packet.course].filter(v => v.uuid != packet.uuid);
                    broadcastVerifications(this.school, packet.course);
                }
                else if (packet.type == "changePassword") {
                    if (this.isAdmin) {
                        this.school.adminPassword = packet.password;
                        await this.school.save();
                    }
                    else {
                        this.thisTeacher.password = packet.password;
                        await this.thisTeacher.save();
                    }
                }
            }
            if (this.clientType == "student") {
                if (packet.type == "room") {
                    if (!packet.uuid) {
                        this.ws.send(JSON.stringify({ type: "room", success: false, error: "Missing uuid" }));
                        return;
                    }
                    const r = await this.school.$get("rooms");
                    const _room = r.find(r => r.uuid == packet.uuid) || null;
                    if (!_room) {
                        this.ws.send(JSON.stringify({ type: "room", success: false, error: "Room not found" }));
                        return;
                    }
                    this.room = _room;
                    this.ws.send(JSON.stringify({ type: "room", success: true }));
                    return;
                }
                else if (packet.type == "login") {
                    if (!packet.name) {
                        this.ws.send(JSON.stringify({ type: "login", success: false, error: "Missing name" }));
                        return;
                    }
                    if (!this.room) {
                        this.ws.send(JSON.stringify({ type: "login", success: false, error: "You have not joined a room yet" }));
                        return;
                    }
                    this.room.reload();
                    const course = await this.room.$get("course");
                    if (course == null) {
                        this.ws.send(JSON.stringify({ type: "login", success: false, error: "Teacher has not set a course yet" }));
                        return;
                    }
                    const s = await course.$get("students");
                    let stud = s.find(s => s.name == capitalizeWords(packet.name.split(" ")).join(" ")) || null;
                    if (!stud) {
                        stud = await course.$create("student", { name: capitalizeWords(packet.name.split(" ")).join(" ") });
                    }
                    let student = stud;
                    console.log("STUDENT LOGS IN WITH NAME: " + student.name);
                    console.log("STUDENT OBJECT IS: " + JSON.stringify(student.toJSON()));
                    this.name = student.name;
                    this.uuid = student.uuid;
                    this.idle = false;
                    this.ws.send(JSON.stringify({ type: "login", success: true, student }));
                    // const levelpath = studentLevelpath(student, this.school.isDemo ? demoTasks : tasks);
                    // this.ws.send(JSON.stringify({type: "levelpath", ...levelpath}));
                    this.ws.send(JSON.stringify({ type: "sections", ...studentSections(student, this.school.isDemo ? demoTasks : tasks) }));
                    this.ws.send(JSON.stringify({ type: "leaderboard", leaderboard: await courseLeaderboardJSON(course) }));
                    await resendLeaderboard(this.school, course);
                    return;
                }
                if (!this.name) {
                    this.ws.send(JSON.stringify({ type: "conversationError", success: false, error: "You have not logged in yet" }));
                    this.ws.close();
                    return;
                }
                if (packet.type == "info") {
                    this.ws.send(JSON.stringify({ type: "info", name: tasks[packet.level].name, desc: tasks[packet.level].desc }));
                }
                else if (packet.type == "task") {
                    const course = await this.room.$get("course");
                    if (course == null)
                        return;
                    if (!course.isRunning) {
                        this.ws.send(JSON.stringify({ type: "task", success: false, error: "Course is not running" }));
                        return;
                    }
                    const s = await course.$get("students");
                    const student = s.find(s => s.name == capitalizeWords(this.name.split(" ")).join(" ")) || null;
                    if (!student)
                        return;
                    if (!(packet.section <= student.section)) {
                        this.ws.send(JSON.stringify({ type: "task", success: false, error: "You have not completed the previous section yet" }));
                        this.ws.send(JSON.stringify({ type: "sections", ...studentSections(student, this.school.isDemo ? demoTasks : tasks) }));
                        return;
                    }
                    if (student.section == packet.section) {
                        if (!(packet.level <= student.level)) {
                            this.ws.send(JSON.stringify({ type: "task", success: false, error: "You have not completed the previous level yet" }));
                            this.ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks, packet.section) }));
                            return;
                        }
                    }
                    if (!tasks[packet.section].tasks[packet.level]) {
                        this.ws.send(JSON.stringify({ type: "task", success: false, error: "Level not found" }));
                        this.ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks, packet.section) }));
                        return;
                    }
                    this.ws.send(JSON.stringify({ type: "task", success: true, task: tasks[packet.section].tasks[packet.level] }));
                }
                else if (packet.type == "done") {
                    const course = await this.room.$get("course");
                    if (course == null)
                        return;
                    if (!course.isRunning) {
                        this.ws.send(JSON.stringify({ type: "done", success: false, error: "Course is not running" }));
                        return;
                    }
                    const s = await course.$get("students");
                    console.log("Da name is", this.name);
                    const student = s.find(s => s.name == capitalizeWords(this.name.split(" ")).join(" ")) || null;
                    if (!student)
                        return;
                    if (!(packet.section <= student.section)) {
                        this.ws.send(JSON.stringify({ type: "done", success: false, error: "You have not completed the previous section yet" }));
                        this.ws.send(JSON.stringify({ type: "sections", ...studentSections(student, this.school.isDemo ? demoTasks : tasks) }));
                        return;
                    }
                    if (packet.level != student.level) {
                        ws.send(JSON.stringify({ type: "done", success: true }));
                        return;
                    }
                    if (!tasks[packet.section].tasks[packet.level]) {
                        this.ws.send(JSON.stringify({ type: "done", success: false, error: "Level not found" }));
                        this.ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks, packet.section) }));
                        return;
                    }
                    let canContinue = true;
                    if (TASK_VERIFICATION_NEEDED) {
                        if (!awaitingVerification[course.uuid]?.find(v => v.uuid == this.uuid)?.verified)
                            canContinue = false;
                        const task = tasks[packet.section].tasks[packet.level];
                        if (task.type == "reading")
                            canContinue = true;
                        if ("verification" in task && task.verification.type == "notneeded")
                            canContinue = true;
                    }
                    if (canContinue) {
                        student.level++;
                        student.totalLevels++;
                        if (packet.answeredqs)
                            student.answeredqs += packet.answeredqs;
                        if (packet.correctqs)
                            student.correctqs += packet.correctqs;
                        student.achievementdata.completedLevels++;
                        if (student.achievementdata.completedLevels == 5) {
                            if (!student.achievements.includes("fast")) {
                                student.achievements.push("fast");
                            }
                        }
                        // If the student has completed all the levels in the section, move them to the next section
                        console.log("Student level", student.level);
                        console.log("Tasks length", tasks[packet.section].tasks.length);
                        if (student.level >= tasks[packet.section].tasks.length) {
                            console.log("Moving to next section");
                            student.section++;
                            student.level = 0;
                            await student.save();
                            this.ws.send(JSON.stringify({ type: "sections", ...studentSections(student, this.school.isDemo ? demoTasks : tasks) }));
                            this.ws.send(JSON.stringify({ type: "sectionDone" }));
                        }
                        await student.save();
                        const leaderboard = await courseLeaderboardJSON(course);
                        if (leaderboard[0] == leaderboard.find(u => u.name == capitalizeWords(this.name.split(" ")).join(" "))) {
                            if (!student.achievements.includes("first")) {
                                student.achievements.push("first");
                                await student.save();
                            }
                        }
                        // for(const logged of loggedIn) {
                        // 	if(logged.clientType == "student") {
                        // 		if(!logged.room) continue;
                        // 		const c = await logged.room.getCourse();
                        // 		if(!c) continue;
                        // 		if(!c.uuid == c.uuid) continue;
                        // 		logged.ws.send(JSON.stringify({type: "leaderboard", ...await courseLeaderboardJSON(await student.getCourse())}));
                        // 	} else if(logged.clientType == "teacher") {
                        // 		if(logged.school.uuid != this.school.uuid) continue;
                        // 		logged.ws.send(JSON.stringify({type: "leaderboard", course, ...await courseLeaderboardJSON(await student.getCourse())}));
                        // 	}
                        // }
                        // broadcastStudentsInCourse(course, {type: "leaderboard", leaderboard: await courseLeaderboardJSON(course)});
                        // broadcastTeachers(this.school, {type: "leaderboard", course, leaderboard: await courseLeaderboardJSON(course)});
                        await resendLeaderboard(this.school, course);
                        ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks, packet.section) }));
                        ws.send(JSON.stringify({ type: "done", success: true }));
                        if (awaitingVerification[course.uuid]?.find(v => v.uuid == this.uuid)?.verified) {
                            awaitingVerification[course.uuid] = awaitingVerification[course.uuid].filter(v => v.uuid != this.uuid);
                            broadcastVerifications(this.school, course.uuid);
                        }
                    }
                    else {
                        if (!awaitingVerification[course.uuid])
                            awaitingVerification[course.uuid] = [];
                        if (awaitingVerification[course.uuid].find(v => v.uuid == this.uuid)) {
                            this.ws.send(JSON.stringify({ type: "done", success: false, error: "You have already submitted a task for verification" }));
                            return;
                        }
                        awaitingVerification[course.uuid].push({ uuid: this.uuid, packet, verified: false });
                        broadcastVerifications(this.school, course.uuid);
                    }
                }
                else if (packet.type == "idleStateChange") {
                    if (packet.idle === undefined) {
                        this.ws.send(JSON.stringify({ type: "idleStateChange", success: false, error: "Missing idle state" }));
                        return;
                    }
                    this.idle = packet.idle;
                    console.log(this.idle);
                    const course = await this.room.$get("course");
                    console.log(course);
                    if (course == null)
                        return;
                    console.log("A");
                    await resendLeaderboard(this.school, course);
                }
                else if (packet.type == "getSection") {
                    console.log(packet);
                    if (packet.section == undefined) {
                        this.ws.send(JSON.stringify({ type: "getSection", success: false, error: "Missing section id" }));
                        return;
                    }
                    const course = await this.room.$get("course");
                    if (course == null)
                        return;
                    const s = await course.$get("students");
                    const student = s.find(s => s.name == capitalizeWords(this.name.split(" ")).join(" ")) || null;
                    if (!student)
                        return;
                    if (!(packet.section <= student.section)) {
                        this.ws.send(JSON.stringify({ type: "getSection", success: false, error: "You have not completed the previous section yet" }));
                        this.ws.send(JSON.stringify({ type: "sections", ...studentSections(student, this.school.isDemo ? demoTasks : tasks) }));
                        return;
                    }
                    this.ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, this.school.isDemo ? demoTasks : tasks, packet.section) }));
                }
                else if (packet.type == "startGroup") {
                    const course = await this.room.$get("course");
                    if (course == null)
                        return;
                    const group = await course.$create("codegroup", {});
                    if (!group)
                        return;
                    peopleInGroup[group.uuid] = [this];
                    this.ws.send(JSON.stringify({ type: "startGroup", success: true, group }));
                }
                else if (packet.type == "joinGroup") {
                    const course = await this.room.$get("course");
                    if (course == null)
                        return;
                    const group = await CodeGroup.findOne({ where: { code: packet.group, courseUuid: course.uuid } });
                    if (!group) {
                        this.ws.send(JSON.stringify({ type: "joinGroup", success: false, error: "Group not found" }));
                        return;
                    }
                    const people = peopleInGroup[group.uuid];
                    people.push(this);
                    this.ws.send(JSON.stringify({ type: "joinGroup", success: true, group }));
                    if (!peopleInGroupRequestingSync[packet.group])
                        peopleInGroupRequestingSync[packet.group] = [this];
                    else
                        peopleInGroupRequestingSync[packet.group].push(this);
                    let randomPerson;
                    let att = 30;
                    while (!randomPerson || randomPerson == this) {
                        randomPerson = people[Math.floor(Math.random() * people.length)];
                        if (att-- == 0)
                            break;
                    }
                    randomPerson.ws.send(JSON.stringify({ type: "syncGroup" }));
                }
                else if (packet.type == "groupCode") {
                    // Response to syncGroup request
                    const peopleRequesting = peopleInGroupRequestingSync[packet.group];
                    if (!peopleRequesting)
                        return;
                    for (const person of peopleRequesting) {
                        person.ws.send(JSON.stringify({ type: "groupCode", code: packet.code }));
                        peopleInGroupRequestingSync[packet.group].splice(peopleInGroupRequestingSync[packet.group].findIndex(p => p == person), 1);
                    }
                    if (peopleRequesting.length == 0) {
                        delete peopleInGroupRequestingSync[packet.group];
                    }
                }
                else if (packet.type == "leaveGroup") {
                    peopleInGroup[packet.group].splice(peopleInGroup[packet.group].findIndex(p => p == this), 1);
                    if (peopleInGroup[packet.group].length == 0) {
                        delete peopleInGroup[packet.group];
                        const group = await CodeGroup.findOne({ where: { uuid: packet.group } });
                        if (group)
                            await group.destroy();
                    }
                    this.ws.send(JSON.stringify({ type: "leaveGroup", success: true }));
                }
                else if (packet.type == "syncGroup") {
                    const people = peopleInGroup[packet.group];
                    if (!people)
                        return;
                    if (!peopleInGroupRequestingSync[packet.group])
                        peopleInGroupRequestingSync[packet.group] = [this];
                    else
                        peopleInGroupRequestingSync[packet.group].push(this);
                    let randomPerson;
                    let att = 30;
                    while (!randomPerson || randomPerson == this) {
                        randomPerson = people[Math.floor(Math.random() * people.length)];
                        if (att-- == 0)
                            break;
                    }
                    randomPerson.ws.send(JSON.stringify({ type: "syncGroup" }));
                }
                else if (packet.type == "groupAction") {
                    const people = peopleInGroup[packet.group];
                    if (!people)
                        return;
                    for (const person of people) {
                        if (person == this)
                            continue;
                        person.ws.send(JSON.stringify({ type: "groupAction", action: packet.action }));
                    }
                }
            }
        });
        this.ws.on("close", async () => {
            loggedIn.splice(loggedIn.indexOf(this), 1);
            if (this.clientType == "student") {
                if (!this.room)
                    return;
                if (!this.uuid)
                    return;
                const course = await this.room.$get("course");
                if (course == null)
                    return;
                await resendLeaderboard(this.school, course);
                if (awaitingVerification[course.uuid] && awaitingVerification[course.uuid].find(v => v.uuid == this.uuid)) {
                    awaitingVerification[course.uuid].splice(awaitingVerification[course.uuid].findIndex(v => v.uuid == this.uuid), 1);
                    broadcastVerifications(this.school, course.uuid);
                }
                // Code groups
                for (const group in peopleInGroup) {
                    if (peopleInGroup[group].find(p => p == this)) {
                        peopleInGroup[group].splice(peopleInGroup[group].findIndex(p => p == this), 1);
                    }
                }
            }
        });
    }
}
