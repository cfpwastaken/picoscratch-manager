const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const absentStudentTemplate = $("#absent-student-template")

class AbsentStudent extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({mode: "open"});
		shadow.append(absentStudentTemplate.content.cloneNode(true));
	}
}

customElements.define("absent-student", AbsentStudent);