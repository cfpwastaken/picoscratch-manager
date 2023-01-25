const $ = document.querySelector.bind(document);
requestAnimationFrame(() => {
	const pw = prompt("Password");
	if(pw == "secret") {
		$("#dashboard").style.display = "";
	}
})