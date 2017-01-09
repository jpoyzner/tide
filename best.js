var http = require('http');
var fs = require('fs');
var tickers = require('./tickers');
var newPrices = {};
var oldPrices = {};

const MAX_MOVE = 0.016;

module.exports = {
	getBest: function(pageRes) {
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
						if (pageRes) {
							pageRes.write(".");
						}
						
						newPrices[ticker] = newPrice;
						getStock(++tickerIndex, callback);
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
					console.log(err);
					if (pageRes) {
						pageRes.write(err);
					}
					
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
		    		if (pageRes) {
		    			pageRes.write(".");
					}
		    		
		    		var oldPrice = oldPrices[ticker] || 0
		    		
		    		console.log(ticker + " OLD PRICE: " + oldPrice);
		    		if (pageRes) {
		    			pageRes.write(".");
					}
		    		
		    		var movement = (newPrice - oldPrice) / oldPrice;
		    		
		    		console.log(ticker + " MOVEMENT: " + movement + ", BEST SO FAR: " + bestMovement * 100 + "%");
		    		if (pageRes) {
		    			pageRes.write(".");
					}
		    		
		    		if (movement > bestMovement && movement < MAX_MOVE) {
		    			bestMover = ticker;
		    			bestMovement = movement;
		    			
		    			console.log("NEW BEST MOVER: " + ticker + ", MOVEMENT: " + movement);
		    			if (pageRes) {
		    				pageRes.write(".");
						}
		    		}
		    	});
		    	
		    	if (bestMover) {
		    		console.log("\nBUY: " + bestMover + " ON MOVEMENT: " + bestMovement * 100 + "%");
		    		if (pageRes) {
		    			pageRes.write("\nBUY: " + bestMover + " ON MOVEMENT: " + bestMovement * 100 + "%" + "\n");
					}
		    	} else {
		    		console.log("\nSELL EVERYTHING!!!");
		    		if (pageRes) {
		    			pageRes.write("\nSELL EVERYTHING!!!" + "\n");
					}
		    	}
		    	
		    	fs.writeFile("prices.txt", formatPrices(), function(err) {
		    	    if (err) {
		    	        console.log(err);
		    	        if (pageRes) {
		    	        	pageRes.write(err);
						}
		    	    }
		    	    
		    	    pageRes.end();
		    	});
		    });
		});
	}
};