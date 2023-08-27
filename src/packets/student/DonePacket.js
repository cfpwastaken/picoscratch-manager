import z from "zod";
import { TASK_VERIFICATION_NEEDED, awaitingVerification, broadcastVerifications, resendLeaderboard } from "../../connection.js";
import { capitalizeWords, courseLeaderboardJSON, studentLevelpath, studentSections } from "../../utils.js";
import { demoTasks, tasks } from "../../main.js";
export const InDonePacket = z.object({
    type: z.literal("done"),
    level: z.number(),
    answeredqs: z.number().optional(),
    correctqs: z.number().optional(),
    section: z.number()
});
export async function handleDonePacket(packet, con, ws) {
    const course = await con.room.$get("course");
    if (course == null)
        return;
    if (!course.isRunning) {
        ws.send(JSON.stringify({ type: "done", success: false, error: "Course is not running" }));
        return;
    }
    const s = await course.$get("students");
    console.log("Da name is", con.name);
    const student = s.find(s => s.name == capitalizeWords(con.name.split(" ")).join(" ")) || null;
    if (!student)
        return;
    if (!(packet.section <= student.section)) {
        ws.send(JSON.stringify({ type: "done", success: false, error: "You have not completed the previous section yet" }));
        ws.send(JSON.stringify({ type: "sections", ...studentSections(student, con.school.isDemo ? demoTasks : tasks) }));
        return;
    }
    if (packet.level != student.level) {
        ws.send(JSON.stringify({ type: "done", success: true }));
        return;
    }
    if (!tasks[packet.section].tasks[packet.level]) {
        ws.send(JSON.stringify({ type: "done", success: false, error: "Level not found" }));
        ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, con.school.isDemo ? demoTasks : tasks, packet.section) }));
        return;
    }
    let canContinue = true;
    if (TASK_VERIFICATION_NEEDED) {
        if (!awaitingVerification[course.uuid]?.find(v => v.uuid == con.uuid)?.verified)
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
            ws.send(JSON.stringify({ type: "sections", ...studentSections(student, con.school.isDemo ? demoTasks : tasks) }));
            ws.send(JSON.stringify({ type: "sectionDone" }));
        }
        await student.save();
        const leaderboard = await courseLeaderboardJSON(course);
        if (leaderboard[0] == leaderboard.find(u => u.name == capitalizeWords(con.name.split(" ")).join(" "))) {
            if (!student.achievements.includes("first")) {
                student.achievements.push("first");
                await student.save();
            }
        }
        await resendLeaderboard(con.school, course);
        ws.send(JSON.stringify({ type: "levelpath", ...studentLevelpath(student, con.school.isDemo ? demoTasks : tasks, packet.section) }));
        ws.send(JSON.stringify({ type: "done", success: true }));
        if (awaitingVerification[course.uuid]?.find(v => v.uuid == con.uuid)?.verified) {
            awaitingVerification[course.uuid] = awaitingVerification[course.uuid].filter(v => v.uuid != con.uuid);
            broadcastVerifications(con.school, course.uuid);
        }
    }
    else {
        if (!awaitingVerification[course.uuid])
            awaitingVerification[course.uuid] = [];
        if (awaitingVerification[course.uuid].find(v => v.uuid == con.uuid)) {
            ws.send(JSON.stringify({ type: "done", success: false, error: "You have already submitted a task for verification" }));
            return;
        }
        awaitingVerification[course.uuid].push({ uuid: con.uuid, packet, verified: false });
        broadcastVerifications(con.school, course.uuid);
    }
}
