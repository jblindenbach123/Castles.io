var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};
var playerAi="#CCCCCC";
var listOfHuts=[];
var maxPopulation=20;
var populationUpdateCounter=0
var populationUpdateCounterTurnOver=50;
listOfHuts.push({x:100,y:100,population:10,player:playerAi,id:0})
listOfHuts.push({x:1200,y:100,population:10,player:playerAi,id:1})
listOfHuts.push({x:1000,y:100,population:10,player:playerAi,id:2})
listOfHuts.push({x:800,y:100,population:10,player:playerAi,id:3})
listOfHuts.push({x:600,y:100,population:10,player:playerAi,id:4})
listOfHuts.push({x:400,y:100,population:10,player:playerAi,id:5})
listOfHuts.push({x:1200,y:300,population:10,player:playerAi,id:6})
listOfHuts.push({x:200,y:500,population:10,player:playerAi,id:7})
listOfHuts.push({x:1200,y:500,population:10,player:playerAi,id:8})

var listofPlayers={};

var listofActions=[];

class Player{
	constructor(id){
		this.id=id;
		this.number = "" + Math.floor(10 * Math.random());
		this.playerColor=getRandomColor();
		var t=getRandomAiHut(this.playerColor);
		this.mHuts=t.m;
		this.eHuts=t.e;
	}
	update(){
		var pack = [];
		pack.push({
			mHuts:this.mHuts,
			eHuts:this.eHuts,
			listofArmies:listofActions,
			player:this.playerColor
		});		
		return pack;	
	}
	disconnectPlayer(){
		for (var i in this.mHuts){
			this.mHuts[i].player=playerAi;
		}
	}
}
function onConnect(socket){
	var newplayer = new Player(socket.id);
	console.log("new Player");
	listofPlayers[socket.id]=newplayer;
	socket.on('newAttack',function(data){
		var attackingHuts=data.aH;
		var defendingHuts=data.sH;
		listofActions.push(new action(attackingHuts,defendingHuts));
	});
}
function onDisconnect(socket){
	console.log("Player Left");
	listofPlayers[socket.id].disconnectPlayer();
	delete listofPlayers[socket.id];
}


var DEBUG = true;

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	onConnect(socket);
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		onDisconnect(socket);
	});		
});

setInterval(function(){
	for (var i in listofActions){
		listofActions[i].update();
	}
	populationUpdateCounter+=1
	if (populationUpdateCounter==populationUpdateCounterTurnOver){
		populationUpdateCounter=0;
		for (var i in listOfHuts){
			if (listOfHuts[i].population<maxPopulation){
				listOfHuts[i].population+=1
			}
		}
	}
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		var temp = listofPlayers[i];
		socket.emit('basicPackage',temp.update());
	}
},1000/25);

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

class action{
	constructor(attacking,defending){
		this.attackingHut=attacking;
		this.defendingHut=defending;
		this.armies=this.setupArmy();

	}
	setupArmy(){
		var a = [];
		for (var i=0;i<this.attackingHut.length;i++){
			a.push(new subAction(this.attackingHut[i].player,this.attackingHut[i],this.defendingHut,this.attackingHut[i].population,this.attackingHut[i].player))
		}
		return a;
	}
	update(){
		for (var i=0;i<this.armies.length;i++){
			this.armies[i].updateSub();
		}
	}	
}

class subAction{
	constructor(attackingcolor,startHut,endHut,troopsize,attackers){
		this.endHut=endHut;
		this.attackingcolor=attackingcolor;
		this.troopsize=troopsize;
		this.locX=startHut.x;
		this.locY=startHut.y;
		this.angle=this.getAngle();
		this.finished=false;
		this.startHut=startHut;
		this.attackers=attackers;
		this.startHut.decreasePopulation(this.troopsize);
	}
	updateSub(){
		var dx=Math.cos(this.angle)*moveSpeed;
		var dy=Math.sin(this.angle)*moveSpeed;
		this.locX+=dx
		this.locY+=dy;
		if (dx<0 && this.locX<this.endHut.x){
			this.finished=true;
		}
		if (dx>0 && this.locX>this.endHut.x){
			this.finished=true;
		}
		if (dy<0 && this.locY<this.endHut.y){
			this.finished=true;
		}
		if (dy>0 && this.locY>this.endHut.y){
			this.finished=true;
		}
		ctx.fillStyle=this.startHut.player;
		ctx.fillRect(this.locX-(armysize/2),this.locY-(armysize/2),armysize,armysize);
		ctx.fillText(this.troopsize,this.locX,this.locY-armysize);

	}
	getAngle(){
		var t=Math.atan((this.endHut.y-this.locY)/(this.endHut.x-this.locX));
		if (this.endHut.x<this.locX){
			t+=Math.PI;
		}
		return t;
	}

}
function getRandomAiHut(playercolor){
	var temp={e:[],m:null}
	var once=true;
	shuffle(listOfHuts);
	for (var x=0;x<listOfHuts.length;x++){
		if (listOfHuts[x].player==playerAi && once){
			listOfHuts[x].player=playercolor;
			var s=[]
			s.push(listOfHuts[x])
			temp.m=s;
			once=false;
		}
		else{
			temp.e.push(listOfHuts[x]);
		}
		
	}
	return temp;
}
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}






