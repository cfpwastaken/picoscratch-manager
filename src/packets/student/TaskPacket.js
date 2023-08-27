import z from "zod";
import { capitalizeWords, studentLevelpath, studentSections } from "../../utils.js";
import { demoTasks, tasks } from "../../main.js";
export const InTaskPacket = z.object({
    type: z.literal("task"),
    level: z.number(),
    section: z.number()
});
export async function handleTaskPacket(packet, con, ws) {
    const course = await con.room.$get("course");
    if (course == null)
        return;
    if (!course.isRunning) {
        ws.send(JSON.stringify({ type: "task", success: false, error: "Course is not running" }));
        return;
    }
    const s = await course.$get("students");
    const student = s.find(s => s.name == capitalizeWords(con.name.split(" ")).join(" ")) || null;
    if (!student)
        return;
    if (!(packet.section <= student.section)) {
        ws.send(JSON.stringify({ type: "task", success: false, error: "You have not completed the previous section yet" }));
        ws.send(JSON.stringify({ type: "sections", ...studentSections(student, con.school.isDemo ? demoTasks : tasks) }));
        return;
    }
    if (student.section == packet.section) {
        if (!(packet.level <= student.level)) {
            ws.send(JSON.stringify({ type: "task", success: false, error: "You have not completed the previous level yet" }));
            ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, con.school.isDemo ? demoTasks : tasks, packet.section) }));
            return;
        }
    }
    if (!tasks[packet.section].tasks[packet.level]) {
        ws.send(JSON.stringify({ type: "task", success: false, error: "Level not found" }));
        ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, con.school.isDemo ? demoTasks : tasks, packet.section) }));
        return;
    }
    // Max level check
    if (course.maxSection != -1) {
        if (packet.section >= course.maxSection && packet.level > course.maxLevel) {
            ws.send(JSON.stringify({ type: "task", success: false, error: "Max level reached" }));
            return;
        }
    }
    ws.send(JSON.stringify({ type: "task", success: true, task: tasks[packet.section].tasks[packet.level] }));
}
