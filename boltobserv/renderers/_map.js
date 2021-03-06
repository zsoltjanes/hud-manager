// Initial map rendering
//
// Responsible for changing radar background on map change, loading map
// metadata and applying some general config values.

// Catch map data send by the game
let currentMap = '';
websocket.on("map", event => {
	/**
	 * Show a map error and quit
	 * @param  {String} text What error message to show
	 */
	function throwMapError(text) {
		document.getElementById("unknownMap").style.display = "flex"
		document.getElementById("unknownMap").children[0].innerHTML = text
	}
	let mapName = event.data
	if (mapName.indexOf("/") != -1) {
		mapName = mapName.split("/")[mapName.split("/").length - 1]
	}
	// If map is unchanged we do not need to do anything
	if (global.currentMap == mapName) return
	
	const url = new URL(window.location.href);
	const hud = url.searchParams.get("hud") || '';
	const isDev = url.searchParams.get("devMaps") === "true";

	let metaSrc = `/boltobserv/maps/${mapName}/meta.json5`;
	if(hud.length){
		metaSrc = `/boltobserv/maps/${mapName}/meta.json5?hud=${hud}`;
	}
	if(isDev){
		metaSrc = `/boltobserv/maps/${mapName}/meta.json5?dev=true`
		//metaSrc = `http://localhost:3500/maps/${mapName}/meta.json5`;
	}

	fetch(metaSrc)
	.then(resp => resp.text())
	.then(data => {
		data = data.replace(/^\s*?\/\/.*?$/gm, "")
		global.mapData = JSON.parse(data)

		// Check if the map uses the expected meta format
		if (global.mapData.version.format != 2) {
			return throwMapError(`Outdated map file for ${mapName}`)
		}

		// Make sure that the "unknown map" message is turned off for valid maps
		document.getElementById("unknownMap").style.display = "none"

		// Show the radar backdrop

		let radarSrc = `/boltobserv/maps/${mapName}/radar.png`;
		if(hud.length){
			radarSrc = `/boltobserv/maps/${mapName}/radar.png?hud=${hud}`;
		}
		if(isDev){
			radarSrc = `http://localhost:3500/maps/${mapName}/radar.png`;
		}
		document.getElementById("radar").src = radarSrc

		// Set the map as the current map and in the window title
		global.currentMap = mapName
		document.title = "Boltobserv - " + mapName

		// Hide advisories if you've been disabled in the config
		if (global.config.radar.hideAdvisories) {
			document.getElementById("advisory").style.display = "none"
		}
		else {
			// Otherwise, read the advisory position from config and apply it
			document.getElementById("advisory").style.left = global.mapData.advisoryPosition.x + "%"
			document.getElementById("advisory").style.bottom = global.mapData.advisoryPosition.y + "%"
			document.getElementById("advisory").style.display = "block"
		}

		// Allow init to load other scripts
		hasMap = true
		importScripts()
	})
	.catch(() => {
		return throwMapError(`Error reading the ${mapName} map file :(`)
	})
})
