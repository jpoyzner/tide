//http://www.networkerror.org/component/content/article/1-technical-wootness/44-googles-undocumented-finance-api.html

var http = require('http');
var tickers = require('./tickers');

//var googleFinance = require('google-finance');
//
//var date = new Date();
//date.setHours(6);
//date.setMinutes(30);
//date.setDate(6);
//
//var endDate = new Date();
//endDate.setHours(13);
//endDate.setMinutes(30);
//endDate.setDate(6);


//USING NASDAQ 100:

/*
 * FRIDAY
 * 1min: 1.2%
 * 2min: 3.1%
 * 5min: 1.18%
 * 10min: 0.7%
 * 15min: -0.3%
 * 20min: 2.2%
 * 25min: 1.9%
 * 30min: -.9%
 * 60min: 0.9%
 */

/*
 * 3 weeks, 1 stock
 * 1min: 12.2%
 * 2min: 29.1%
 * 5min: 38.6%
 * 10min: 30.4%
 * 15min: 29.5%
 * 20min: 32.6%
 * 25min: 25.4%
 * 30min: 7.3%
 * 60min: -4%
 * 2hours: -6.7%
 */

/*
 * 3 weeks, 2 stocks
 * 1min: 20.3%
 * 2min: 41.3%
 * 5min: 33.1%
 * 10min: 17%
 * 15min: 22%
 * 20min: 25.5%
 * 25min: 18.1%
 * 30min: 7.3%
 * 60min: 2.6%
 * 2hours: 0.04%
 */

/*
 * 3 weeks, 3 stocks
 * 1min: 27.8%?
 * 2min: 43.9%
 * 5min: 29.5% 
 * 10min: 18.3%
 * 15min: 18.3%
 * 20min: 19.1%
 * 25min: 15%
 * 30min: 5.6%
 */

/*
 * 3 weeks, 4 stocks
 * 1min: 32.4%
 * 2min: 43.5%
 * 5min: 28.4%
 * 10min: 15.9%
 * 15min: 14.4%
 * 20min: 
 * 25min: 
 * 30min: 
 */

/*
 * 3 weeks, 5 stocks
 * 1min: 35.2%
 * 2min: 43.2%
 * 5min: 26.3%
 * 10min: 18.6%
 * 15min: 13.7%
 * 20min: 
 * 25min: 
 * 30min: 
 */

var totalMins = 4922 * 60;
var timeFrame = 20 * 60;

var history = {};

var getStock = function(tickerIndex, callback) {
	if (tickerIndex >= tickers.length) {
		callback();
		return;
	}
	
	var ticker = tickers[tickerIndex].ticker;
	history[ticker] = [];
	
	http.get({host: 'www.google.com', port: 80, path: '/finance/getprices?x=NASDAQ&i=' + timeFrame + '&p=15d&f=h&q=' + ticker}, function(response) {
	//googleFinance.historical({symbol: ticker, from: date}, function(err, quotes) {
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
				
				//date.setMinutes(date.getMinutes() + 1);
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
		

		console.log("SLICE " + i + " ---------------------------------------------------------")
		tickers.forEach(function(ticker) {
			var price = history[ticker.ticker][i];
			if (i > 0) {
				bestMovers.push(ticker.ticker);
				
				bestMovers.sort(function(a, b) {
					var lastPriceA = history[a][i - 1];
					var lastPriceB = history[b][i - 1];
					return (history[b][i] - lastPriceB) / lastPriceB - (history[a][i] - lastPriceA) / lastPriceA;
				});
				
				bestMovers = bestMovers.slice(0, 1);
			}
		});
		
		var avgMovement = 0;
		bestMovers.forEach(function(bestMover) {
			var lastPrice = history[bestMover][i - 1];
			avgMovement += (history[bestMover][i] - lastPrice) / lastPrice;
		});
		
		console.log("NEW BEST MOVERS: " + bestMovers.join(',') + ", MOVEMENT: " + (avgMovement / bestMovers.length * 100) + "%");
		console.log("---->RUNNING GAIN: " + (gain * 100) + "%");
	}
});