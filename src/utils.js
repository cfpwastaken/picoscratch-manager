import { compare } from "bcrypt";
import { loggedIn } from "./main.js";
import Course from "./model/course.js";
import Room from "./model/room.js";
import School from "./model/school.js";
import Teacher from "./model/teacher.js";
export function hasJsonStructure(str) {
    if (typeof str !== "string")
        return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === "[object Object]"
            || type === "[object Array]";
    }
    catch (err) {
        return false;
    }
}
export const validClientTypes = ["teacher", "student"];
export function studentLevelpath(student, tasks) {
    const infos = tasks.map((task, index) => {
        return {
            name: task.name,
            desc: task.desc
        };
    }).filter((_, index) => index < (student.level + 1)).filter((_, index) => index != 0);
    return { done: student.level - 1, locked: (tasks.length - 1 - student.level), isDone: student.level == tasks.length, infos };
}
export function isWhatPercentOf(numA, numB) {
    return (numA / numB) * 100;
}
export function capitalizeWords(arr) {
    return arr.map(element => {
        return element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
    });
}
export async function courseLeaderboardJSON(course) {
    const students = await course.$get("students");
    const leaderboard = students.map(s => {
        const percent = isWhatPercentOf(s.correctqs, s.answeredqs);
        return {
            name: s.name,
            level: s.level,
            answeredqs: s.answeredqs,
            correctqs: s.correctqs,
            percentage: isNaN(percent) ? 100 : Math.floor(percent),
            xp: ((s.level - 1) * 1357) + (s.correctqs * 136),
            achievements: s.achievements,
            achievementdata: s.achievementdata,
            uuid: s.uuid,
            status: loggedIn.find(l => l.uuid == s.uuid) ? (loggedIn.find(l => {
                return l.uuid ? l.uuid == s.uuid : false;
            })?.idle ? "idle" : "online") : "offline"
        };
    });
    leaderboard.sort((a, b) => b.xp - a.xp);
    return leaderboard;
}
export async function authenticate(uuid, username, password) {
    const s = await School.findOne({ where: { uuid: uuid }, include: [Teacher, Course, Room] });
    if (!s)
        return { error: "School not found", admin: false };
    if (username.toLowerCase() == "admin") {
        if (await compare(password, s.adminPassword)) {
            return { success: true, admin: true };
        }
        return { error: "Wrong password", admin: false };
    }
    const ts = await s.$get("teachers");
    const t = ts.find(t => t.name.toLowerCase() == username.toLowerCase());
    if (!t)
        return { error: "Invalid username", admin: false };
    if (!(await compare(password, t.password)))
        return { error: "Wrong password", admin: false };
    return { success: true, admin: false };
}
