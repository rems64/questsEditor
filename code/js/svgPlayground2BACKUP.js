import { SVG } from "./svg.esm.js"
import './svg.panzoom.mjs'
import './svg.draggable.mjs'

const $ = require("jquery");

var canvas = SVG().addTo('#drawArea').size("100%", "99%")
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
console.log(pt);


var nodeTypes = {
  "default": {
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "int"],
    outputs: ["flow", "bool"]
  },
  "type1": {
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "bool"],
    outputs: ["flow", "int"]
  }

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
    var tmpPin = new Pin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+20)
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
    var tmpPin = new Pin(parent, infos.outputs[inputPin], parent.width()-30, 50*i+20);
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

/*
var node1 = createNode(canvas, "default");
var node2 = createNode(canvas, "default");


node1.move(100, 10)
*/

var node3 = createNode(canvas, "default");
node3.move(220, 40, true)
var node4 = createNode(canvas, "default");
node4.move(220, 350, true)
var node5 = createNode(canvas, "type1");
node5.move(660, 40, true)
var node6 = createNode(canvas, "type1");
node6.move(660, 350, true)

setPanZoom()

/*
var l1 = createLink(canvas, node3.pinsOut[0], node4.pinsIn[0]);
var l2 = createLink(canvas, node4.pinsOut[0], node5.pinsIn[0]);
var l3 = createLink(canvas, node5.pinsOut[0], node6.pinsIn[0]);
var l4 = createLink(canvas, node5.pinsOut[1], node6.pinsIn[1]);
var l2 = createLink(canvas, node4, node5);
var l3 = createLink(canvas, node5, node6);
var l4 = createLink(canvas, node1, node6);
*/
//######################################################################################################################################################################################
//####################################################################################### EVENTS #######################################################################################
//######################################################################################################################################################################################


canvas.find(".node").mousedown(function(event){
  concernedObj = null;
  for(var index in nodes){
    var tmpNode = nodes[index]
    if(tmpNode.path == this){
      concernedObj=tmpNode
      break
    }
  }
  if(currentlySelected){currentlySelected.path.removeClass("nodeSelected")};
  currentlySelected = concernedObj;
  concernedObj.path.addClass("nodeSelected");
  //currentControled = this.parent(SVG.G);
  tmpdX = getCoords(event)[0] - concernedObj.x()
  tmpdY = getCoords(event)[1] - concernedObj.y()
  moveType=1;
})



$(document).mousemove(function(event){
  if(moveType==1){
    if (concernedObj.main!=null){
      concernedObj.main.move(Math.round((getCoords(event)[0]-tmpdX)/gridSize[0])*gridSize[0], Math.round((getCoords(event)[1]-tmpdY)/gridSize[1])*gridSize[1]);
      concernedObj.updateLinks()

    }
  }
  else if(moveType==2){
    updateSpline(currentFloatingLink, tmpdX, tmpdY, getCoords(event)[0], getCoords(event)[1]);
  }
});


$(document).on("mouseup", function(){
  if(moveType==2){
    currentFloatingLink.remove()
    currentFloatingLink=null;
    if(currentHoveringPin!=null){
      for(var index in nodes){
        var tmpNode = nodes[index]
        for(var index2 in tmpNode.pinsIn){
          if(tmpNode.pinsIn[index2].path == currentHoveringPin){
            currentPin2=tmpNode.pinsIn[index2];
            break
          }
        }
        for(var index2 in tmpNode.pinsOut){
          if(tmpNode.pinsOut[index2].path == currentHoveringPin){
            currentPin2=tmpNode.pinsOut[index2];
            break
          }
        }
      }
      createLink(canvas, currentPin, currentPin2)
      currentPin=null;
      currentPin2=null;
    }
  }
  moveType=0;
});



canvas.find(".pin").mousedown(function(event){
  var currentParentToPin = null;
  for(var index in nodes){
    var tmpNode = nodes[index]
    for(var index2 in tmpNode.pinsOut){
      if(tmpNode.pinsOut[index2].path == this){
        currentPin=tmpNode.pinsOut[index2];
        currentParentToPin=tmpNode;
        break
      }
    }
    for(var index2 in tmpNode.pinsIn){
      if(tmpNode.pinsIn[index2].path == this){
        currentPin=tmpNode.pinsIn[index2];
        currentParentToPin=tmpNode;
        break
      }
    }
  }
  tmpdX = this.cx()
  tmpdY = this.cy()
  concernedObj=this;
  currentFloatingLink = createFloatingLink(canvas, tmpdX, tmpdY, getCoords(event)[0], getCoords(event)[1])
  moveType=2;
})

canvas.find(".pin").mouseover(function(event){
  var tmpCurPin;
  for(var index in nodes){
    var tmpNode = nodes[index]
    for(var index2 in tmpNode.pinsIn){
      if(tmpNode.pinsIn[index2].path == this){
        tmpCurPin=tmpNode.pinsIn[index2];
        break
      }
    }
    for(var index2 in tmpNode.pinsOut){
      if(tmpNode.pinsOut[index2].path == this){
        tmpCurPin=tmpNode.pinsOut[index2];
        break
      }
    }
  }
  if(currentPin){
    if(currentPin.type==1){
      if(tmpCurPin.type==2){
        if(tmpCurPin.nature == currentPin.nature){
          this.addClass("pinHovered");
          currentHoveringPin=this;
        }
      }
    }
    else if(currentPin.type==2){
      if(tmpCurPin.type==1){
        if(tmpCurPin.nature == currentPin.nature){
          this.addClass("pinHovered");
          currentHoveringPin=this;
        }
      }
    }
  }
})

canvas.find(".pin").mouseleave(function(event){
  if(currentHoveringPin==this){
    currentHoveringPin.removeClass("pinHovered")
    currentHoveringPin=null;
  }
})

$(document).on("keydown", (e) => {
  if (!e.repeat)
    if(e.key=="ArrowUp"){
      pan(0, -50)
    }
    if(e.key=="ArrowDown"){
      pan(0, 50)
    }
    if(e.key=="ArrowLeft"){
      pan(-50, 0)
    }
    if(e.key=="ArrowRight"){
      pan(50, 0)
    }
  });
