import { v4 as uuid } from "uuid";
import { loggedIn } from "./main.js";
import { hasJsonStructure, courseLeaderboardJSON } from "./utils.js";
import { InPacket } from "./types/Packet.js";
import { handleHiPacket } from "./packets/HiPacket.js";
import { handlePongPacket } from "./packets/PongPacket.js";
import { handleAddCoursePacket } from "./packets/admin/course/AddCoursePacket.js";
import { handleDeleteCoursePacket } from "./packets/admin/course/DeleteCoursePacket.js";
import { handleRenameCoursePacket } from "./packets/admin/course/RenameCoursePacket.js";
import { handleAddRoomPacket } from "./packets/admin/room/AddRoomPacket.js";
import { handleDeleteRoomPacket } from "./packets/admin/room/DeleteRoomPacket.js";
import { handleAddTeacherPacket } from "./packets/admin/teacher/AddTeacherPacket.js";
import { handleChangeTeacherPasswordPacket } from "./packets/admin/teacher/ChangeTeacherPassword.js";
import { handleDeleteTeacherPacket } from "./packets/admin/teacher/DeleteTeacherPacket.js";
import { handleAllowRegisterPacket } from "./packets/teacher/AllowRegisterPacket.js";
import { handleChangePasswordPacket } from "./packets/teacher/ChangePasswordPacket.js";
import { handleDeletePacket } from "./packets/teacher/DeletePacket.js";
import { handleDismissPacket } from "./packets/teacher/DismissPacket.js";
import { handleGetCourseInfoPacket } from "./packets/teacher/GetCourseInfoPacket.js";
import { handleGetVerificationsPacket } from "./packets/teacher/GetVerificationsPacket.js";
import { handleKickPacket } from "./packets/teacher/KickPacket.js";
import { handleSetActiveCoursePacket } from "./packets/teacher/SetActiveCoursePacket.js";
import { handleStartCoursePacket } from "./packets/teacher/StartCoursePacket.js";
import { handleStopCoursePacket } from "./packets/teacher/StopCoursePacket.js";
import { handleVerifyPacket } from "./packets/teacher/VerifyPacket.js";
import { handleDonePacket } from "./packets/student/DonePacket.js";
import { handleGetSectionPacket } from "./packets/student/GetSectionPacket.js";
import { handleIdleStateChangePacket } from "./packets/student/IdleStateChangePacket.js";
import { handleInfoPacket } from "./packets/student/InfoPacket.js";
import { handleLoginPacket } from "./packets/student/LoginPacket.js";
import { handleRoomPacket } from "./packets/student/RoomPacket.js";
import { handleTaskPacket } from "./packets/student/TaskPacket.js";
export const TASK_VERIFICATION_NEEDED = true;
export const awaitingVerification = {};
export const peopleInGroup = {};
export const peopleInGroupRequestingSync = {};
export function broadcastAdmins(school, packet, exceptCID) {
    for (const connection of loggedIn) {
        if (exceptCID && connection.cid == exceptCID)
            continue;
        if (connection.isAdmin && connection.school.uuid == school.uuid) {
            connection.ws.send(JSON.stringify(packet));
        }
    }
}
export function broadcastTeachers(school, packet, exceptCID) {
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
export async function broadcastStudentsInCourse(course, packet) {
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
export async function resendLeaderboard(school, course) {
    const leaderboard = await courseLeaderboardJSON(course);
    await broadcastStudentsInCourse(course, { type: "leaderboard", leaderboard });
    broadcastTeachers(school, { type: "leaderboard", course, leaderboard });
}
export function sendVerifications(courseUUID, ws) {
    ws.send(JSON.stringify(getVerifications(courseUUID)));
}
export function getVerifications(courseUUID) {
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
export function broadcastVerifications(school, courseUUID, exceptCID) {
    broadcastTeachers(school, getVerifications(courseUUID), exceptCID);
}
const globalPackets = {
    hi: handleHiPacket,
    pong: handlePongPacket
};
const adminPackets = {
    // Course
    addCourse: handleAddCoursePacket,
    deleteCourse: handleDeleteCoursePacket,
    renameCourse: handleRenameCoursePacket,
    // Room
    addRoom: handleAddRoomPacket,
    deleteRoom: handleDeleteRoomPacket,
    // Teacher
    addTeacher: handleAddTeacherPacket,
    deleteTeacher: handleDeleteTeacherPacket,
    changeTeacherPassword: handleChangeTeacherPasswordPacket
};
const teacherPackets = {
    // Course
    allowRegister: handleAllowRegisterPacket,
    getCourseInfo: handleGetCourseInfoPacket,
    getVerifications: handleGetVerificationsPacket,
    setActiveCourse: handleSetActiveCoursePacket,
    startCourse: handleStartCoursePacket,
    stopCourse: handleStopCoursePacket,
    // Student-management
    delete: handleDeletePacket,
    kick: handleKickPacket,
    // Verification-management
    dismiss: handleDismissPacket,
    verify: handleVerifyPacket,
    // Other
    changePassword: handleChangePasswordPacket
};
const studentPackets = {
    room: handleRoomPacket,
    login: handleLoginPacket,
    idleStateChange: handleIdleStateChangePacket,
    getSection: handleGetSectionPacket,
    info: handleInfoPacket,
    task: handleTaskPacket,
    done: handleDonePacket
};
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
            if (packet.type in globalPackets) {
                // @ts-ignore
                globalPackets[packet.type](packet, this, this.ws);
                return;
            }
            if (this.clientType == "") {
                this.ws.send(JSON.stringify({ type: "conversationError", error: "You aren't authenticated yet" }));
                this.ws.close();
                return;
            }
            if (this.clientType == "teacher" && this.isAdmin && packet.type in adminPackets) {
                // @ts-ignore
                adminPackets[packet.type](packet, this, this.ws);
                return;
            }
            if (this.clientType == "teacher" && packet.type in teacherPackets) {
                // @ts-ignore
                teacherPackets[packet.type](packet, this, this.ws);
                return;
            }
            if (this.clientType == "student" && packet.type in studentPackets) {
                if (packet.type != "login" && packet.type != "room" && !this.name) {
                    this.ws.send(JSON.stringify({ type: "conversationError", success: false, error: "You have not logged in yet" }));
                    this.ws.close();
                    return;
                }
                // @ts-ignore
                studentPackets[packet.type](packet, this, this.ws);
                return;
            }
            // If we get here, the packet is not handled
            this.ws.send(JSON.stringify({ type: "conversationError", error: "Unable to handle packet" }));
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
