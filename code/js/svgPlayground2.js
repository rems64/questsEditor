import { SVG } from "./svg.esm.js"
import './svg.panzoom.mjs'
import './svg.draggable.mjs'

const $ = require("jquery");

var canvas = SVG().addTo('body').size("100%", "99%")
var tmpdX = 0;
var tmpdY = 0;
var moveType=0;
var gridSize = [20, 20]
var currentlySelected;
var tmpLink;
var currentHoveringPin;
var concernedObj;
var nodes = [];

var nodeTypes = {
  "default": {
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "int"],
    outputs: ["flow", "bool"]
  }
}

function createCircle(parent, x, y, d){
  return parent.circle(d).center(x, y).addClass("dragg");

}
function getPinCurve(id, x, y){
  var tmpPath;
  if(id==0){
    tmpPath="M" + x + " " + y + " l 10 0 l 10 12 -10 12 -10 0 z"
  }
  else if(id==1){
    tmpPath="M"
  }
  return tmpPath
}

function getLink(xA, yA, xB, yB, softness){
  var pathToDraw = "M" + xA + " " + yA + " c " + (softness*(xB-xA)) + " " + 0 + ", " + ((1-softness)*(xB-xA)) + " " + (yB-yA) + ", " + (xB-xA) + " " + (yB-yA)
  return pathToDraw
}

function drawLink(parent, xA, yA, xB, yB, thickness, color){
  var tmpPath = parent.path(getLink(xA, yA, xB, yB, 0.5));
  tmpPath.fill('none').stroke({ width: thickness, color: color});
  return tmpPath
}

function updateSpline(pathToUpdate, x, y, x2, y2){
  pathToUpdate.plot(getLink(x, y, x2, y2, 0.5));
  return pathToUpdate
}


function createPin(parent, id, x, y){
  var pin;
  if(id=="flow"){
    pin = parent.path(getPinCurve(0, x, y)).addClass("pin").addClass("flowPin");
  }
  else if(id=="int"){
    pin = parent.circle(10).move(x, y).addClass("pin").addClass("integerPin");
  }
  else if(id=="bool"){
    pin = parent.circle(10).move(x, y).addClass("pin").addClass("booleanPin");
  }
  return pin;

}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}



function createNodePath(parent, infos){
  var node = parent.rect(infos.sx, infos.sy).addClass("node").addClass("draggable").radius(10);
  for(var classe in infos.classes) {
    node.addClass(classe);
  }
  return node
}

function createNodePins(parent, infos){
  var i=0;
  for(var inputPin in infos.inputs) {
    createPin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+20)
    //createPin(parent, infos.inputs[inputPin], 200, 100)
    //console.log(infos.inputs[inputPin]);
    i++
  }
  i=0;
  for(var inputPin in infos.outputs) {
    createPin(parent, infos.outputs[inputPin], parent.width()-30, 50*i+20)
    i++
  }
}

function Node(parent, nodeType, x, y){
  this.id = getRandomInt(0, 10000);
  this.type = nodeTypes[nodeType];
  this.main = parent.group()
  this.path = createNodePath(this.main, this.type);
  this.pins = createNodePins(this.main, this.type);
  this.updateLinks = function(){
    console.log("[Info] Updating links");
  };
  this.move = function(x, y, stick){
    this.main.move(x, y);
  };
  this.x = function(value){return this.main.x(value)};
  this.y = function(value){return this.main.y(value)};
}

function Lien(parent1, pinID1, parent2, pinID2){
  this.update = function() {console.log("[Info] Updating...");}
}

function createNode(parent, type){
  var tmpNode = new Node(parent, type);
  nodes.push(tmpNode);
  return tmpNode
}

var node1 = createNode(canvas, "default");
var node2 = createNode(canvas, "default");


node1.move(100, 10)

//######################################################################################################################################################################################
//####################################################################################### EVENTS #######################################################################################
//######################################################################################################################################################################################


canvas.find(".node").mousedown(function(event){
  concernedObj = null;
  for(var index in nodes){
    var tmpNode = nodes[index]
    if(tmpNode.path == this){
      console.log("found!");
      concernedObj=tmpNode
      break
    }
  }
  if(currentlySelected){currentlySelected.path.removeClass("nodeSelected")};
  currentlySelected = concernedObj;
  concernedObj.path.addClass("nodeSelected");
  //currentControled = this.parent(SVG.G);
  tmpdX = event.pageX - concernedObj.x()
  tmpdY = event.pageY - concernedObj.y()
  moveType=1;
})



$(document).mousemove(function(event){
  if(moveType==1){
    if (concernedObj.main!=null){
      concernedObj.main.move(Math.round((event.pageX-tmpdX)/gridSize[0])*gridSize[0], Math.round((event.pageY-tmpdY)/gridSize[1])*gridSize[1]);

    }
  }
  else if(moveType==2){
    updateSpline(tmpLink, tmpdX, tmpdY, event.pageX, event.pageY);
  }
});



$(document).on("mouseup", function(){
  if(moveType==2){
    updateSpline(tmpLink, tmpdX, tmpdY, currentHoveringPin.cx(), currentHoveringPin.cy());
  }
  moveType=0;
  tmpLink=null;
});



canvas.find(".pin").mousedown(function(event){
  console.log("[info] Clicking a pin");
  tmpdX = this.cx()
  tmpdY = this.cy()
  concernedObj=this;
  tmpLink = drawLink(canvas, tmpdX, tmpdY, tmpdX, tmpdY, 4, "white");
  moveType=2;
})

canvas.find(".pin").mouseover(function(event){
  if(moveType==2){
    currentHoveringPin=this;
    console.log("You can release");
  }
})
