import { z } from "zod";
export const InGenericHiPacket = z.object({
    type: z.literal("hi"),
    schoolCode: z.string(),
    clientType: z.enum(["teacher", "student"]),
});
export const InTeacherHiPacket = InGenericHiPacket.extend({
    clientType: z.literal("teacher"),
    username: z.string(),
    password: z.string(),
});
export const InStudentHiPacket = InGenericHiPacket.extend({
    clientType: z.literal("student"),
});
export const InHiPacket = z.union([InTeacherHiPacket, InStudentHiPacket]);
export const InPongPacket = z.object({
    type: z.literal("pong")
});
// Admin Packets
export const InAddTeacherPacket = z.object({
    type: z.literal("addTeacher"),
    username: z.string(),
    password: z.string(),
});
export const InDeleteTeacherPacket = z.object({
    type: z.literal("deleteTeacher"),
    uuid: z.string()
});
export const InAddCoursePacket = z.object({
    type: z.literal("addCourse"),
    name: z.string()
});
export const InDeleteCoursePacket = z.object({
    type: z.literal("deleteCourse"),
    uuid: z.string()
});
export const InAddRoomPacket = z.object({
    type: z.literal("addRoom"),
    name: z.string()
});
export const InDeleteRoomPacket = z.object({
    type: z.literal("deleteRoom"),
    uuid: z.string()
});
export const InSetLangPacket = z.object({
    type: z.literal("setLang"),
    lang: z.enum(["en", "de"])
});
export const InSetChannelPacket = z.object({
    type: z.literal("setChannel"),
    channel: z.enum(["latest", "beta", "alpha"])
});
export const InChangeTeacherPasswordPacket = z.object({
    type: z.literal("changeTeacherPassword"),
    uuid: z.string(),
    password: z.string()
});
export const InRenameCoursePacket = z.object({
    type: z.literal("renameCourse"),
    uuid: z.string(),
    name: z.string()
});
export const InAdminPackets = z.union([
    InAddTeacherPacket,
    InDeleteTeacherPacket,
    InAddCoursePacket,
    InDeleteCoursePacket,
    InAddRoomPacket,
    InDeleteRoomPacket,
    InSetLangPacket,
    InSetChannelPacket,
    InChangeTeacherPasswordPacket,
    InRenameCoursePacket
]);
export const InSetActiveCoursePacket = z.object({
    type: z.literal("setActiveCourse"),
    uuid: z.string(),
    course: z.string() // uuid
});
export const InStartCoursePacket = z.object({
    type: z.literal("startCourse"),
    uuid: z.string()
});
export const InStopCoursePacket = z.object({
    type: z.literal("stopCourse"),
    uuid: z.string()
});
export const InGetCourseInfoPacket = z.object({
    type: z.literal("getCourseInfo"),
    uuid: z.string()
});
export const InKickPacket = z.object({
    type: z.literal("kick"),
    uuid: z.string()
});
export const InDeletePacket = z.object({
    type: z.literal("delete"),
    uuid: z.string(),
    courseUUID: z.string()
});
export const InSetLevelPacket = z.object({
    type: z.literal("setLevel"),
    uuid: z.string(),
    courseUUID: z.string(),
    level: z.number()
});
export const InGetVerificationsPacket = z.object({
    type: z.literal("getVerifications"),
    course: z.string()
});
export const InVerifyPacket = z.object({
    type: z.literal("verify"),
    uuid: z.string(),
    course: z.string()
});
export const InDismissPacket = z.object({
    type: z.literal("dismiss"),
    uuid: z.string(),
    course: z.string()
});
export const InChangePasswordPacket = z.object({
    type: z.literal("changePassword"),
    password: z.string()
});
export const InAllowRegisterPacket = z.object({
    type: z.literal("allowRegister"),
    course: z.string(),
    allow: z.boolean()
});
export const InGetTasksPacket = z.object({
    type: z.literal("getTasks")
});
export const InMaxLevelPacket = z.object({
    type: z.literal("maxLevel"),
    course: z.string(),
    maxSection: z.number(),
    maxLevel: z.number()
});
export const InTeacherPackets = z.union([
    InSetActiveCoursePacket,
    InStartCoursePacket,
    InStopCoursePacket,
    InGetCourseInfoPacket,
    InKickPacket,
    InDeletePacket,
    InSetLevelPacket,
    InGetVerificationsPacket,
    InVerifyPacket,
    InDismissPacket,
    InChangePasswordPacket,
    InAllowRegisterPacket,
    InGetTasksPacket,
    InMaxLevelPacket
]);
export const InRoomPacket = z.object({
    type: z.literal("room"),
    uuid: z.string()
});
export const InLoginPacket = z.object({
    type: z.literal("login"),
    name: z.string()
});
export const InInfoPacket = z.object({
    type: z.literal("info"),
    level: z.number()
});
export const InTaskPacket = z.object({
    type: z.literal("task"),
    level: z.number(),
    section: z.number()
});
export const InDonePacket = z.object({
    type: z.literal("done"),
    level: z.number(),
    answeredqs: z.number().optional(),
    correctqs: z.number().optional(),
    section: z.number()
});
export const InIdleStateChangePacket = z.object({
    type: z.literal("idleStateChange"),
    idle: z.boolean()
});
export const InGetSectionPacket = z.object({
    type: z.literal("getSection"),
    section: z.number()
});
export const InStartGroupPacket = z.object({
    type: z.literal("startGroup")
});
export const GroupCode = z.string().min(6).max(6).regex(/^[A-Z0-9]+$/);
export const InJoinGroupPacket = z.object({
    type: z.literal("joinGroup"),
    group: GroupCode
});
export const InGroupCodePacket = z.object({
    type: z.literal("groupCode"),
    group: GroupCode,
    code: z.string()
});
export const InLeaveGroupPacket = z.object({
    type: z.literal("leaveGroup"),
    group: GroupCode
});
export const InSyncGroupPacket = z.object({
    type: z.literal("syncGroup"),
    group: GroupCode
});
export const InGroupActionPacket = z.object({
    type: z.literal("groupAction"),
    group: z.string(),
    action: z.any()
});
export const InStudentPackets = z.union([
    InRoomPacket,
    InLoginPacket,
    InInfoPacket,
    InTaskPacket,
    InDonePacket,
    InIdleStateChangePacket,
    InGetSectionPacket,
    InStartGroupPacket,
    InJoinGroupPacket,
    InGroupCodePacket,
    InLeaveGroupPacket,
    InSyncGroupPacket,
    InGroupActionPacket
]);
export const InPacket = z.union([
    InHiPacket,
    InPongPacket,
    InAdminPackets,
    InTeacherPackets,
    InStudentPackets
]);
export const Packet = InPacket;
