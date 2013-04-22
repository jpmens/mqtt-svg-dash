/**
  *This is a simple MQTT cient on node.js
  *Author: Fan Yilun @CEIT @14 FEB 2011
  */
var sys = require('sys');
var net = require('net');
var EventEmitter = require('events').EventEmitter;

var MQTTCONNECT = 0x10;
var MQTTPUBLISH = 0x30;
var MQTTSUBSCRIBE = 0x80; //8<<4;

var KEEPALIVE = 15000;

//var client = Client(1883, '127.0.0.1', 'mirror'); 

function MQTTClient(port, host, clientID) {
    //EventEmitter.call(this);

    this.connected = false;
    this.sessionSend = false;
    this.sessionOpened = false;
    this.id = clientID;

    //this.conn = net.createConnection(port || 1883, host || '127.0.0.1');
    this.conn = net.createConnection(port, host);
    this.conn.setEncoding('utf8');
  
    var self = this;
    
    //Set timer
    self.timeout = setTimeout(function() {
        self.timeUp();
    }, 25000);

    self.conn.addListener('data', function (data) {
        if(!self.sessionOpened){
            //sys.puts("len:"+data.length+' @3:'+data.charCodeAt(3)+'\n');
            if(data.length==4 && data.charCodeAt(3)==0){
                self.sessionOpened = true;
                sys.puts("Session opend\n");
                self.emit("sessionOpened");
                
                //reset timer
                clearTimeout(self.timeout);
                self.timeout = setTimeout(function() {
                    self.timeUp();
                }, 3000);
            }else{
                clearTimeout(self.timeout);
                self.emit("openSessionFailed");
                self.conn.end();
                //this.conn.destroy();
                return;
            }
        } else {
            //sys.puts('len:' + data.length+' Data received:'+data+'\n');
            if(data.length > 2){
                var buf = new Buffer(data);
                self.onData(buf);
            }
        }
    });

    self.conn.addListener('connect', function () {
        //sys.puts('connected\n');
        self.connected = true;
        //Once connected, send open stream to broker
        self.openSession(self.id);
    });
  
    self.conn.addListener('end', function() {
        self.connected = false;
        self.sessionSend = false;
        self.sessionOpened = false;
        sys.puts('Connection closed by broker');
    });
}

sys.inherits(MQTTClient, EventEmitter);
exports.MQTTClient = MQTTClient;

MQTTClient.prototype.timeUp = function(){
        if(this.connected && this.sessionOpened){
            //sys.puts('25s keep alive');
            this.live();
        } else if (!this.connected ){
            sys.puts('MQTT connect to server time out');
            this.emit("connectTimeOut");
        } else {
            sys.puts('Unknow state');
        }
    };
    
MQTTClient.prototype.openSession = function (id) {

	var i = 0;
    var buffer = new Buffer(16+id.length);
    
	buffer[i++] = MQTTCONNECT;
    buffer[i++] = 14+id.length;
	buffer[i++] = 0x00;
	buffer[i++] = 0x06;
	buffer[i++] = 0x4d;
	buffer[i++] = 0x51;
	buffer[i++] = 0x49;
	buffer[i++] = 0x73;
	buffer[i++] = 0x64;
	buffer[i++] = 0x70;
	buffer[i++] = 0x03;

	buffer[i++] = 0x02;

	//Keep alive for 30s
	buffer[i++] = 0x00;
	buffer[i++] = KEEPALIVE/500;  //Keepalive for 30s

	buffer[i++] = 0x00;
    buffer[i++] = id.length;
    
    for (var n = 0; n < id.length; n++) { //Insert client id 
        buffer[i++] = id.charCodeAt(n); //Convert string to utf8
	}
    
    //sys.puts(buffer.toString('utf8',0, 16)+'  '+buffer.length);
    this.conn.write(buffer, encoding="ascii");

    this.sessionSend = true;
    sys.puts('Connected as :'+id+'\n');
    
    //publish('node', 'here is nodejs');
    //this.subscribe('mirror');
};


/*subscribes to topics */
MQTTClient.prototype.subscribe = function (sub_topic) {
	if(this.connected){
    	var i = 0;
		var buffer = new Buffer(7+sub_topic.length);;
    
		//fixed header
		buffer[i++] = MQTTSUBSCRIBE;
		buffer[i++] = 5 + sub_topic.length;

		//varibale header
		buffer[i++] = 0x00;
		buffer[i++] = 0x0a; //message id

		//payload
		buffer[i++] = 0x00;
		buffer[i++] = sub_topic.length;
	
		for (var n = 0; n < sub_topic.length; n++) {
			buffer[i++] = sub_topic.charCodeAt(n);
    	}
		buffer[i++] = 0x00;
    
    	//sys.puts(7+sub_topic.length);
    	sys.puts('Subcribe to:'+sub_topic);
    	//sys.puts("Subscribe send len:"+buffer.length+'\n');
    
		this.conn.write(buffer, encoding="ascii");
    
   	 	//reset timer
    	var cc = this;
    	clearTimeout(this.timeout);
    	this.timeout = setTimeout(function() {
        	cc.timeUp();
    	}, 25000);
    }
};

/*publishes to topics*/
MQTTClient.prototype.publish = function (pub_topic, payload) {
	
	if(this.connected){
        var i = 0, n = 0;
        var var_header = new Buffer(2+pub_topic.length);
        
        //Variable header
        //Assume payload length no longer than 128
        var_header[i++] = 0;
        var_header[i++] = pub_topic.length;
        for (n = 0; n < pub_topic.length; n++) {
            var_header[i++] = pub_topic.charCodeAt(n);
        }
        //QoS 1&2
        //var_header[i++] = 0;
        //var_header[i++] = 0x03;
        
        i = 0;
        var buffer = new Buffer(2+var_header.length+payload.length);
        
        //Fix header
        buffer[i++] = MQTTPUBLISH;
        buffer[i++] = payload.length + var_header.length;
        for (n = 0; n < var_header.length; n++) {
            buffer[i++] = var_header[n];
        }
        for (n = 0; n < payload.length; n++) { //Insert payloads
            buffer[i++] = payload.charCodeAt(n);
        }
        
        sys.puts("||Publish|| "+pub_topic+' : '+payload);
        
        this.conn.write(buffer, encoding="ascii");
        
        //reset timer
        var cc = this;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(function() {
            cc.timeUp();
        }, 25000);
    }
};

MQTTClient.prototype.onData = function(data){
    var type = data[0]>>4;
    //sys.puts('\ntype:'+type);
    //sys.puts('1:'+data[1]);
    //sys.puts('2:'+data[2]);
    //sys.puts('3:'+data[3]);
    if (type == 3) { // PUBLISH
        var tl = data[3]+data[2]; //<<4
        var topic = new Buffer(tl);
        for(var i = 0; i < tl; i++){
            topic[i] = data[i+4];
        }
        if(tl+4 <= data.length){
            var payload = data.slice(tl+4, data.length);
            sys.puts("Receive on Topic:"+topic);
            sys.puts("Payload:"+payload+'\n');
            this.emit("mqttData", topic, payload);
        }
    } else if (type == 12) { // PINGREG -- Ask for alive
        //Send [208, 0] to server
        sys.puts('Send 208 0');
        var packet208 = new Buffer(2);
        packet208[0] = 0xd0;
        packet208[1] = 0x00;
        
        this.conn.write(packet208, encoding="utf8");
        
        //reset timer
        var cc = this;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(function() {
            cc.timeUp();
        }, 25000);
    }
}

MQTTClient.prototype.live = function () {
	//Send [192, 0] to server
    var packet192 = new Buffer(2);
    packet192[0] = 0xc0;
    packet192[1] = 0x00;
    this.conn.write(packet192, encoding="utf8");
    
    //reset timer
    var cc = this;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(function() {
        cc.timeUp();
        //self.publish('node', 'hello wtf');
    }, 25000); //send keepavie every 25s
};

MQTTClient.prototype.disconnect = function () {
	//Send [224,0] to server
    var packet224 = new Buffer(2);
    packet224[0] = 0xe0;
    packet224[1] = 0x00;
    this.conn.write(packet224, encoding="utf8");
};