/*
This function is based on the idea of communicate with server for building the locations to reach for the drone in flight.
On the server side a scheduling algorithm will be implemented in order to build a smart path of locations that drones will reach.
*/
function buildPath(droneName){

	var index = brain.getIndexDrone(droneName)
	if(brain.drones[index].locationsToReach.length == 0){
		alert("This drone has not locations to reach right now..")
		return
	}

	$.ajax({
		type: 'POST',
		url: '/buildPath',
		contentType: 'application/json',
		data: JSON.stringify({ droneName: droneName, locationsList: brain.drones[index].locationsToReach}),
		success: function(data){
			data = data['path']

			var element = brain.getIndexDrone(data['drone'])
			//adding the flight button in the dronesTable
			var flightButton = '<button type="button" class="btn btn-success" onclick="flightDrone(\'' +  brain.drones[element].name + '\')">Flight</button>'
			$("[id = '" + data['drone'] + "']").children().eq(3).html(flightButton)

		},
		error: function(){
			console.log("There is an error on server side")
		}
	})
}

/*
This function communicates with the server for handling the floght of the drone.
An AJAX request will be sent for starting the flight.
When drone is on flight, it will send information about its location or its succes on flight via socket.

*/
function flightDrone(droneName, type){
	if (type == 'rectangular') {
		$.ajax({
			type: 'POST',
			url: '/rectangularFlight',
			contentType: 'application/json',
			success: function(data){
				console.log(data)
			},
			error: function(){
				console.log("There is an error on server side")
			}
		})
		for (var i = 0; i < brain.drones.length; i++) {
			if(brain.drones[i].surveyMode == 'rectangular'){
				openSocket(brain.drones[i].name)
			}
		}
	} else {
		var index = brain.getIndexDrone(droneName)
		//Check if we are in the oscillation survey mode
		if(brain.drones[index].surveyMode == 'oscillation'){
			console.log("Oscillation flight mode");
			$.ajax({
				type: 'POST',
				url: '/oscillationFlight',
				contentType: 'application/json',
				data: JSON.stringify({ name: droneName }),
				success: function(data){
					console.log("New version of response")
					data = data['data']
					updateGraphicAndDataStructureInformationOnOscillationSurvey(data)
				},
				error: function(){
					console.log("There is an error on server side")
				}
			})
		} else {
			//This means that I have a "normal" flight to accomplish
			//brain.socket.emit('flight', {'name': droneName})
			console.log("Normal Flight Mode")
			$.ajax({
				type: 'POST',
				url: '/flight',
				contentType: 'application/json',
				data: JSON.stringify({ name: droneName }),
				success: function(data){
					console.log(data)
				},
				error: function(){
					console.log("There is an error on server side")
				}
			})
		}

		openSocket(droneName)
		brain.socket.on('Oscillation Survey Data', function(data){
			console.log("Data inside Oscillation Survey Data: " + data)

		})

	}
	}