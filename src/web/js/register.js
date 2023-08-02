const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

$("#submit-schoolname").addEventListener("click", async () => {
	$("#schoolname-screen").classList.remove("slideInFromLeft")
	$("#schoolname-screen").classList.add("slideOutToRight");
	await sleep(1000);
	$("#schoolname-screen").classList.remove("slideOutToRight");
	$("#schoolname-screen").style.display = "none";
	$("#password-screen").style.display = "flex";
});

$("#submit-password").addEventListener("click", async () => {
	$("#password-screen").classList.remove("slideInFromLeft")
	$("#password-screen").classList.add("slideOutToRight");
	await sleep(1000);
	$("#password-screen").classList.remove("slideOutToRight");
	$("#password-screen").style.display = "none";
	$("#creating-school").style.display = "flex";

	const code = await fetch("../api/makeSchool", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			schoolname: $("#schoolname").value,
			password: $("#password").value,
			lang: "de"
		})
	}).then(res => res.json());

	$("#schoolcode").innerText = code.code;

	$("#creating-school").classList.remove("slideInFromLeft")
	$("#creating-school").classList.add("slideOutToRight");
	await sleep(1000);
	$("#creating-school").classList.remove("slideOutToRight");
	$("#creating-school").style.display = "none";
	$("#demo-success").style.display = "flex";
});