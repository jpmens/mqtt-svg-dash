// Swiped from http://blog.hekkers.net/2012/10/13/realtime-data-with-mqtt-node-js-mqtt-js-and-socket-io/
var sys = require('sys');
var net = require('net');
var mqtt = require('./lib/MQTTClient.js');
 
var io  = require('socket.io').listen(5000);
var client = new mqtt.MQTTClient(1883, '127.0.0.1', 'pusher');
 
io.sockets.on('connection', function (socket) {
	socket.on('subscribe', function (data) {
		console.log('Subscribing to '+data.topic);
		client.subscribe(data.topic);
	});
});
 
client.addListener('mqttData', function(topic, payload){
	sys.puts(topic+'='+payload);
	io.sockets.emit('mqtt',{'topic':String(topic),
		'payload':String(payload)});
});
