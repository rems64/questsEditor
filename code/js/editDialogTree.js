const $ = require("jquery");
const { remote } = require('electron')
const fs = require('fs');
import { SVG } from "./svg.esm.js"
import './svg.panzoom.mjs'
import './svg.draggable.mjs'



var workingOnTreeID = remote.getGlobal('sharedObj').currentDialogTree
var treeJSON;
console.log("working on : " + workingOnTreeID);

var canvas = SVG().addTo('#graph').size("100%", "100%")
var tmpdX = 0;
var tmpdY = 0;
var moveType=0;
var gridSize = [20, 20]
var currentlySelected;
var tmpLink;
var currentHoveringPin;
var concernedObj;
var nodes = [];
var links = [];
var currentFloatingLink;
var currentPin;
var currentPin2;
var svgDOM = document.getElementsByTagName("svg")[0];
var panZoomInfos = [0, 0, 1920, 1080]
var pt = svgDOM.createSVGPoint();
var currentlySelected = [];
var movementSpeed = 1.5;
var connectedLinks;
var json = {};
var currentID = 0;
var editingText = false;
var selectedLink = null;
const currentWin = remote.BrowserWindow.getFocusedWindow()
var title = ""
var currentLink;


loadTree()


function loadTree(){
  var pathToDial = "data/ROGData/dialogs/" + workingOnTreeID + ".json";
  fs.readFile(pathToDial, 'utf8', function(err, contents) {
    if(err){
      throw err;
    }
    else{
      treeJSON = JSON.parse(contents);
      currentID = treeJSON.lastIndex;
      $("#titleInput").val(treeJSON.name);
      title = treeJSON.name;
      for(var index in treeJSON.nodes){
        if (treeJSON.nodes[index].nature!="input" & treeJSON.nodes[index].nature!="output") {
          var tmpNode = createNode(canvas, String(treeJSON.nodes[index].desc), String(treeJSON.nodes[index].id));
          tmpNode.move(treeJSON.nodes[index].x, treeJSON.nodes[index].y);
          tmpNode.changeContent(treeJSON.nodes[index].content);
        }
      }
      var tmpTarget = null;
      var tmpCurrentNode = null;
      for(var index2 in treeJSON.nodes){
        tmpCurrentNode = getNodeByID(treeJSON.nodes[index2].id);
        for(var index3 in treeJSON.nodes[index2].links){
          tmpTarget = getNodeByID(treeJSON.nodes[index2].links[index3].connectedNodeId)
          createLink(canvas, tmpCurrentNode.pinsOut[treeJSON.nodes[index2].links[index3].pinId], tmpTarget.pinsIn[treeJSON.nodes[index2].links[index3].connectedNodePinId]);
        }
      }
    }
  });
};

function getNodeByID(id){
  for(var index in nodes){
    if (nodes[index].id==id) {
      return nodes[index]
    }
  }
}

var nodeTypes = {
  "default": {
    desc: "default",
    type: "horizontal",
    nature: "replique",
    sx: 200,
    sy: 300,
    color: "red",
    classes: [],
    inputs: ["flow", "int"],
    outputs: ["flow", "bool"],
    text: "défaut"
  },
  "input": {
    desc: "input",
    type: "horizontal",
    nature: "input",
    sx: 180,
    sy: 70,
    color: "red",
    classes: [],
    inputs: [],
    outputs: ["flow"],
    text: "I"
  },
  "output": {
    desc: "output",
    type: "horizontal",
    nature: "output",
    sx: 170,
    sy: 70,
    color: "red",
    classes: [],
    inputs: ["flow"],
    outputs: [],
    text: "O"
  },
  "player": {
    desc: "player",
    type: "horizontal",
    nature: "replique",
    sx: 200,
    sy: 200,
    color: "red",
    classes: [],
    inputs: ["flow"],
    outputs: ["flow", "bool"],
    text: "Joueur"
  },
  "npc": {
    desc: "npc",
    type: "horizontal",
    nature: "replique",
    sx: 200,
    sy: 200,
    color: "red",
    classes: [],
    inputs: ["flow"],
    outputs: ["flow", "bool"],
    text: "PNJ"
  },
  "switchBool": {
    desc: "switchBool",
    type: "horizontal",
    nature: "switch",
    sx: 200,
    sy: 200,
    color: "blue",
    classes: [],
    inputs: ["flow", "bool"],
    outputs: ["flow", "flow"],
    text: "swBool"
  }
}





const promptContentDom = document.getElementById("promptContent");
const promptSwitchDom = document.getElementById("promptSwitch")

function getNodeNewID(){
  currentID+=1
  return currentID
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
  //console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");
  //cursorpt.x = cursorpt.x-panZoomInfos[0]
  //cursorpt.y = cursorpt.y+panZoomInfos[1]
  return [cursorpt.x, cursorpt.y]
};

function getRelativeCoords(evt){
  pt.x = evt.originalEvent.movementX;
  pt.y = evt.originalEvent.movementY;

  // The cursor point, translated into svg coordinates
  var cursorpt =  pt.matrixTransform(svgDOM.getScreenCTM().inverse());
  //console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");
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
  pin.on("mousedown", function(event){
    selectPinEvt(event, this);
  });
  pin.on("mouseover", function(event){
    overPinEvt(event, this)
  })
  pin.on("mouseleave", function(event){
    leavePinEvt(event, this)
  })
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

function setTitle(parent, infos){
  var txt = parent.text(infos.text).addClass("nodeTitle").addClass("noselect")
  txt.font({family: 'Montserrat', size: 30, anchor: 'middle', leading: '1.5em'})
  txt.fill("white")
  txt.dx(infos.sx/2)
  return txt
}

function setContentTxt(parent, infos, content){
  var txt = parent.text(String(content)).addClass("nodeContent").addClass("noselect")
  txt.dx(infos.sx)
  txt.font({family: 'Montserrat', size: 20, anchor: 'center', leading: '1.5em'})
  txt.fill("white")
  txt.move(-infos.sx + 20, 80);
  return txt
}

function createNodePins(parent, infos, obj){
  var i=0;
  var inp = [];
  for(var inputPin in infos.inputs) {
    //inp.push(createPin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+20))
    if(infos.type=="horizontal"){
      var tmpPin = new Pin(parent, infos.inputs[inputPin], parent.x()+10, 50*i+23, obj)
    }
    else{
      var tmpPin = new Pin(parent, infos.inputs[inputPin], 50*i+20, parent.y()+10, obj)
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
      var tmpPin = new Pin(parent, infos.outputs[inputPin], parent.width()-30, 50*i+23, obj);
    }
    else{
      var tmpPin = new Pin(parent, infos.outputs[inputPin], 50*i+20, parent.height()-30, obj);
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
  tmpLink.path.addClass("link");
  pin1.connectedLinks.push(tmpLink);
  pin2.connectedLinks.push(tmpLink);
  links.push(tmpLink);
  tmpLink.path.on("click", function(event){
    clickLinkEvent(event, this);
  });
  return tmpLink
}

function createFloatingLink(parent, x1, y1, x2, y2, color){
  var tmpLink = drawLink(parent, x1, y1, x2, y2, 0.5, "white");
  tmpLink.addClass("tmpLink")
  return tmpLink
}

function Pin(parent, id, x, y, obj){
  this.path = createPin(parent, id, x, y);
  this.owner = obj;
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
  };
  this.deleteConnected = function(){
    console.log("Deleted connected");
    for(var index in this.connectedLinks){
      this.connectedLinks[index].path.remove()
      if(this.type==1){
        this.connectedLinks[index].input.connectedLinks.splice(this.connectedLinks[index].input.connectedLinks.indexOf(this.connectedLinks[index]), 1);
      }
      else{
        this.connectedLinks[index].output.connectedLinks.splice(this.connectedLinks[index].output.connectedLinks.indexOf(this.connectedLinks[index]), 1);
      }
      delete this.connectedLinks[index]
    }
  }
}

function Node(parent, nodeType, id, content){
  if (id==false) {
    this.id = getNodeNewID();
  }
  else{
    this.id = id
  }
  if (!content) {
    this.content="";
  }
  else {
    this.content=content;
  }
  this.type = nodeTypes[nodeType];
  this.nature = this.type.nature;
  this.desc = this.type.desc
  this.main = parent.group()
  this.path = createNodePath(this.main, this.type);
  this.title = setTitle(this.main, this.type);
  this.contentTxt = setContentTxt(this.main, this.type, this.content);
  [this.pinsIn, this.pinsOut] = createNodePins(this.main, this.type, this);
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
  this.center = function(x, y, stick){
    if(!stick){
      this.main.center(x, y);
    }
    else{
      this.main.center((Math.round(x/gridSize[0])*gridSize[0]), (Math.round(y/gridSize[0])*gridSize[0]));
    };
  };
  this.x = function(value){return this.main.x(value)};
  this.y = function(value){return this.main.y(value)};
  this.delete = function(){
    if(this.type.desc!="input" & this.type.desc!="output"){
      for(var index in this.pinsOut){
        this.pinsOut[index].deleteConnected()
        this.pinsOut[index].path.remove()
        delete this.pinsOut[index]
      }
      for(var index in this.pinsIn){
        this.pinsIn[index].deleteConnected()
        this.pinsIn[index].path.remove()
        delete this.pinsOut[index]
      }
      nodes.splice(nodes.indexOf(this), 1);
      this.path.parent().remove()
      delete this
    }
  }
  this.changeContent = function(content){
    if(this.id>0){
      this.content = content;
      if (String(content).length>13) {
        this.contentTxt.text(String(content).substring(0,13)+"...");
      }
      else {
        this.contentTxt.text(String(content));
      }
    }
  }
}

function Link(parent, pin1, pin2){
  this.input = pin1;
  this.output = pin2;
  this.owner = parent;
  this.path = drawLink(parent, this.input.path.cx(), this.input.path.cy(), this.output.path.cx(), this.output.path.cy(), 4, "white")
  this.update = function() {
    updateSpline(this.path, this.input.path.cx(), this.input.path.cy(), this.output.path.cx(), this.output.path.cy())
  }
  this.remove = function() {
    this.input.connectedLinks.splice(this.input.connectedLinks.indexOf(this), 1);
    this.output.connectedLinks.splice(this.output.connectedLinks.indexOf(this), 1);
    this.path.remove()
    delete this
  }
}

function createNode(parent, type, id){
  if (nodeTypes[type].desc=="input") {
    var tmpNode = new Node(parent, type, -1);
  }
  else if(nodeTypes[type].desc=="output"){
    var tmpNode = new Node(parent, type, -2);
  }
  else{
    if (id) {
      var tmpNode = new Node(parent, type, id);
    }
    else{
      var tmpNode = new Node(parent, type, false);
    }
  }
  nodes.push(tmpNode);
  tmpNode.path.on("mousedown", function(event){
    selectNodeEvt(event, this);
  });
  tmpNode.path.on("dblclick", function(event){
    dblClickNodeEvt(event, this);
  })
  return tmpNode
}

$("#addNPCBtn").click(function(){
  createNode(canvas, "npc").center((panZoomInfos[2]+panZoomInfos[0])/2, (panZoomInfos[3]+panZoomInfos[1])/2, true);
});

$("#addPlayerBtn").click(function(){
  createNode(canvas, "player").center((panZoomInfos[2]+panZoomInfos[0])/2, (panZoomInfos[3]+panZoomInfos[1])/2, true);
});

$("#addSwitchBtn").click(function(){
  createNode(canvas, "switch").center((panZoomInfos[2]+panZoomInfos[0])/2, (panZoomInfos[3]+panZoomInfos[1])/2, true);
})


setPanZoom()

var inputNode = createNode(canvas, "input").move(50, 400);
var outputNode = createNode(canvas, "output").move(1500, 400);

function getConcernedNode(concerned){
  for(var index in nodes){
    var tmpNode = nodes[index]
    if(tmpNode.path == concerned){
      return tmpNode
      break
    }
  }
}

function promptContent(x, y){
  editingText = true;
  promptContentDom.style.visibility = "visible"
  promptContentDom.style.left = String(x) + "px";
  promptContentDom.style.top = String(y) + "px";
}

function promptSwitch(x, y){
  editingText = true;
  promptSwitchDom.style.visibility = "visible"
  promptSwitchDom.style.left = String(x) + "px";
  promptSwitchDom.style.top = String(y) + "px";
}

function hidePrompts(){
  editingText = false;
  promptContentDom.style.visibility = "hidden";
  promptSwitchDom.style.visibility = "hidden";
}



$("#save").on("click", function(){
  saveGraph();
})

$("#compile").on("click", function(){
  compileGraph();
})

$("#validatePromptContent").on("click", function(){
  concernedObj.changeContent($("#contentInput").val());
  hidePrompts();
})

$("#validateSwitchPromptContent").on("click", function(){
  var switchPrompt1 = document.getElementById("switchSelectVariable");
  var switchPrompt1Val = switchPrompt1.options[switchPrompt1.selectedIndex].value;
  var switchPrompt2 = document.getElementById("switchSelectOperator");
  var switchPrompt2Val = switchPrompt2.options[switchPrompt2.selectedIndex].value;
  var switchPrompt3 = document.getElementById("switchValueInput");
  var switchPrompt3Val = switchPrompt3.value;
  var strToWrite = switchPrompt1Val + "|" + switchPrompt2Val + "|" + switchPrompt3Val
  concernedObj.changeContent(strToWrite);
  promptSwitchDom.style.visibility = "hidden"
})

function saveGraph(){
  /*
  fs.readFile(pathToDial, 'utf8', function(err, contents) {
    if(err){
      throw err;
    }
    else{
      let jsonToWrite = JSON.stringify(json);
      fs.writeFile(pathToDial, jsonToWrite);
    }
  });
  */
  var pathToDial = "data/ROGData/dialogs/" + workingOnTreeID + ".json";
  fs.exists(pathToDial, function(exists) {
    if (exists) {
      var jsonToWrite = JSON.stringify(json, null, "\t");
      fs.writeFile(pathToDial, jsonToWrite, function(err, data){
        if (err) {console.log(err);}
      });
    }
    else {
      let jsonToWrite = JSON.stringify(json, null, '\t');
      fs.writeFile(pathToDial, jsonToWrite, function(err){
        if (err) {console.log(err);}
      });
    }
  });
}

function getCompilePinId(node, pin){
  for(var index in node.pinsIn){
    if(node.pinsIn[index]==pin){
      return index
    }
  }
}

function compileGraph(){
  json = {};
  json.version = "1.0";
  json.name = title;
  json.lastIndex = currentID;
  json.nodes = []
  var cnode;
  for(var index in nodes){
    cnode = nodes[index]
    connectedLinks = []
    for(var index2 in cnode.pinsOut){
      //if (cnode.pinsOut[index2].nature=="flow") {
        if (cnode.pinsOut[index2].connectedLinks.length>0) {
          for(var index3 in cnode.pinsOut[index2].connectedLinks){
            connectedLinks.push({
              pinId: index2,
              connectedNodeId: cnode.pinsOut[index2].connectedLinks[index3].output.owner.id,
              connectedNodePinId: getCompilePinId(cnode.pinsOut[index2].connectedLinks[index3].output.owner, cnode.pinsOut[index2].connectedLinks[index3].output)
            })
          }
        }
      //}
    }
    console.log(cnode.x());
    json.nodes.push({
      id: cnode.id,
      type: cnode.type.title,
      nature: cnode.nature,
      links: connectedLinks,
      x: cnode.x(),
      y: cnode.y(),
      content: cnode.content,
      desc: cnode.desc
    })
  }
}


//######################################################################################################################################################################################
//####################################################################################### EVENTS #######################################################################################
//######################################################################################################################################################################################

$("#titleInput").on("change", function(){
  title = $("#titleInput").val()
})

$("#graph").click(function(event){
  if(!event.target.classList.contains("dnr")){
    hidePrompts()
  }
})

$("#graph").dblclick(function(event){
  if(selectedLink){selectedLink.path.removeClass("linkSelected");selectedLink=null;}
  if(!event.toElement.classList.contains("node")){
    if(currentlySelected.length>0){for(var i in currentlySelected){currentlySelected[i].path.removeClass("nodeSelected")}};
    currentlySelected=[]
  }
})


function selectNodeEvt(event, ceci){
  concernedObj = null;
  concernedObj=getConcernedNode(ceci)
  if (!event.shiftKey) {
    if(currentlySelected.length>0){
      if(!currentlySelected.includes(concernedObj)){
        for(var i in currentlySelected){currentlySelected[i].path.removeClass("nodeSelected")}
        currentlySelected=[]
        currentlySelected.push(concernedObj);
        concernedObj.path.addClass("nodeSelected");
      }
      else{
        console.log("Déjà sélectionné, appuyez sur shift pour l'enlever d'une sélection");
      }
    }
    else{
      currentlySelected.push(concernedObj);
      concernedObj.path.addClass("nodeSelected");
    }
  }
  else{
    if(currentlySelected.includes(concernedObj)){
      currentlySelected.splice(currentlySelected.indexOf(concernedObj), 1);
      concernedObj.path.removeClass("nodeSelected");
    }
    else{
      currentlySelected.push(concernedObj);
      concernedObj.path.addClass("nodeSelected");
    }
  }
  //currentControled = ceci.parent(SVG.G);
  tmpdX = getCoords(event)[0] - concernedObj.x()
  tmpdY = getCoords(event)[1] - concernedObj.y()
  moveType=1;
};



$(document).mousemove(function(event){
  if(moveType==1){
    if (concernedObj.main!=null){
      for(var i in currentlySelected){
        currentlySelected[i].main.move((currentlySelected[i].x()+event.originalEvent.movementX*movementSpeed), (currentlySelected[i].y()+event.originalEvent.movementY*movementSpeed));
        //currentlySelected[i].main.move((currentlySelected[i].x()+getRelativeCoords(event)[0]), (currentlySelected[i].y()+getRelativeCoords(event)[1]));
        currentlySelected[i].updateLinks()
      }
      //concernedObj.main.move(Math.round((getCoords(event)[0]-tmpdX)/gridSize[0])*gridSize[0], Math.round((getCoords(event)[1]-tmpdY)/gridSize[1])*gridSize[1]);
      //concernedObj.updateLinks()

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
  currentPin=null
  moveType=0;
});



function selectPinEvt(event, ceci){
  var currentParentToPin = null;
  for(var index in nodes){
    var tmpNode = nodes[index]
    for(var index2 in tmpNode.pinsOut){
      if(tmpNode.pinsOut[index2].path == ceci){
        currentPin=tmpNode.pinsOut[index2];
        currentParentToPin=tmpNode;
        break
      }
    }
    for(var index2 in tmpNode.pinsIn){
      if(tmpNode.pinsIn[index2].path == ceci){
        currentPin=tmpNode.pinsIn[index2];
        currentParentToPin=tmpNode;
        break
      }
    }
  }
  tmpdX = ceci.cx()
  tmpdY = ceci.cy()
  concernedObj=ceci;
  currentFloatingLink = createFloatingLink(canvas, tmpdX, tmpdY, getCoords(event)[0], getCoords(event)[1])
  moveType=2;
};

function overPinEvt(event, ceci){
  var tmpCurPin;
  for(var index in nodes){
    var tmpNode = nodes[index]
    for(var index2 in tmpNode.pinsIn){
      if(tmpNode.pinsIn[index2].path == ceci){
        tmpCurPin=tmpNode.pinsIn[index2];
        break
      }
    }
    for(var index2 in tmpNode.pinsOut){
      if(tmpNode.pinsOut[index2].path == ceci){
        tmpCurPin=tmpNode.pinsOut[index2];
        break
      }
    }
  }
  if(currentPin){
    if(currentPin.type==1){
      if(tmpCurPin.type==2){
        if(tmpCurPin.nature == currentPin.nature){
          ceci.addClass("pinHovered");
          currentHoveringPin=ceci;
        }
      }
    }
    else if(currentPin.type==2){
      if(tmpCurPin.type==1){
        if(tmpCurPin.nature == currentPin.nature){
          ceci.addClass("pinHovered");
          currentHoveringPin=ceci;
        }
      }
    }
  }
};

function leavePinEvt(event, ceci){
  if(currentHoveringPin==ceci){
    currentHoveringPin.removeClass("pinHovered")
    currentHoveringPin=null;
  }
};

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
    if(e.key=="Delete" | e.key=="x"){
      if(!editingText){
        if (selectedLink!=null) {
          selectedLink.remove()
        }
        else{
          for(var index in currentlySelected){
            currentlySelected[index].delete()
          }
        }
      }
    }
  });

function dblClickNodeEvt(event, ceci){
  concernedObj=null;
  concernedObj = getConcernedNode(ceci);
  if (concernedObj.id>0) {
    if (concernedObj.nature=="replique") {
      if(concernedObj.content==""){
        $("#contentInput").val(concernedObj.content);
        promptContent(event.pageX, event.pageY);
      }
      else{
        $("#contentInput").val(concernedObj.content);
        promptContent(event.pageX, event.pageY);
      }
    }
    else if(concernedObj.nature=="switch"){
      if(concernedObj.content!=""){
        document.getElementById("switchSelectVariable").value = concernedObj.content.split("|")[0];
        document.getElementById("switchSelectOperator").value = concernedObj.content.split("|")[1];
        document.getElementById("switchValueInput").value = concernedObj.content.split("|")[2];
      }
      promptSwitch(event.pageX, event.pageY);
    }
  }
  else{
    alert("Impossible de modifier l'entrée ou la sortie du graph");
  }
}

function getLinkByPath(path){
  for(var index in nodes){
    for(var index2 in nodes[index].pinsOut){
      for(var index3 in nodes[index].pinsOut[index2].connectedLinks){
        if(nodes[index].pinsOut[index2].connectedLinks[index3].path==path){
          return nodes[index].pinsOut[index2].connectedLinks[index3]
        }
      }
    }
  }
}

function clickLinkEvent(event, ceci){
  console.log("clicked link");
  currentLink=getLinkByPath(ceci);
  console.log(ceci);
  console.log(currentLink);
  if(selectedLink!=currentLink){
    if(selectedLink){selectedLink.path.removeClass("linkSelected");}
    selectedLink=currentLink;
    selectedLink.path.addClass("linkSelected")
  }
}
