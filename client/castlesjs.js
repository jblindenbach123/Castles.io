 
var canvas=null;
var cWidth=null;
var cHeight=null;
var resizeFactor=4;
var ctx=null;
var mHuts=[];
var eHuts=[];
var listofArmies=[];
var hutsize=30;
var playercolor="";
var enemyplayer="#EEEEEE";
var armysize=10;
var startTicking=true;

var selectRadius=50;
var listOfHuts=[];
var selecting=false;
var selectingcolor="#444444";
var selectedHut=[];
var selectingRadiusThickness=5;
var mouseX;
var mouseY;
var playercolor;
var attackingHut=null;
var lock=false;


window.onload=function startUp(){
	canvas=document.getElementById("can");
	cWidth = window.innerWidth-resizeFactor;
	cHeight = window.innerHeight-resizeFactor;
	ctx = canvas.getContext("2d");
	updateCanvasSize();
}
window.onresize = function() {
    cWidth = window.innerWidth-resizeFactor;
	cHeight = window.innerHeight-resizeFactor;
	updateCanvasSize();
}
function updateCanvasSize(){
	canvas.width=cWidth
	canvas.height=cHeight
}
var socket = io();
       
socket.on('basicPackage',function(data){
    mHuts=data.mHuts;
    eHuts=data.eHuts;
    playercolor=data.playercolor
    listofArmies=data.listofArmies
    if (startTicking){
    	startTicking=false;
    	setInterval(function(){tick();},6);
    }
});
function drawElements(){
	for (var i=0;i<mHuts.length;i++){
		drawHut(mHuts[i].x,mHuts[i].y,mHuts[i].population,playercolor);
	}
	for (var i=0;i<eHuts.length;i++){
		drawHut(eHuts[i].x,eHuts[i].y,eHuts[i].population,enemyplayer);
	}
}
function drawHut(x,y,population,player){
	ctx.fillStyle=player;
	ctx.fillRect(x-(hutsize/2),y-(hutsize/2),hutsize,hutsize);
	ctx.fillText(population,x,y-hutsize);
}
function drawArmy(x,y,armynumber,player){
	ctx.fillStyle=player;
	ctx.fillRect(x-(armysize/2),y-(armysize/2),armysize,armysize);
	ctx.fillText(armynumber,x,y-armysize);
}
function clearCanvas()
{
	ctx.clearRect(0,0,cWidth,cHeight);
}
function tick(){
	clearCanvas();
	drawElements();
	if (selecting){
		for (var i=0;i<selectedHut.length;i++)
		{
			drawSelectingCircle(i)
			if (!lock){
				if (checkOutsideCircle(i)){
					drawLine(i);
				}
			}
			else{
				drawAttackingCircle();
				drawAttackingLine();
			}

		}

	}
}

window.onmousedown=function(evt){
	selectedHut=[];
	attackingHut=null;
	selecting=true
	x=evt.offsetX;
	y=evt.offsetY;
	mouseX=x;
	mouseY=y;
	for (var z=0;z<mHuts.length;z++){
		var temp=inLocation(x,y,mHuts[z])
		if (temp!=null){
			selectedHut.push(temp);
		}
	}
	if (selectedHut[0]==null){
		selecting=false
	}
}
window.onmouseup=function(evt){
	lock=false;
	if (attackingHut!=null){
		selecting=false;
		socket.emit("newAttack",{aH:attackingHut,sH:selectedHut});
		selectedHut=[];
		attackingHut=null;
	}
	else{
		selecting=false
		selectedHut=[];
		attackingHut=false;
	}

}
window.onmousemove=function(evt){
	x=evt.offsetX;
	y=evt.offsetY;
	mouseX=x;
	mouseY=y;
	for (var z=0;z<mHuts.length;z++){
		var temp=inLocation(x,y,mHuts[z])
		if (temp!=null && hutunseen(temp) && (!lock)){
			selectedHut.push(temp);
		}
	}
	for (var z=0;z<eHuts.length;z++){
		var temp=inLocation(x,y,eHuts[z])
		if (temp!=null && selectedHut.length>0){
			lock=true;
			attackingHut=temp;
		}
	}
}
function hutunseen(a){
	var i=a.id;
	for (var z=0;z<selectedHut.length;z++){
		if (selectedHut[z].id==i){
			return false;
		}
	}
	return true;

}
function drawAttackingCircle()
{
	for (var i=0;i<selectedHut.length;i++){
		drawCircle(selectedHut[i].x,selectedHut[i].y);

	}
	drawCircle(attackingHut.x,attackingHut.y);
}				
function drawAttackingLine(){
	for (var i=0;i<selectedHut.length;i++){
		drawModifiedLine(i);
	}
}

function drawCircle(ix,iy){
	ctx.fillStyle=selectingcolor;
	ctx.lineWidth=selectingRadiusThickness;
	ctx.beginPath();
	ctx.arc(ix,iy,selectRadius,0,2*Math.PI);
	ctx.stroke();

}
function drawModifiedLine(hutnumber){
	var angle=Math.atan((attackingHut.y-selectedHut[hutnumber].y)/(attackingHut.x-selectedHut[hutnumber].x));
	if (attackingHut.x<selectedHut[hutnumber].x){
		angle+=Math.PI;
	}
	var dy=Math.sin(angle)*selectRadius+selectedHut[hutnumber].y;
	var dx=Math.cos(angle)*selectRadius+selectedHut[hutnumber].x;

	ctx.beginPath();
	ctx.moveTo(dx,dy);
	ctx.fillStyle=selectingcolor;
	ctx.lineTo(attackingHut.x-(Math.cos(angle)*selectRadius),attackingHut.y-(Math.sin(angle)*selectRadius));
	ctx.stroke();
}

function inLocation(x,y,zhut){
	if ((zhut.x-(hutsize/2))<x && x<(zhut.x+(hutsize/2))){
		if ((zhut.y-(hutsize/2))<y && y<(zhut.y+(hutsize/2))){
			return zhut;
		}
	}
	return null;
}
