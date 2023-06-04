const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const absentStudentTemplate = $("#absent-student-template")

class AbsentStudent extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({mode: "open"});
		shadow.append(absentStudentTemplate.content.cloneNode(true));

		shadow.querySelector("#pic").src = "https://api.dicebear.com/6.x/thumbs/svg?seed=" + encodeURI(this.innerText);

    shadow.addEventListener("slotchange", (e) => {
			shadow.querySelector("#pic").src = "https://api.dicebear.com/6.x/thumbs/svg?seed=" + encodeURI(this.innerText);
		});
	}
}

customElements.define("absent-student", AbsentStudent);