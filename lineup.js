var penalty = false;

var roster = [
	{name: 'Carpenter', plays: ['SO', 'FO', 'SO', 'FO']},
	{name: 'Pham', plays: ['GO', 'SO', 'GO', 'GO']},
	{name: 'DeJong', plays: ['BB', 'SO', '1BB', 'HR']},
	{name: 'Gyorko', plays: ['GO', 'SO', 'GO', 'GO']},
	{name: 'Martinez', plays: ['2B', 'GO', 'SO', 'HR']},
	{name: 'Wong', plays: ['1B', 'HR', 'GO', 'GO']},
	{name: 'Grichuk', plays: ['SO', '2B', '2B', 'GO']},
	{name: 'Kelly', plays: ['GO', 'SO', 'SO', 'SO']},
	{name: 'Wacha', plays: ['HR', 'GO', '1B', 'HR']},
];

var bases, runs, outs, inning;

function run(player, play) {
	//console.log(player + " UP")
	bases[0] = player;

	switch(play) {
		case '1B':
			//console.log('SINGLE!');
			advance([1, 1, 1, 1]);
			break;
		case '1BB':
			//console.log('BIG SINGLE!');
			advance([1, 2, 2, 2]);
			break;
		case '2B':
			//console.log('DOUBLE!');
			advance([2, 2, 2, 2]);
			break;
		case '3B':
			//console.log('TRIPLE');
			advance([3, 3, 3, 3]);
			break;
		case 'HR':
			//console.log('TRIPLE');
			advance([3, 3, 3, 3]);
			break;
		case 'BB':
			//console.log('WALK');
			
			var advance1, advance2, advance3;
			if (bases[1]) {
				advance1 = 1;
				if (bases[2]) {
					advance2 = 1;
					if (bases[3]) {
						advance3 = 1;
					}
				}
			}
			advance([1, advance1, advance2, advance3]);

			break;
		case 'SO':
			//console.log('STRIKEOUT');
			out();
			break;
		case 'DF':
			//console.log('DEEP FLY');
			if (out()) {
				advance([0, 0, 0, 1]);
			}

			break;
		case 'FO':
			//console.log('FLY OUT');
			out();
			break;
		case 'GO':
			case 'SO':
			//console.log('GROUND OUT');
			out();
			break;
	}

	for (var i = 1; i < 4; i++) {
		if (bases[i]) {
			//console.log(i + 'B: ' + bases[i]);
		}
	}

	//console.log("OUTS: " + outs + "\n");
}

function advance(baseRuns) {
	if (baseRuns[3]) {
		score(3);
	}

	if (baseRuns[2] >= 2) {
		score(2);
	} else if (baseRuns[2] === 1) {
		move(2, 3)
	}

	if (baseRuns[1] >= 3) {
		score(1);
	} else if (baseRuns[1] === 2) {
		move(1, 3)
	} else if (baseRuns[1] === 1) {
		move(1, 2)
	}

	if (baseRuns[0] === 4) {
		score(0);
	} else {
		move(0, baseRuns[0])
	}
}

function score(fromBase) {
	if (!bases[fromBase]) {
		return;
	}

	//console.log(bases[fromBase] + " SCORES!");
	runs++;

	bases[fromBase] = null;
}

function move(fromBase, toBase) {
	bases[toBase] = bases[fromBase];
	bases[fromBase] = null;
}

function out() {
	outs++;

	if (outs === 3) {
		for (var i = 0; i < bases.length; i++) {
			bases[i] = null;
		}

		//console.log("INNING " + inning + " OVER!");
		//console.log("RUNS SCORED: " + runs);

		inning++;
		outs = 0;
		return false;
	}

	return true;
}


var orders = roster[roster.length - 1].plays.length;

var lineup = [];
for (var slot = 0; slot < roster.length; slot++) {
	lineup.push(slot);
}

var permArr = [],
  usedChars = [];

function permute(input) {
  var i, ch;
  for (i = 0; i < input.length; i++) {
    ch = input.splice(i, 1)[0];
    usedChars.push(ch);
    if (input.length == 0) {
      permArr.push(usedChars.slice());
    }
    permute(input);
    input.splice(i, 0, ch);
    usedChars.pop();
  }
  return permArr
};

var lineupResults = [];
var mostRuns = 0;
permute(lineup).forEach(function(perm) {
	var permRoster = [];
	for (var i = 0; i < perm.length; i++) {
		permRoster.push(roster[perm[i]]);
	}

	resetGame();
	for (var i = 0; i < orders; i++) {
		permRoster.forEach(function(player) {
			run(player.name, player.plays[i]);
		});

		if (penalty) {
			out();
		}
	}
	//console.log("TOTAL RUNS SCORED FOR " + perm + ": " + runs);

	mostRuns = Math.max(mostRuns, runs);

	lineupResults.push({
		lineup:
			permRoster.map(function(player, index) {
				return player.name;
			}),
		runs: runs});
});

function resetGame() {
	bases = Array(4);
	runs = 0;
	outs = 0;
	inning = 1;
}

var bestLineups =
	lineupResults.sort(function(resultA, resultB) {
	  	return resultA.runs - resultB.runs;
	}).filter(function(result) {
		return result.runs === mostRuns;
	});

var slots = Array(roster.length);
bestLineups.forEach(function(result) {
	console.log(result.lineup.join(" ") + ": " + result.runs);

	result.lineup.forEach(function(player, index) {
		if (!slots[index]) {
			slots[index] = {};
		}

		if (!slots[index][player]) {
			slots[index][player] = 0;
		}

		slots[index][player]++;
	});
});

console.log(slots);
console.log("OPTIMAL LINEUP:");
slots.forEach(function(slot) {
	var bestPlayer, occurences = 0;
	Object.keys(slot).forEach(function(player) {
		if (slot[player] > occurences) {
			bestPlayer = player;
			occurences = slot[player];
		}
	});
	console.log(bestPlayer);
});


