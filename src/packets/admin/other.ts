// @ts-nocheck

return;
if(packet.type == "setLang") {
	if(!packet.lang) {
		this.ws.send(JSON.stringify({type: "setLang", success: false, error: "Missing lang"}));
		return;
	}
	this.school.lang = packet.lang;
	await this.school.save();
	this.ws.send(JSON.stringify({type: "setLang", success: true, lang: this.school.lang}));
	broadcastAdmins(this.school, {type: "setLang", lang: this.school.lang}, this.cid);
} else if(packet.type == "setChannel") {
	if(!packet.channel) {
		this.ws.send(JSON.stringify({type: "setChannel", success: false, error: "Missing channel"}));
		return;
	}
	this.school.channel = packet.channel;
	await this.school.save();
	this.ws.send(JSON.stringify({type: "setChannel", success: true, channel: this.school.channel}));
	broadcastAdmins(this.school, {type: "setChannel", channel: this.school.channel}, this.cid);
}