import { compare } from "bcrypt";
import { codingTasks, demoTasks, loggedIn } from "./main.js";
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
export function studentSections(student, tasks) {
    return {
        sections: tasks.map((section) => {
            return {
                name: section.name,
                desc: section.desc,
                img: section.img
            };
        }).slice(0, student.section + 1),
        total: tasks.length
    };
}
export function studentLevelpath(student, tasks, section) {
    const infos = tasks[section].tasks.map((task, index) => {
        return {
            name: task.name,
            desc: task.desc
        };
    }).filter((_, index) => {
        if (student.section != section)
            return true;
        if (index < (student.level + 1))
            return true;
    });
    return { done: student.section != section ? tasks[section].tasks.length : student.level, locked: student.section != section ? 0 : (tasks[section].tasks.length - 1 - student.level), isDone: student.section != section ? true : student.level == tasks[section].tasks.length, infos };
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
            level: s.totalLevels,
            answeredqs: s.answeredqs,
            correctqs: s.correctqs,
            percentage: isNaN(percent) ? 100 : Math.floor(percent),
            xp: (s.totalLevels * 1357) + (s.correctqs * 136) + (s.section * 1000),
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
export async function getTasksForCourse(courseUUID) {
    const c = await Course.findOne({ where: { uuid: courseUUID } });
    if (!c)
        throw new Error("Course not found");
    const school = await c.$get("school");
    if (!school)
        throw new Error("School not found");
    if (school.isDemo) {
        return demoTasks;
    }
    return codingTasks[c.courseType];
}
