# node-red-contrib-reverse-proxy
A Node-Red node to use Node-RED as a reverse proxy server, for redirecting http(s) requests

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-reverse-proxy
```

## Node Usage
The following example flow explains how this node works closely together with Node-RED's httpin node.  Instead of navigating directly to some public url (in this case an mjpeg camera stream from https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi), we will navigate to our Node-RED flow and Node-RED will forward the request to that target:

   ![image](https://user-images.githubusercontent.com/14224149/60925124-19ef6880-a2a3-11e9-8fdd-fede83adc291.png)
   
   ```
   [{"id":"6bfa122c.baff8c","type":"reverse-proxy","z":"8bb35f74.82618","name":"","url":"https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi","events":[],"headers":{},"proxy":"","restart":false,"timeout":1,"x":1220,"y":520,"wires":[]},{"id":"cf75b05d.199df","type":"http in","z":"8bb35f74.82618","name":"","url":"/mjpeg_test","method":"get","upload":false,"swaggerDoc":"","x":1000,"y":520,"wires":[["6bfa122c.baff8c"]]}]
   ```

1. Forward all requests for http(s)://<node-red-hostname>:1880/mjpeg_test to your reverse-proxy node, via the httpin node.
1. Forward all requests from the httpin node to the target host (https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi).
1. The response from the target host will be passed back to your browser.

This way, it looks like Node-RED is providing your mjpeg camera stream...

![reverse_proxy](https://user-images.githubusercontent.com/14224149/60925580-64bdb000-a2a4-11e9-82e4-8267a7f2e061.gif)

## Node configuration

### URL
This URL refers to the target host system, to which the http(s) requests need to be forwarded.

## TODO's
+ This is an experimental node, so I have to add all kind of options (see list [here](https://github.com/http-party/node-http-proxy#options)).
+ When the resource cannot be found, a 404 error will occur as expected.  However the URL of the target host appears in the browser, but we would like the URL of the Node-RED host to appear ... 
