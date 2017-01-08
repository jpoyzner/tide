//http://www.networkerror.org/component/content/article/1-technical-wootness/44-googles-undocumented-finance-api.html

var http = require('http');
var tickers = require('./tickers'); //USING NASDAQ 100

const MINUTE_INTERVAL = 20;
const MAX_MOVE = 0.016;
const NUM_STOCKS = 1;

var totalMins = 4922 * 60; //TODO: can this change?
var timeFrame = MINUTE_INTERVAL * 60;

var history = {};

var getStock = function(tickerIndex, callback) {
	if (tickerIndex >= tickers.length) {
		callback();
		return;
	}
	
	var ticker = tickers[tickerIndex].ticker;
	history[ticker] = [];
	
	http.get({host: 'www.google.com', port: 80, path: '/finance/getprices?x=NASDAQ&i=' + timeFrame + '&p=15d&f=h&q=' + ticker}, function(response) {
		response.setEncoding('utf8');
		var data = "";
					
		response.on('data', function(chunk) {
			data += chunk;
		});
		
		response.on('end', function() {
			console.log("GETTING: " + ticker);
			
			if (data.length > 0) {
				var lines = data.split('\n');
			    for(var line = 7; line < lines.length; line++){
			    	history[ticker].push(parseFloat(lines[line]));
			    }
				
				getStock(++tickerIndex, callback);
			} else {
				callback();
			}
		});
	});
}	

getStock(0, function() {
	var gain = 0;
	var bestMovers = [];
	var bestMovement;
	
	for (var i = 0; i < totalMins / timeFrame; i++) {
		if (bestMovers.length && i > 0) {
			var gainTotal = 0; 
			bestMovers.forEach(function(bestMover) {
				var lastPrice = history[bestMover][i - 1];
				gainTotal += (history[bestMover][i] - lastPrice) / lastPrice;
			})
			
			gain += gainTotal / bestMovers.length;
		}
		
		bestMovement = 0; //in percent
		
		console.log("OLD BEST MOVERS: " + bestMovers.join(',') + ", GAINED: " + (gainTotal / bestMovers.length * 100) + "%");
		
		bestMovers.forEach(function(bestMover) {
			console.log(bestMover + " PRICE: " + history[bestMover][i]);
		});
		
		console.log("SLICE " + i + " ---------------------------------------------------------")
		tickers.forEach(function(ticker) {
			var price = history[ticker.ticker][i];
			if (i > 0) {
				var oldPrice = history[ticker.ticker][i - 1]
				if ((price - oldPrice) / oldPrice < MAX_MOVE) {
					bestMovers.push(ticker.ticker);
					
					bestMovers.sort(function(a, b) {
						var lastPriceA = history[a][i - 1];
						var lastPriceB = history[b][i - 1];
						return (history[b][i] - lastPriceB) / lastPriceB - (history[a][i] - lastPriceA) / lastPriceA;
					});
					
					bestMovers = bestMovers.slice(0, NUM_STOCKS);
				}
			}
		});
		
		var avgMovement = 0;
		bestMovers.forEach(function(bestMover) {
			var lastPrice = history[bestMover][i - 1];
			avgMovement += (history[bestMover][i] - lastPrice) / lastPrice;
		});
		
		console.log("NEW BEST MOVERS: " + bestMovers.join(',') + ", MOVEMENT: " + (avgMovement / bestMovers.length * 100) + "%");
		
		bestMovers.forEach(function(bestMover) {
			console.log(bestMover + " PRICE: " + history[bestMover][i]);
		});
		
		console.log("--------------------------------------------------------------------->RUNNING GAIN: " + (gain * 100) + "%");
	}
});