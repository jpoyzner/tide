var http = require('http');
var fs = require('fs');
var tickers = require('./tickers');
var newPrices = {};
var oldPrices = {};

const MAX_MOVE = 0.016;

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
				newPrices[ticker] = newPrice;
				getStock(++tickerIndex, callback);
				
//				var twentyAgo = new Date();
//				twentyAgo -= 20 * 60000;
//				http.get({host: 'www.google.com', port: 80, path: '/finance/getprices?x=NASDAQ&p=1d&i=60&ts=' + +twentyAgo + '&f=h&q=' + ticker}, function(response) {
//						response.setEncoding('utf8');
//						var data = "";
//									
//						response.on('data', function(chunk) {
//							data += chunk;
//						});
//						
//						response.on('end', function() {
//							if (data.length > 0) {
//								var lines = data.split('\n');
//								var oldPrice = parseFloat(lines[lines.length - 2]);
//							    console.log(ticker + " OLD PRICE: " + oldPrice);
//							    movements[ticker] = (newPrice - oldPrice) / oldPrice;
//							    console.log(ticker + " MOVEMENT: " + movements[ticker]);
//								
//								getStock(++tickerIndex, callback);
//							} else {
//								callback();
//							}
//						});
//					});
			} else {
				callback();
			}
		});
	});
}

function formatPrices() {
	var output = "";
	Object.keys(newPrices).forEach(function(ticker) {
		output += ticker + " " + newPrices[ticker] + "|";
	});	
	return output;
}

function readPrices(callback) {
	fs = require('fs')
	fs.readFile('prices.txt', 'utf8', function (err, data) {
		if (err) {
			console.log(err)
			callback();
			return;
		}
	  
	  	oldPrices = {};
		data.split('|').forEach(function(price) {
			var priceParts = price.split(' ');
			oldPrices[priceParts[0]] = priceParts[1];
		});
		
		callback();
	});
}

getStock(0, function() {  
    readPrices(function() {
    	var gain = 0;
    	var bestMover;
    	var bestMovement = 0; //in percent
    	
    	Object.keys(newPrices).forEach(function(ticker) {
    		var newPrice = newPrices[ticker] || 0;
    		console.log(ticker + " NEW PRICE: " + newPrice);
    		var oldPrice = oldPrices[ticker] || 0
    		console.log(ticker + " OLD PRICE: " + oldPrice);
    		var movement = (newPrice - oldPrice) / oldPrice;
    		console.log(ticker + " MOVEMENT: " + movement + ", BEST SO FAR: " + bestMovement * 100 + "%");
    		if (movement > bestMovement && movement < MAX_MOVE) {
    			bestMover = ticker;
    			bestMovement = movement;
    			console.log("NEW BEST MOVER: " + ticker + ", MOVEMENT: " + movement);
    		}
    	});
    	
    	if (bestMover) {
    		console.log("\nBUY: " + bestMover + " ON MOVEMENT: " + bestMovement * 100 + "%");
    	} else {
    		console.log("\nSELL EVERYTHING!!!")
    	}
    	
    	fs.writeFile("prices.txt", formatPrices(), function(err) {
    	    if (err) {
    	        return console.log(err);
    	    }

    	    //console.log("The file was saved!");
    	});
    });
});