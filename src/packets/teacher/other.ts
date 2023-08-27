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