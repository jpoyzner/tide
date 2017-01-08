var http = require('http');
var tickers = require('./tickers');
var movements = {};

var getStock = function(tickerIndex, callback) {
	if (tickerIndex >= tickers.length) {
		callback();
		return;
	}
	
	var ticker = tickers[tickerIndex].ticker;
	http.get({host: 'www.google.com', port: 80, path: '/finance/info?client=ig&q=' + ticker}, function(response) {
		response.setEncoding('utf8');
		var data = "";
					
		response.on('data', function(chunk) {
			data += chunk;
		});
		
		response.on('end', function() {
			if (data.length > 0) {
				try {
					var data_object = JSON.parse(data.substring(3));
				} catch(e) {
					callback(0, 0, {});
					return;
				}
				
				var newPrice = Number(data_object[0].l_fix);
				console.log(ticker + " NEW PRICE: " + newPrice);
				var twentyAgo = new Date();
				twentyAgo -= 20 * 60000;
				http.get({host: 'www.google.com', port: 80, path: '/finance/getprices?x=NASDAQ&p=1d&i=60&ts=' + +twentyAgo + '&f=h&q=' + ticker}, function(response) {
						response.setEncoding('utf8');
						var data = "";
									
						response.on('data', function(chunk) {
							data += chunk;
						});
						
						response.on('end', function() {
							if (data.length > 0) {
								var lines = data.split('\n');
								var oldPrice = parseFloat(lines[lines.length - 2]);
							    console.log(ticker + " OLD PRICE: " + oldPrice);
							    movements[ticker] = (newPrice - oldPrice) / oldPrice;
							    console.log(ticker + " MOVEMENT: " + movements[ticker]);
								
								getStock(++tickerIndex, callback);
							} else {
								callback();
							}
						});
					});
			} else {
				callback();
			}
		});
	});
}	

getStock(0, function() {
	var gain = 0;
	var bestMover;
	var bestMovement = 0; //in percent
	
	tickers.forEach(function(ticker) {
		var movement = movements[ticker.ticker];
		//console.log(ticker.ticker + " MOVEMENT: " + movement + ", SOFAR: " + bestMovement);
		if (movement >= bestMovement) {
			bestMover = ticker.ticker;
			console.log("NEW BEST MOVER: " + ticker.ticker + ", MOVEMENT: " + movement);
		}
	});
	
	console.log("BEST MOVER: " + bestMover + ", MOVEMENT: " + bestMovement + "%");
});