// import langs from "../lang.json" assert { type: "JSON" };
const langs = await fetch("../lang.json").then(res => res.json());

let lang;

function updateLanguages() {
	document.querySelectorAll("[data-lang]").forEach(e => {
		e.innerText = langs[lang][e.getAttribute("data-lang")];
	})
	document.querySelectorAll("[data-lang-placeholder]").forEach(e => {
		e.placeholder = langs[lang][e.getAttribute("data-lang-placeholder")];
	})
	document.querySelectorAll("[data-lang-title]").forEach(e => {
		e.title = langs[lang][e.getAttribute("data-lang-title")];
	})
}

export function setLang(toLang) {
	lang = toLang;
	updateLanguages();
}

export function getLang() {
	return lang;
}

export function translate(key) {
	return langs[lang][key];
}