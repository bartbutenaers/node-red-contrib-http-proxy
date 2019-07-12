# node-red-contrib-reverse-proxy
A Node-Red node to use Node-RED as a reverse proxy server, for redirecting http(s) requests

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-reverse-proxy
```

## Introduction

### What is a reverse proxy?
TODO

### The Node-RED solution
Node-RED nodes provides some nodes out-of-the-box, which can be used to turn your flow into a reverse proxy:

![image](https://user-images.githubusercontent.com/14224149/61157366-3fc07b80-a4f6-11e9-8bf8-141720d4849b.png)

1. Navigate to an URL (e.g. via a browser), which refers to a Node-RED instance.
1. A http(s) request will be send to Node-RED.
1. The **http-in** node listens for all requests for sub-path 'show_request', and it creates both a request and response object.
1. The output message contains the request object in ```msg.req``` and the corresponding response in ```msg.res```.
1. The **http-request** node creates a *new* http request, which will be send to the target host.
1. The target host will answer with a http response.
1. The http-request node will copy the new http response content into the output message, while the original request and response will be left untouched (in ```msg.req``` and  ```msg.res```).
1. The **http-out** node will fill the original http response (via ```msg.res```) with data from the input message:
   + Fill response body with ```msg.payload```.
   + Fill response status code with ```msg.statusCode```.
   + Fill response headers with ```msg.headers```.
   + Fill response cookies with ```msg.cookies```.

   At the end the browser will receive the response ...

### Why an alternative contribution
The Node-RED standard alternative works very fine, as long as the response is **finite**: indeed only when the http-request node has received a complete response, it will send an output message.  And the http-out node also expects a single (complete) message, which will be used to generate a response once.

But if an **infinite** response is required (e.g. an endless Mjpeg stream), a reverse proxy will do the job.  There are lots of reverse proxies available on the market, but this node offers a simple solution (fully integrated inside Node-RED).

![image](https://user-images.githubusercontent.com/14224149/61160537-07259f80-a500-11e9-9567-2fa0e6d17894.png)

1. Navigate to an URL (e.g. via a browser), which refers to a Node-RED instance.
1. A http(s) request will be send to Node-RED.
1. The **http-in** node listens for all requests for sub-path 'show_request', and it creates both a request and response object.
1. The output message contains the request object in ```msg.req``` and the corresponding response in ```msg.res```.
1. The **reverse-proxy** will redirect the original http request to the target host.
1. The target host will answer with a http response.
1. The reverse proxy node node will fill the original http response (via ```msg.res```) with data received from the target system.

At the end the browser will receive the response ...

## Node Usage
The following example flow explains how this node works closely together with Node-RED's httpin node.  Instead of navigating directly to some public url (in this case an mjpeg camera stream from https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi), we will navigate to our Node-RED flow and Node-RED will forward the request to that target:

   ![image](https://user-images.githubusercontent.com/14224149/60925124-19ef6880-a2a3-11e9-8fdd-fede83adc291.png)
   
   ```
   [{"id":"cf75b05d.199df","type":"http in","z":"8bb35f74.82618","name":"","url":"/mjpeg_test","method":"get","upload":false,"swaggerDoc":"","x":600,"y":480,"wires":[["fc540b94.6dd968"]]},{"id":"fc540b94.6dd968","type":"reverse-proxy","z":"8bb35f74.82618","name":"","url":"https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi","events":[],"headers":{},"proxy":"","restart":false,"timeout":1,"x":820,"y":480,"wires":[]}]
   ```

1. Forward all requests for http(s)://<node-red-hostname>:1880/mjpeg_test to your reverse-proxy node, via the httpin node.
1. Forward all requests from the httpin node to the target host (https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi).
1. The response from the target host will be passed back to your browser.

This way, it looks like Node-RED is providing your mjpeg camera stream...

![reverse_proxy](https://user-images.githubusercontent.com/14224149/60925580-64bdb000-a2a4-11e9-82e4-8267a7f2e061.gif)

## Node configuration

It is easy to simulate the effect of every individual setting in the config screen, by using following test flow:

![image](https://user-images.githubusercontent.com/14224149/61107320-f33a5900-a47f-11e9-8e33-c42e8b0c6040.png)

```
[{"id":"cf75b05d.199df","type":"http in","z":"8bb35f74.82618","name":"","url":"/show_request","method":"get","upload":false,"swaggerDoc":"","x":430,"y":480,"wires":[["8f1c4103.5481e"]]},{"id":"8f1c4103.5481e","type":"reverse-proxy","z":"8bb35f74.82618","name":"","url":"https://httpbin.org/get","incomingTimeout":0,"outgoingTimeout":0,"changeOrigin":false,"preserveHeaderKeyCase":false,"verifyCertificates":false,"followRedirects":false,"toProxy":false,"xfwd":false,"x":660,"y":480,"wires":[]}]
```
1. Change a single setting in the node's config screen.
1. Navigate with your browser to ```<http or https>://<node-red hostname>:1880/show_request```.
1. The target host (in this case [httpbin](https://httpbin.org/get) will return your http request.
1. The request (that has been send to the target host) will be displayed in the browser.  For example:

   ```json
   {
     "args": {}, 
     "headers": {
       "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3", 
       "Accept-Encoding": "gzip, deflate, br", 
       "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8", 
       "Cache-Control": "max-age=0", 
       "Cookie": "io=wgWEKuHzooHPp2eDAAAA", 
       "Dnt": "1", 
       "Host": "localhost", 
       "Upgrade-Insecure-Requests": "1", 
       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36 Avast/75.0.1447.80"
     }, 
     "origin": "84.195.139.40, 84.195.139.40", 
     "url": "https://localhost/get"
   }
   ```  
   Since the httpbin is an external endpoint, my WAN IP address will be inside the "origin" field ...

### URL
This URL refers to the target host system, to which the http(s) requests need to be forwarded.

### Timeout in
The timeout (in milliseconds) for the incoming connection.

### Timeout out
The timeout (in milliseconds) for the outgoing connection.

### Add authentication credentials
When this option is selected, the basic authentication credentials can be entered:

![image](https://user-images.githubusercontent.com/14224149/61108073-b2dbda80-a481-11e9-8613-733fdf90617d.png)

As a result, an 'Authorization' http header will be added to the target request.  This header field will contain the literal "Basic " followed by the (base64 encoded) username and password:
```json
{
  "args": {}, 
  "headers": {
    ... 
    "Authorization": "Basic bXlfdXNlcl9uYW1lOm15X3Bhc3N3b3Jk", 
    ...
}
```

### Change origin of the host header to the target URL
TODO

### Keep letter case of response header key
TODO

### Rewrite the location hostname on redirects
TODO

### Verify SSL certificates
Enable validation of the SSL certificate chain that will be received from the target host. 

Caution: Normally this option won't be selected, because self-signed certificates will be rejected by this test!  In that case you would receive an ```UNABLE_TO_VERIFY_LEAF_SIGNATURE``` error ...

### Follow redirects
TODO

### Pass the absolute URL as path (proxying to proxy)
TODO

### Add X-FORWARD headers
TODO

## TODO's
+ This is an experimental node, so I have to add all kind of options (see list [here](https://github.com/http-party/node-http-proxy#options)).
+ When the resource cannot be found, a 404 error will occur as expected.  However the URL of the target host appears in the browser, but we would like the URL of the Node-RED host to appear ... 
+ Implement timeout handling
