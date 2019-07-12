/**
 * Copyright 2018 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
    var httpProxy = require('http-proxy');
    
    function ReverseProxyNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        
        node.proxyServer = httpProxy.createProxyServer({});
        
        node.proxyServer.on('error', function(err) {
            node.error(err);
        });
        
        debugger;
            
        var options = {
            target: config.url,
            //forward: config.url,
            // Avoid UNABLE_TO_VERIFY_LEAF_SIGNATURE for redirects to a server with self signed certificates.
            // See https://github.com/http-party/node-http-proxy/issues/1083
            secure: config.verifyCertificates,
            followRedirects: config.followRedirects,
            // The path in the original request (to Node-RED) shouldn't be appended to the forwarded URL.
            // E.g. when somebody uses http://<node-red-host>:1880/somepath, then 'somepath' shouldn't be appended to target url.
            ignorePath: true,
            changeOrigin: config.changeOrigin,
            preserveHeaderKeyCase: config.preserveHeaderKeyCase,
            verifyCertificates: config.verifyCertificates,
            followRedirects: config.followRedirects,
            toProxy: config.toProxy,
            // Keep the protocol (http or https) as specified in the target url
            protocolRewrite: null,
            xfwd: config.xfwd
        }
        
        if ((config.incomingTimeout || 0) > 0) {
            options.timeout = config.incomingTimeout;
        }
        
        if ((config.outgoingTimeout || 0) > 0) {
            options.proxyTimeout = config.outgoingTimeout;
        }
        
        // The credentials are available in this node instance, not in the config !
        if (node.credentials && node.credentials.user) {
            options.auth = node.credentials.user + ":" + (node.credentials.password || "");
        }
        
        node.on("input", function(msg) {
            // Redirect the http(s) request to the specified URL, and write the response (from that host)
            node.proxyServer.web(msg.req, msg.res._res, options);
        });

        node.on("close", function() {
            // TODO proxy server sluiten ???
        });
    }

    RED.nodes.registerType("reverse-proxy", ReverseProxyNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
}
