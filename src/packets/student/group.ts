// @ts-ignore

/*
} else if(packet.type == "startGroup") {
	const course = await this.room.$get("course") as Course;
	if(course == null) return;
	// const group = await course.$create("codeGroup", {}) as CodeGroup;
	const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 character code
	const group = await CodeGroup.create({courseUuid: course.uuid, code});
	if(!group) return;
	peopleInGroup[group.uuid] = [this];
	this.ws.send(JSON.stringify({type: "startGroup", success: true, group}));
} else if(packet.type == "joinGroup") {
	const course = await this.room.$get("course");
	if(course == null) return;
	const group = await CodeGroup.findOne({where: {code: packet.group, courseUuid: course.uuid}});
	if(!group) {
		this.ws.send(JSON.stringify({type: "joinGroup", success: false, error: "Group not found"}));
		return;
	}
	const people = peopleInGroup[group.uuid];
	people.push(this);
	this.ws.send(JSON.stringify({type: "joinGroup", success: true, group}));
	if(!peopleInGroupRequestingSync[packet.group]) peopleInGroupRequestingSync[packet.group] = [this];
	else peopleInGroupRequestingSync[packet.group].push(this);
	let randomPerson;
	let att = 30;
	while(!randomPerson || randomPerson == this) {
		randomPerson = people[Math.floor(Math.random() * people.length)];
		if(att-- == 0) break;
	}
	randomPerson.ws.send(JSON.stringify({type: "syncGroup"}));
} else if(packet.type == "groupCode") {
	// Response to syncGroup request
	const peopleRequesting = peopleInGroupRequestingSync[packet.group];
	if(!peopleRequesting) return;
	for(const person of peopleRequesting) {
		person.ws.send(JSON.stringify({type: "groupCode", code: packet.code}));
		peopleInGroupRequestingSync[packet.group].splice(peopleInGroupRequestingSync[packet.group].findIndex(p => p == person), 1);
	}
	if(peopleRequesting.length == 0) {
		delete peopleInGroupRequestingSync[packet.group];
	}
} else if(packet.type == "leaveGroup") {
	peopleInGroup[packet.group].splice(peopleInGroup[packet.group].findIndex(p => p == this), 1);
	if(peopleInGroup[packet.group].length == 0) {
		delete peopleInGroup[packet.group];
		const group = await CodeGroup.findOne({where: {uuid: packet.group}});
		if(group) await group.destroy();
	}
	this.ws.send(JSON.stringify({type: "leaveGroup", success: true}));
} else if(packet.type == "syncGroup") {
	const people = peopleInGroup[packet.group];
	if(!people) return;
	if(!peopleInGroupRequestingSync[packet.group]) peopleInGroupRequestingSync[packet.group] = [this];
	else peopleInGroupRequestingSync[packet.group].push(this);
	let randomPerson;
	let att = 30;
	while(!randomPerson || randomPerson == this) {
		randomPerson = people[Math.floor(Math.random() * people.length)];
		if(att-- == 0) break;
	}
	randomPerson.ws.send(JSON.stringify({type: "syncGroup"}));
} else if(packet.type == "groupAction") {
	const people = peopleInGroup[packet.group];
	console.log(people);
	console.log(peopleInGroup);
	if(!people) return;
	for(const person of people) {
		if(person == this) continue;
		person.ws.send(JSON.stringify({type: "groupAction", action: packet.action}));
	}
}*/