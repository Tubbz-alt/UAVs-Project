//This is the only global variable and it will be an instance of ClientBrain class
var brain;

$(document).ready(function(){

	var socketio = io.connect('http://' + document.domain + ':' + location.port)

	window.onbeforeunload = function() {
		socketio.emit("refreshing")
		socketio.close()
	}

	//var map = new Map("MST Campus", 37.955879, -91.775020, 20, 640, 640, '/static/Images/Map\ Images/MSTStaticMap20zoom.png')

	var map = new Map("Football Pitch", 37.924750,-91.772437, 19, 640, 640, '/static/Images/Map\ Images/FootballPitchZoom19.png')
	//var map = new Map("Havener Center", 37.954953, -91.775637, 20, 640, 640, '/static/Images/Map\ Images/HavenerCenter20Zoom.png')
	//var map = new Map("Dog Area", 37.924403, -91.775691, 19, 640, 640, '/static/Images/Map\ Images/DogAreaLionsPark.png')
	brain = new ClientBrain(socketio, map)

	getDronesInfoFromServer()

})

//this function is called when 'index.html' has been loaded.
// Sending an AJAX request to server in order to have all the drone of the system(I don't have information about availabilty of drones, I know only the names and the number of the drones)
function getDronesInfoFromServer(){

	//this function sends a request to server to obtain all the drones
	//available in the system and set the drones array in brain.drones
	$.ajax({
		type: 'GET',
		url: '/getDrones',
		contentType: 'application/json',
		success: function(drones){
			drones = drones['results']
			for(index in drones){
				//in the ClientBrain object there is an array of Drone's objects, each drone object has particular data member
				brain.drones.push(new Drone(drones[index]))
			}

			brain.initialGraphicSettings()
		},
		error: function(){
			$('h1').remove()
		}
	})
}

//this function is called when user clicks on "Connect" button
//in each row of drones table.
function connectDrone(droneName, socket){

	$("[id ='" + droneName + "']").children().eq(1).html("Connecting to Solo...")
	$("[id ='" + droneName + "']").children().eq(3).children().eq(0).attr("disabled", "disabled")

	$.ajax({
		type: 'POST',
		url: '/connectDrone',
		contentType: 'application/json',
		data: JSON.stringify({ droneName: droneName}),
		success: function(data){
			var data = data['data']
			console.log(data);;
			if (data=="timeout expired") {
				alert("[ERROR] Some problem with establishing the connection with the " + droneName + ". Try to refresh the page.")
				$("[id ='" + droneName + "']").children().eq(1).html("[ERROR] Previous connections went bad. You could try again refreshing the page.")
				$("[id = '" + droneName + "']").children().eq(2).html("-")
				$("[id ='" + droneName + "']").children().eq(3).children().eq(0).removeAttr("disabled")
				$("[id = '" + droneName + "']").children().eq(4).html("-")
				$("[id = '" + droneName + "']").children().eq(5).html("-")
				return
			}
			if (data['home location'] == undefined) {
				$("[id ='" + droneName + "']").children().eq(1).html("[ERROR] Are you connected with the " + droneName + " network?")
				$("[id = '" + droneName + "']").children().eq(2).html("-")
				$("[id ='" + droneName + "']").children().eq(3).children().eq(0).removeAttr("disabled")
				$("[id = '" + droneName + "']").children().eq(4).html("-")
				$("[id = '" + droneName + "']").children().eq(5).html("-")
			} else{

				var element = brain.getIndexDrone(droneName)
				var buildPathButton = '<button type="button" class="btn btn-success" onclick="buildPath(\'' +  brain.drones[element].name + '\')">Prepare Survey</button>'
				if(brain.drones[element].surveyMode == 'rectangular'){
						buildPathButton = 'Rectangular Survey Mode'
				}

				$("[id = '" + droneName + "']").children().eq(1).html(data['drone status'])
				$("[id = '" + droneName + "']").children().eq(2).html(data['drone battery'])
				$("[id = '" + droneName + "']").children().eq(3).html(buildPathButton)
				$("[id = '" + droneName + "']").children().eq(4).html(data['camera status'])
				$("[id = '" + droneName + "']").children().eq(5).html(data['camera battery'])

				var location = brain.converter.getXYCoordinatesFromLatitudeLongitudeCoordinates(parseFloat(data['home location'].latitude), parseFloat(data['home location'].longitude))
				brain.graphicBrain.addMarker(location.x, location.y, 'home', droneName)
				brain.graphicBrain.addLocationIntoTableOfLocationsToReach(droneName, brain.drones, data['home location'].latitude, data['home location'].longitude, 0, "home")
			}
		},
		error: function(data){
			alert("An error occured on server-side")
			console.log(data)
		}
	})
}
