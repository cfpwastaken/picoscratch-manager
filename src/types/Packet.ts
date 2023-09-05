import { z } from "zod";
import { InTeacherHiPacket, InStudentHiPacket } from "../packets/HiPacket.js";
import { InPongPacket } from "../packets/PongPacket.js";
import { InAddCoursePacket } from "../packets/admin/course/AddCoursePacket.js";
import { InDeleteCoursePacket } from "../packets/admin/course/DeleteCoursePacket.js";
import { InRenameCoursePacket } from "../packets/admin/course/RenameCoursePacket.js";
import { InAddRoomPacket } from "../packets/admin/room/AddRoomPacket.js";
import { InDeleteRoomPacket } from "../packets/admin/room/DeleteRoomPacket.js";
import { InAddTeacherPacket } from "../packets/admin/teacher/AddTeacherPacket.js";
import { InChangeTeacherPasswordPacket } from "../packets/admin/teacher/ChangeTeacherPassword.js";
import { InDeleteTeacherPacket } from "../packets/admin/teacher/DeleteTeacherPacket.js";
import { InDonePacket } from "../packets/student/DonePacket.js";
import { InGetSectionPacket } from "../packets/student/GetSectionPacket.js";
import { InIdleStateChangePacket } from "../packets/student/IdleStateChangePacket.js";
import { InInfoPacket } from "../packets/student/InfoPacket.js";
import { InLoginPacket } from "../packets/student/LoginPacket.js";
import { InRoomPacket } from "../packets/student/RoomPacket.js";
import { InTaskPacket } from "../packets/student/TaskPacket.js";
import { InAllowRegisterPacket } from "../packets/teacher/AllowRegisterPacket.js";
import { InChangePasswordPacket } from "../packets/teacher/ChangePasswordPacket.js";
import { InDeletePacket } from "../packets/teacher/DeletePacket.js";
import { InDismissPacket } from "../packets/teacher/DismissPacket.js";
import { InGetCourseInfoPacket } from "../packets/teacher/GetCourseInfoPacket.js";
import { InGetTasksPacket } from "../packets/teacher/GetTasksPacket.js";
import { InGetVerificationsPacket } from "../packets/teacher/GetVerificationsPacket.js";
import { InKickPacket } from "../packets/teacher/KickPacket.js";
import { InMaxLevelPacket } from "../packets/teacher/MaxLevelPacket.js";
import { InSetActiveCoursePacket } from "../packets/teacher/SetActiveCoursePacket.js";
import { InStartCoursePacket } from "../packets/teacher/StartCoursePacket.js";
import { InStopCoursePacket } from "../packets/teacher/StopCoursePacket.js";
import { InVerifyPacket } from "../packets/teacher/VerifyPacket.js";

// export const InGenericHiPacket = z.object({
// 	type: z.literal("hi"),
// 	schoolCode: z.string(),
// 	clientType: z.enum(["teacher", "student"]),
// });

// export const InTeacherHiPacket = InGenericHiPacket.extend({
// 	clientType: z.literal("teacher"),
// 	username: z.string(),
// 	password: z.string(),
// });

// export const InStudentHiPacket = InGenericHiPacket.extend({
// 	clientType: z.literal("student"),
// });

export const InHiPacket = z.union([InTeacherHiPacket, InStudentHiPacket]);

// export const InPongPacket = z.object({
// 	type: z.literal("pong")
// });

// Admin Packets

// export const InAddTeacherPacket = z.object({
// 	type: z.literal("addTeacher"),
// 	username: z.string(),
// 	password: z.string(),
// });

// export const InDeleteTeacherPacket = z.object({
// 	type: z.literal("deleteTeacher"),
// 	uuid: z.string()
// });

// export const InAddCoursePacket = z.object({
// 	type: z.literal("addCourse"),
// 	name: z.string()
// });

// export const InDeleteCoursePacket = z.object({
// 	type: z.literal("deleteCourse"),
// 	uuid: z.string()
// });

// export const InAddRoomPacket = z.object({
// 	type: z.literal("addRoom"),
// 	name: z.string()
// });

// export const InDeleteRoomPacket = z.object({
// 	type: z.literal("deleteRoom"),
// 	uuid: z.string()
// });

// export const InSetLangPacket = z.object({
// 	type: z.literal("setLang"),
// 	lang: z.enum(["en", "de"])
// });

// export const InSetChannelPacket = z.object({
// 	type: z.literal("setChannel"),
// 	channel: z.enum(["latest", "beta", "alpha"])
// });

// export const InChangeTeacherPasswordPacket = z.object({
// 	type: z.literal("changeTeacherPassword"),
// 	uuid: z.string(),
// 	password: z.string()
// });

// export const InRenameCoursePacket = z.object({
// 	type: z.literal("renameCourse"),
// 	uuid: z.string(),
// 	name: z.string()
// });

export const InAdminPackets = z.union([
	InAddTeacherPacket,
	InDeleteTeacherPacket,
	InAddCoursePacket,
	InDeleteCoursePacket,
	InAddRoomPacket,
	InDeleteRoomPacket,
	// InSetLangPacket,
	// InSetChannelPacket,
	InChangeTeacherPasswordPacket,
	InRenameCoursePacket
]);

// export const InSetActiveCoursePacket = z.object({
// 	type: z.literal("setActiveCourse"),
// 	uuid: z.string(),
// 	course: z.string() // uuid
// });

// export const InStartCoursePacket = z.object({
// 	type: z.literal("startCourse"),
// 	uuid: z.string()
// });

// export const InStopCoursePacket = z.object({
// 	type: z.literal("stopCourse"),
// 	uuid: z.string()
// });

// export const InGetCourseInfoPacket = z.object({
// 	type: z.literal("getCourseInfo"),
// 	uuid: z.string()
// });

// export const InKickPacket = z.object({
// 	type: z.literal("kick"),
// 	uuid: z.string()
// });

// export const InDeletePacket = z.object({
// 	type: z.literal("delete"),
// 	uuid: z.string(),
// 	courseUUID: z.string()
// });

// export const InSetLevelPacket = z.object({
// 	type: z.literal("setLevel"),
// 	uuid: z.string(),
// 	courseUUID: z.string(),
// 	level: z.number()
// });

// export const InGetVerificationsPacket = z.object({
// 	type: z.literal("getVerifications"),
// 	course: z.string()
// });

// export const InVerifyPacket = z.object({
// 	type: z.literal("verify"),
// 	uuid: z.string(),
// 	course: z.string()
// });

// export const InDismissPacket = z.object({
// 	type: z.literal("dismiss"),
// 	uuid: z.string(),
// 	course: z.string()
// });

// export const InChangePasswordPacket = z.object({
// 	type: z.literal("changePassword"),
// 	password: z.string()
// });

// export const InAllowRegisterPacket = z.object({
// 	type: z.literal("allowRegister"),
// 	course: z.string(),
// 	allow: z.boolean()
// });

// export const InGetTasksPacket = z.object({
// 	type: z.literal("getTasks")
// });

// export const InMaxLevelPacket = z.object({
// 	type: z.literal("maxLevel"),
// 	course: z.string(),
// 	maxSection: z.number(),
// 	maxLevel: z.number()
// });

export const InTeacherPackets = z.union([
	InSetActiveCoursePacket,
	InStartCoursePacket,
	InStopCoursePacket,
	InGetCourseInfoPacket,
	InKickPacket,
	InDeletePacket,
	// InSetLevelPacket,s
	InGetVerificationsPacket,
	InVerifyPacket,
	InDismissPacket,
	InChangePasswordPacket,
	InAllowRegisterPacket,
	InGetTasksPacket,
	InMaxLevelPacket
]);

// export const InRoomPacket = z.object({
// 	type: z.literal("room"),
// 	uuid: z.string()
// });

// export const InLoginPacket = z.object({
// 	type: z.literal("login"),
// 	name: z.string()
// });

// export const InInfoPacket = z.object({
// 	type: z.literal("info"),
// 	level: z.number()
// });

// export const InTaskPacket = z.object({
// 	type: z.literal("task"),
// 	level: z.number(),
// 	section: z.number()
// });

// export const InDonePacket = z.object({
// 	type: z.literal("done"),
// 	level: z.number(),
// 	answeredqs: z.number().optional(),
// 	correctqs: z.number().optional(),
// 	section: z.number()
// });

// export const InIdleStateChangePacket = z.object({
// 	type: z.literal("idleStateChange"),
// 	idle: z.boolean()
// });

// export const InGetSectionPacket = z.object({
// 	type: z.literal("getSection"),
// 	section: z.number()
// });

// export const InStartGroupPacket = z.object({
// 	type: z.literal("startGroup")
// });

// export const GroupCode = z.string().min(6).max(6).regex(/^[A-Z0-9]+$/);

// export const InJoinGroupPacket = z.object({
// 	type: z.literal("joinGroup"),
// 	group: GroupCode
// });

// export const InGroupCodePacket = z.object({
// 	type: z.literal("groupCode"),
// 	group: GroupCode,
// 	code: z.string()
// });

// export const InLeaveGroupPacket = z.object({
// 	type: z.literal("leaveGroup"),
// 	group: GroupCode
// });

// export const InSyncGroupPacket = z.object({
// 	type: z.literal("syncGroup"),
// 	group: GroupCode
// });

// export const InGroupActionPacket = z.object({
// 	type: z.literal("groupAction"),
// 	group: z.string(),
// 	action: z.any()
// });

export const InStudentPackets = z.union([
	InRoomPacket,
	InLoginPacket,
	InInfoPacket,
	InTaskPacket,
	InDonePacket,
	InIdleStateChangePacket,
	InGetSectionPacket,
	// InStartGroupPacket,
	// InJoinGroupPacket,
	// InGroupCodePacket,
	// InLeaveGroupPacket,
	// InSyncGroupPacket,
	// InGroupActionPacket
]);

export const InPacket = z.union([
	InHiPacket,
	InPongPacket,
	InAdminPackets,
	InTeacherPackets,
	InStudentPackets
]);

export const Packet = InPacket;