require('http').createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  require('./best').getBest(response);
}).listen(8081);

console.log("Server running");