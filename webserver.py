from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, send
import eventlet
import time
from serverbrain import ServerBrain
import socket

# Allow us to reuse sockets after the are bound.
# http://stackoverflow.com/questions/25535975/release-python-flask-port-when-script-is-terminated
socket.socket._bind = socket.socket.bind
def my_socket_bind(self, *args, **kwargs):
    self.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    return socket.socket._bind(self, *args, **kwargs)
socket.socket.bind = my_socket_bind

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/getDrones')
def getDrones():
	return jsonify(results=getDroneNames())

def getDroneNames():
    dronesList = list()
    for element in brain.drones:
        dronesList.append(element)
    return dronesList


@app.route('/connectDrone', methods=['POST'])
def connectDrone():
    data = request.get_json()
    message = brain.connectDrone(data['droneName'])
    print message
    return jsonify({'data' : message})

@socketio.on('flight')
def flight(data):
	print "Creating thread for flight of, ", data['name']
	#brain.activateThread("flight", data['name'], data['locationList'])
    brain.takeAFlight(data['name'])

@socketio.on('build path')
def buildPath(data):

    brain.buildPath(data['name'], data['locationsList'])

if __name__ == '__main__':

	brain = ServerBrain(socketio)
	app.debug = True
	socketio.run(app)
