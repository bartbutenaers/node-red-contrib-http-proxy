# node-red-contrib-reverse-proxy
A Node-Red node to use Node-RED as a reverse proxy server, for redirecting http(s) requests

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-reverse-proxy
```

## Introduction

This is not a full blown reverse proxy, but a lightweight one which I developed for personal use.  The [node-http-proxy](https://github.com/http-party/node-http-proxy#options) library is used under the cover, which contains some extra funtionality.  Pull requests are always welcome!

### What is a reverse proxy?
A reverse proxy is a server that is put between a client and one or more other servers.  The reverse proxy intercepts all http(s) requests from that client, and decides to which server the request needs to be forwarded.  As soon as the server has responded, the reverse proxy will return the response to the client.  For the client it appears as if the reverse proxy itself is the origin of the response, i.e. the client is not aware that his request has been forwarded to other servers ...

![Introduction](https://user-images.githubusercontent.com/14224149/61167801-10386000-a544-11e9-90d4-0679f230b5ca.png)

### Why using a reverse proxy?
There are a number of advantages for adding a reverse proxy in between:
+ Hide your intern network from external clients.  The client communicates only with your reverse proxy, and he is not aware which and how many servers you are running.
+ Add some extra security to check which client is allowed to access which target server.
+ Improve performance and reliability by doing load balancing.  Indeed the reverse proxy can choose to which target server a request will be send.
+ ...

I decided to develop this node, since I had some issues to display IP camera images in my Node-RED dashboard:
+ When you want an ```img``` tag to display images from an IP camera, but the camera uses basic authentication.  But you don't want to store the credentials (username/password) in your dashboard template node, because then your credentials would be send to your browser as plain text (which is very unsecure).  So avoid stuff like this:
   ```
   <img src="https://<username>:<password>@<ip cam hostname>/<some path>">
   ```
   You could solve this, by implementing it like this:
   1. Create a dashboard template node, containing an image that will get its data from Node-RED (instead of directly from your IP camera):
      ```
      <img src="https://<node-red hostname>:1880/<some path>">
      ```
   1. Via a http-in node, this request will be send to the reverse-proxy node (see example flow below).
   1. The reverse-proxy node will add your credentials (which are stored securely in Node-RED) and forward your request to your IP camera.
   1. The 'img' element will get the camera image and display it.
+ When trying to get image data from my IP camera's in the Node-RED dashboard, security exceptions will prevent this.  Indeed modern browsers support [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (Cross-Origin Resource Sharing).  That mechanism prevents you to access resources from a server at a different origin.  In other words you can only send http(s) requests to your Node-RED hostname (where your dashboard application is hosted), but not from other target servers.  Unless such a target server adds a Access-Control-Allow-Origin header variable to its response, which tells your browser that it is allowed to give you access to that response.  There is no way to circumvent this (copyright protection) system, so my dashboard needs to access the IP cameras via the Node-RED hostname.  This can easily be implement by using this reverse-proxy node.

### The standard Node-RED solution
Node-RED provides some nodes out-of-the-box, which can be used to turn your flow into a reverse proxy:

![Standard nodes](https://user-images.githubusercontent.com/14224149/61157366-3fc07b80-a4f6-11e9-8bf8-141720d4849b.png)

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

![Proxy in Node-RED](https://user-images.githubusercontent.com/14224149/61160537-07259f80-a500-11e9-9567-2fa0e6d17894.png)

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

   ![Stream example](https://user-images.githubusercontent.com/14224149/60925124-19ef6880-a2a3-11e9-8fdd-fede83adc291.png)
   
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

![test flow](https://user-images.githubusercontent.com/14224149/61107320-f33a5900-a47f-11e9-8e33-c42e8b0c6040.png)

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
       "Host": "<ip address from your original http request>", 
       "Upgrade-Insecure-Requests": "1", 
       "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36 Avast/75.0.1447.80"
     }, 
     "origin": "84.195.139.40, 84.195.139.40", 
     "url": "https://<ip address from your original http request>/get"
   }
   ```  
   Since the httpbin is an external endpoint, my WAN IP address will be inside the "origin" field ...

### URL
This URL refers to the target host system, to which the http(s) requests need to be forwarded.

When the URL is not specified in the config screen, it needs to be specified in the input message as ```msg.url```:

![msg.url](https://user-images.githubusercontent.com/14224149/61331030-51b95b80-a821-11e9-9aa9-81532a03a4d5.png)

```
[{"id":"28c11aa6.a36ac6","type":"http in","z":"8bb35f74.82618","name":"","url":"/url_test","method":"get","upload":false,"swaggerDoc":"","x":470,"y":1020,"wires":[["f1d3e8e3.21c4e8"]]},{"id":"f1d3e8e3.21c4e8","type":"change","z":"8bb35f74.82618","name":"","rules":[{"t":"set","p":"url","pt":"msg","to":"https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":670,"y":1020,"wires":[["471f0190.38cac"]]},{"id":"471f0190.38cac","type":"reverse-proxy","z":"8bb35f74.82618","name":"Reverse proxy without URL","url":"","incomingTimeout":0,"outgoingTimeout":0,"changeOrigin":false,"preserveHeaderKeyCase":false,"verifyCertificates":false,"followRedirects":false,"toProxy":false,"xfwd":false,"x":920,"y":1020,"wires":[]}]
```

### Timeout in
The timeout (in milliseconds) for the incoming connection.  A timeout of ```0``` means no timeout, i.e. the proxy will keep waiting.

### Timeout out
The timeout (in milliseconds) for the outgoing connection.  A timeout of ```0``` means no timeout, i.e. the proxy will keep waiting.

### Add authentication credentials
When this option is selected, the basic authentication credentials can be entered:

![credentials](https://user-images.githubusercontent.com/14224149/61108073-b2dbda80-a481-11e9-8613-733fdf90617d.png)

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
The target server should use the same hostname as the reverse-proxy (when available to the public web), otherwise the hostname/ipaddress of the target server might become visible to the enduser.  For example when somebody requests a non-existing page, the target server will return a error page containing the real ip address of the resource:

![image](https://user-images.githubusercontent.com/14224149/61180457-e00dc180-a616-11e9-82ad-b7d5ed3f4963.png)

This option is deselected by default, which means both 'host' and 'url' contain the hostname/ipaddress of the original http request (i.e. the IP address of your Node-RED host):
```json
{
  "args": {}, 
  "headers": {
    ... 
    "Host": "<ip address from your original http request>", 
    ...
  }, 
  ...
  "url": "https://<ip address from your original http request>/get"
}
```

When this option is selected, both 'host' and 'url' will contain the hostname/ipaddress of the target host:
```json
{
  "args": {}, 
  "headers": {
    ...
    "Host": "httpbin.org", 
    ...
  }, 
  ...
  "url": "https://httpbin.org/get"
}
```
Remark: The 'host' header variable tells the webserver which virtual host to use.  Activate this option for [name-based virtual hosted sites](https://en.wikipedia.org/wiki/Virtual_hosting#Name-based), which use multiple host names for the same IP address.  When one of those hostnames is included in the http request, the target server (which hosts multiple sites) will be able to respond the corresponding content.

### Keep letter case of response header key
If not selected, the keys of the http header variables will be converted to lowercase.

### Verify SSL certificates
Enable validation of the SSL certificate chain that will be received from the target host. 

Caution: Normally this option won't be selected, because self-signed certificates will be rejected by this test!  In that case you would receive an ```UNABLE_TO_VERIFY_LEAF_SIGNATURE``` error ...

### Follow redirects
When selected, the request will be redirected in case the response has status 3xx.  A 'location' header is required, otherwise no redirection is possible...

### Pass the absolute URL as path (proxying to proxy)
Normally the http request 'path' contains the relative path from the URL.  So it does not include any query/URL parameters, in contradiction to the http request 'uri' field ( which contains the full absolute URL).
   
E.g. when *"url"* is *"http://domain.com/foo/bar"*, then the proxy will fill the http request *"path"* with *"foo/bar"*

When this option is selected, the absolute URL (part of the 'url' field) will be used as the path.  

E.g. when *"url"* is *"http://domain.com/foo/bar"*, then the proxy will fill the http request *"path"* with *"/http://domain.com/foo/bar"*

This is useful for proxying to proxies.

### Add X-FORWARD headers
Some target hosts might require an XFH header to be send in the request, to determine which host originally has send the request.  
```json
{
  "args": {}, 
  "headers": {
    ...
    "X-Forwarded-Host": "<ip address from original request>:1880",
    ...
  }, 
}
```
Indeed when a request is forwarded by one or more proxy servers, the target host can only see (via the 'origin') the *last* server hostname/ipaddress.  The XFH header contains a (comma separated list) of *all* hostnames/ipaddresses, which allows the target host to determine the route that the request has traversed:
   *"<client ip address>, <proxy 1 ip address>, <proxy 2 ip address> ..."*

Remark: always be aware that the content of this field might be incomplete or incorrect ...

## Error handling
In this example flow, the reverse-proxy node doesn't have an URL:

![error flow](https://user-images.githubusercontent.com/14224149/61329536-d4401c00-a81d-11e9-88fe-fcf8c4f2a4e3.png)

```
[{"id":"10e09af3.174bf5","type":"http in","z":"8bb35f74.82618","name":"","url":"/no_url_test","method":"get","upload":false,"swaggerDoc":"","x":560,"y":1160,"wires":[["2c4712b9.794fee"]]},{"id":"95353a94.3e3ac8","type":"catch","z":"8bb35f74.82618","name":"Catch reverse proxy errors","scope":["471f0190.38cac"],"x":530,"y":1220,"wires":[["1bab7886.288597"]]},{"id":"1bab7886.288597","type":"debug","z":"8bb35f74.82618","name":"Reverse proxy errors","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":800,"y":1220,"wires":[]},{"id":"2c4712b9.794fee","type":"reverse-proxy","z":"8bb35f74.82618","name":"Reverse proxy without URL","url":"","incomingTimeout":0,"outgoingTimeout":0,"changeOrigin":false,"preserveHeaderKeyCase":false,"verifyCertificates":false,"followRedirects":false,"toProxy":false,"xfwd":false,"x":820,"y":1160,"wires":[]}]
```

An unexpected error will occur, resulting in following actions:
1. A Node-RED error will be raised, which can be intercepted using the Catch-node:

   ![catch error](https://user-images.githubusercontent.com/14224149/61330116-32b9ca00-a81f-11e9-9099-4706d882a162.png)
   
1. An internal server error (status 500) will be returned to the client:

   ![server error](https://user-images.githubusercontent.com/14224149/61330289-917f4380-a81f-11e9-9ed3-7a3d05860933.png)

1. The connection will be closed, to avoid that the client keeps waiting for an answer.

## Performance
All the data chunks in the http response (arriving from the target server), need to be passed via the proxy to original response (handled by the http-in node).  This means a lot of data needs to be handled, for example all images in an Mjpeg steam.  

Let's use the Mjpeg stream (see example flow in the "Node Usage" paragraph), to get a basic idea of the performance.  The stream contains about 11 images per second at a resolution of 640x480.  As soon as the proxy starts handling the stream, there is almost no extra CPU being used on my Raspberry PI 3:

![image](https://user-images.githubusercontent.com/14224149/61189488-6f09f080-a68e-11e9-86ec-394b6ba19886.png)

Remarks:
+ The Y-axis contains a percentage of the overal CPU usage (i.e. a sum of the 4 cores).
+ Of course there is ***NO processing*** of the data chunks involved, since the Mjpeg stream is decoded (into separate images) in the dashboard (i.e. in the browser and not on my Raspberry).
