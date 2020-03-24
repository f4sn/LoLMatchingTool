var game_match = []
var goodgame
function simulate(){
	var names = $('[name=name]') //.value
	var rates = $('[name=rate]') //.selectedIndex
	var lane1 = $('[name=lane1]')
	var lane2 = $('[name=lane2]')
	var summos = []
	var rate_list = [800, 1000, 1100, 1150, 1200,
									1250, 1300, 1350, 1400, 1450,
									1500, 1550, 1600, 1650, 1700,
									1750, 1800, 1850, 1900, 1950,
									2000, 2050, 2100, 2150, 2200,
									2300, 2400]
	for(var i=0; i < 10; i++){
		var sumo = {}
		var r = parseInt(rates[i].selectedIndex)
		var lane = [lane1[i].selectedIndex, lane2[i].selectedIndex]

		sumo.name = names[i].value
		sumo.rate = parseInt(rate_list[r])
		sumo.rate_str = rates[i].value

		var lane_list = ["TOP", "JG", "MID", "ADC", "SUP", "FILL"]
		var lane_str = []

		for(var j=0; j<2; j++){
			lane_str.push(lane_list[lane[j]])
		}

		sumo.lane = lane_str
		sumo.decided_lane = ""

		summos.push(sumo)
	}

	red_list = (Combinatorics.combination([0,1,2,3,4,5,6,7,8,9], 5)).toArray()
	blue_list = []
	for(var i=0;i<red_list.length;i++){
		blue_list[i] = [0,1,2,3,4,5,6,7,8,9]
		for(var j=0; j<red_list[i].length; j++){
			var idx = blue_list[i].indexOf(red_list[i][j])
			if (idx >= 0){
				blue_list[i].splice(idx, 1)
			}
		}
	}
	var team_rate_avg = 0.0
	for(var i = 0; i<10; i++){
		team_rate_avg += summos[i].rate / 2.0
	}
	game_match = []

	for(var i = 0; i < red_list.length; i++){
		var game = {}
		var red_team = {}
		var blue_team = {}
		red_team.rate = {}
		blue_team.rate = {}
		game.rate = team_rate_avg
		red_team.index = red_list[i]
		blue_team.index = blue_list[i]
		red_team.player = []
		blue_team.player = []
		red_team.rate.avg = 0.0
		blue_team.rate.avg = 0.0
		for(var j = 0; j<5; j++){
			red_team.player.push(summos[red_team.index[j]])
			blue_team.player.push(summos[blue_team.index[j]])
			red_team.rate.avg += red_team.player[j].rate / 5.0
			blue_team.rate.avg += blue_team.player[j].rate / 5.0
		}
		red_team.rate.sum = red_team.rate.avg * 5
		blue_team.rate.sum = blue_team.rate.avg * 5
		red_team.rate.variance = 0 //分散
		blue_team.rate.variance = 0
		for(var j=0; j<5; j++){
			red_team.rate.variance += Math.pow(red_team.player[j].rate - red_team.rate.avg ,2)
			blue_team.rate.variance += Math.pow(blue_team.player[j].rate - blue_team.rate.avg ,2)
		}
		game.red = red_team
		game.blue = blue_team
		game_match.push(game)
	}

	sort_by_rate(game_match)

	goodgame = lane_optimization(game_match)
	var stack
	if (goodgame.red.rate.sum < goodgame.blue.rate.sum) {
			stack = goodgame.blue
			goodgame.blue = goodgame.red
			goodgame.red = stack
	}
	draw(goodgame)
}

function sort_by_rate(game){
	game.sort(function(prev,next){
		var rate_bias = 1
		var variance_bias = 0.5 //最大分散に対する有効割合 1.00のとき、最大分散を基準にレート差割合と50%50%になる
		var variance_base = 400000 //最大分散のおおよそ

		var prev_rate_diff = Math.abs(prev.red.rate.sum - prev.rate) * rate_bias //平均からの差
		var prev_variance_diff = Math.abs(prev.red.rate.variance - prev.blue.rate.variance) * variance_bias * prev_rate_diff / variance_base
		var p_point = prev_rate_diff + prev_variance_diff

		var next_rate_diff = Math.abs(next.red.rate.sum - next.rate) * rate_bias
		var next_variance_diff = Math.abs(next.red.rate.variance - next.blue.rate.variance) * variance_bias * prev_rate_diff / variance_base
		var n_point =  next_rate_diff + next_variance_diff

		if(p_point < n_point) return -1
		if(p_point > n_point) return 1
		if(p_point == n_point){
			if(Math.random() < 0.5){
				return 1
			}
			else
			{
				return -1
			}
		}
		return 0
	})
}

function lane_optimization(list){
	var battle_bias = 1.0
	var matching_bias = 2.0
	var weak_team_bias = 1.1
	var strong_team_bias = 1.0

	var main_bias = 1.0
	var sub_bias = 0.8
	var other_bias = 0.6

	var main_match_point = 100
	var sub_match_point = 60

	var max_index = 0
  var	max_score = -100000
	var l = ["TOP", "JG", "MID", "ADC", "SUP"]
	for(var i = 0; i < list.length; i++){
		for(var j = 0; j < Math.pow((list.length-i)/4, 2); j++){
			var team = list[i]
			var r_a = randIntArray(0,4)
			var b_a = randIntArray(0,4)
			var battle_score = 0
			for(var k = 0; k < 5; k++){
				var b_match_score = 0
				var r_match_score = 0
				var rate_score = 0
				var r_p = team.red.player[k]
				var b_p = team.blue.player[k]
				var r_lane = l[r_a[k]]
				var b_lane = l[b_a[k]]
				var r_f = 0
				var b_f = 0
				if (r_p.lane[0] == r_lane || r_p.lane[0] == "FILL"){
					r_match_score += main_match_point
					r_f = 2
				}else if (r_p.lane[1] == r_lane || r_p.lane[1] == "FILL"){
					r_match_score += sub_match_point
					r_f = 1
				}
				if (b_p.lane[0] == b_lane || b_p.lane[0] == "FILL"){
					b_match_score += main_match_point
					b_f = 2
				}else if (b_p.lane[1] == b_lane || b_p.lane[1] == "FILL"){
					b_match_score += sub_match_point
					b_f = 1
				}
				var r_rate = 0
				var b_rate = 0
				if (r_f == 2){
					r_rate = r_p.rate * main_bias
				} else if(r_f == 1){
					r_rate = r_p.rate * sub_bias
				}else{
					r_rate = r_p.rate * other_bias
				}
				if (b_f == 2){
					b_rate = b_p.rate	* main_bias
				} else if(b_f == 1){
					b_rate = b_p.rate * sub_bias
				}else{
					b_rate = b_p.rate * other_bias
				}

				rate_score += Math.abs(r_rate - b_rate)

				if (team.red.rate.sum > team.blue.rate.sum){
					r_match_score *= strong_team_bias
					b_match_score *= weak_team_bias
				}else if (team.red.rate.sum < team.blue.rate.sum){
					r_match_score *= weak_team_bias
					b_match_score *= strong_team_bias
				}else{
					r_match_score *= strong_team_bias
					b_match_score *= strong_team_bias
				}

				battle_score +=  (r_match_score + b_match_score) * matching_bias - rate_score * battle_bias
			}
			if (max_score < battle_score){
				max_score = battle_score
				max_index = i
				for(var k = 0; k < 5; k++){
					list[i].red.player[k].decided_lane = l[r_a[k]]
					list[i].blue.player[k].decided_lane = l[b_a[k]]
				}
			}
		}
	}
	sort_player_by_lane(list[max_index].red.player)
	sort_player_by_lane(list[max_index].blue.player)
	return list[max_index]
}

function sort_player_by_lane(player){
	player.sort(function(prev, next){
		var l = ["TOP", "JG", "MID", "ADC", "SUP"]
		p = l.indexOf(prev.decided_lane)
		n = l.indexOf(next.decided_lane)
		if (p < n) return -1
		if (p > n) return 1
		return 0
	})
}

function draw(gg){
	var red = $('#redteam')
	var blue = $('#blueteam')
	red.empty()
	blue.empty()
	var red_insert_text = ""
	var blue_insert_text = ""

	for(var i=0; i < 5; i++){
		blue_insert_text += `
		<h3>${gg.blue.player[i].name + " / " + gg.blue.player[i].rate_str}</h3>
		<h4>${gg.blue.player[i].decided_lane}</h4>
		<p></p>
		`
		red_insert_text += `
		<h3>${gg.red.player[i].name + " / " + gg.red.player[i].rate_str}</h3>
		<h4>${gg.red.player[i].decided_lane}</h4>
		<p></p>
		`
	}

	var red_text = `
		<div class="card mb3" style="background-color: #DDF; border-color: #11B;">
			<div class="card-body">
			<h2 class="card-title">青チーム</h2>
			${blue_insert_text}
			</div>
		</div>
	`

	var blue_text = `
		<div class="card mb3" style="background-color: #FDD; border-color: #B11;">
			<div class="card-body">
			<h2 class="card-title">赤チーム</h2>
			${red_insert_text}
			</div>
		</div>
	`
	red.append(red_text)
	blue.append(blue_text)

}

function randIntArray(min, max) {
	array = []
	for(var i=min; i<=max; i++){
		array.push(i)
	}
	for(var i = array.length - 1; i > 0; i--){
		var r = Math.floor(Math.random() * (i + 1));
		var tmp = array[i];
		array[i] = array[r];
		array[r] = tmp;
	}
	return array
}
