document.querySelector("#learn-download").addEventListener("click", async () => {
	const latest = await fetch("https://cfp.is-a.dev/update/picoscratch-learn/latest.yml").then(r => r.text());
	/*
	The format is:
	version: 1.3.1
files:
  - url: PicoScratch Learn Setup 1.3.1.exe
    sha512: 19pPJ+jh++RZYQwXFpiMl34UHw3ElnvABeJ1q4F5MeA2ynAw9XYfI6odo09umk9oGlW4c17JErem3sLR7vt5xA==
    size: 66344941
path: PicoScratch Learn Setup 1.3.1.exe
sha512: 19pPJ+jh++RZYQwXFpiMl34UHw3ElnvABeJ1q4F5MeA2ynAw9XYfI6odo09umk9oGlW4c17JErem3sLR7vt5xA==
releaseDate: '2023-01-25T18:49:39.292Z'
	*/
	const url = latest.match(/url: (.*)/)[1];
	const sha512 = latest.match(/sha512: (.*)/)[1];
	// location.href = "https://cfp.is-a.dev/update/picoscratch-learn/" + url;
	document.querySelector("#download-dialog").style.display = "";
	document.querySelector("#sha512-checksum").innerText = sha512;
	download("https://cfp.is-a.dev/update/picoscratch-learn/" + url);
})

function download(url) {
	const link = document.createElement("a");
	link.href = url;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.querySelector("#close-download-dialog").addEventListener("click", () => {
	document.querySelector("#download-dialog").style.display = "none";
})

document.querySelector("#learn-id").value = "";