

![](jmbp-561.png)

## Pre-requisites

```
npm install socket.io
```

## Running

1. Make sure your MQTT server is running and listening on _localhost_.
2. Launch `./run.sh` which starts the Node socket server
3. Point your Web browser at your Web server, to `.../corp.html`. You should see the
   connection in the terminal window running _node_.
4. Start publishing something on MQTT, as per the example in `randpub.py`

## Credits

* The `socket.io` example for Node (`pusher.js`) and some bits of `corp.html` are by [Robert Hekkers][1] 


  [1]: http://blog.hekkers.net/2012/10/13/realtime-data-with-mqtt-node-js-mqtt-js-and-socket-io/

