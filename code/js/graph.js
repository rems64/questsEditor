import { SVG } from "./svg.esm.js"
import './svg.panzoom.mjs'
import './svg.draggable.mjs'

const $ = require("jquery");

var nodeTypes = {
  "default": {
    type: "horizontal",
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "int"],
    outputs: ["flow", "bool"]
  },
  "player": {
    type: "vertical",
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "bool"],
    outputs: ["flow", "int"]
  },
  "npc": {
    type: "vertical",
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "bool"],
    outputs: ["flow", "int"]
  }

}



function initGraph(){
  var canvas = SVG().addTo('#graph').size("100%", "99%")
  var tmpdX = 0;
  var tmpdY = 0;
  var moveType=0;
  var gridSize = [20, 20]
  var currentlySelected;
  var tmpLink;
  var currentHoveringPin;
  var concernedObj;
  var nodes = [];
  var currentFloatingLink;
  var currentPin;
  var currentPin2;
  var svgDOM = document.getElementsByTagName("svg")[0];
  var panZoomInfos = [0, 0, 1920, 1080]
  var pt = svgDOM.createSVGPoint();
}


function setPanZoom(){
  var strAttr = panZoomInfos[0].toString() + " " + panZoomInfos[1].toString() + " " + panZoomInfos[2].toString() + " " + panZoomInfos[3].toString()
  svgDOM.setAttribute("viewBox", strAttr);
}

function pan(x, y){
  panZoomInfos[0]+=x;
  panZoomInfos[1]+=y;
  setPanZoom()
}

function getCoords(evt){
  pt.x = evt.clientX;
  pt.y = evt.clientY;

  // The cursor point, translated into svg coordinates
  var cursorpt =  pt.matrixTransform(svgDOM.getScreenCTM().inverse());
  console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");
  //cursorpt.x = cursorpt.x-panZoomInfos[0]
  //cursorpt.y = cursorpt.y+panZoomInfos[1]
  return [cursorpt.x, cursorpt.y]
};


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
  var inp = [];
  for(var inputPin in infos.inputs) {
    //inp.push(createPin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+20))
    if(infos.type=="horizontal"){
      var tmpPin = new Pin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+20)
    }
    else{
      var tmpPin = new Pin(parent, infos.inputs[inputPin], 50*i+20, parent.y()+10)
    }
    tmpPin.type = 1;
    tmpPin.nature = infos.inputs[inputPin]
    inp.push(tmpPin);
    //createPin(parent, infos.inputs[inputPin], 200, 100)
    i++
  }
  i=0;
  var oup=[];
  for(var inputPin in infos.outputs) {
    //oup.push(createPin(parent, infos.outputs[inputPin], parent.width()-30, 50*i+20))
    if(infos.type=="horizontal"){
      var tmpPin = new Pin(parent, infos.outputs[inputPin], parent.width()-30, 50*i+20);
    }
    else{
      var tmpPin = new Pin(parent, infos.outputs[inputPin], 50*i+20, parent.height()-30);
    }
    tmpPin.type = 2;
    tmpPin.nature = infos.outputs[inputPin]
    oup.push(tmpPin);
    i++
  }
  return [inp, oup]
}

function createLink(parent, pin1, pin2){
  var tmpLink = new Link(parent, pin1, pin2);
  pin1.connectedLinks.push(tmpLink);
  pin2.connectedLinks.push(tmpLink);
  return tmpLink
}

function createFloatingLink(parent, x1, y1, x2, y2, color){
  var tmpLink = drawLink(parent, x1, y1, x2, y2, 0.5, "white");
  tmpLink.addClass("tmpLink")
  return tmpLink
}

function Pin(parent, id, x, y){
  this.path = createPin(parent, id, x, y);
  this.connectedLinks = [];
  this.canConnect = true;
  this.type = 0;
  this.nature = 0;
  this.updateLinked = function(){
    if(this.type == 1){
      for(var i in this.connectedLinks){
        this.connectedLinks[i].update(this.path.x(), this.path.y(), 1)
      }
    }
    else if(this.type == 2){
      for(var i in this.connectedLinks){
        this.connectedLinks[i].update(this.path.x(), this.path.y(), 2)
      }
    }
  }
}

function Node(parent, nodeType, x, y){
  this.id = getRandomInt(0, 10000);
  this.type = nodeTypes[nodeType];
  this.main = parent.group()
  this.path = createNodePath(this.main, this.type);
  [this.pinsIn, this.pinsOut] = createNodePins(this.main, this.type);
  this.updateLinks = function(){
    for(var i in this.pinsOut){
      this.pinsOut[i].updateLinked()
    }
    for(var i in this.pinsIn){
      this.pinsIn[i].updateLinked()
    }
  };
  this.move = function(x, y, stick){
    if(!stick){
      this.main.move(x, y);
    }
    else{
      this.main.move((Math.round(x/gridSize[0])*gridSize[0]), (Math.round(y/gridSize[0])*gridSize[0]));
    };
  };
  this.x = function(value){return this.main.x(value)};
  this.y = function(value){return this.main.y(value)};
}

function Link(parent, pin1, pin2){
  this.input = pin1;
  this.output = pin2;
  this.path = drawLink(parent, this.input.path.cx(), this.input.path.cy(), this.output.path.cx(), this.output.path.cy(), 4, "white")
  this.update = function() {
    updateSpline(this.path, this.input.path.cx(), this.input.path.cy(), this.output.path.cx(), this.output.path.cy())
  }
}

function createNode(parent, type){
  var tmpNode = new Node(parent, type);
  nodes.push(tmpNode);
  return tmpNode
}
