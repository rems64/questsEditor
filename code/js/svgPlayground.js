//const {SVG, registerWindow} = require("@svgdotjs/svg.js")
const $ = require("jquery");
//import "@svgdotjs/svg.js";
//import "@svgdotjs/svg.draggable.js";
//const {draggable} = require('@svgdotjs/svg.draggable.js')
import { SVG } from "./svg.esm.js"
import './svg.panzoom.mjs'
import './svg.draggable.mjs'

var gridSize = 50;

var draw = SVG().addTo('body').size(1240*0.9, 720*0.9)

function getLink(xA, yA, xB, yB, softness){
  var pathToDraw = "M" + xA + " " + yA + " c " + (softness*(xB-xA)) + " " + 0 + ", " + ((1-softness)*(xB-xA)) + " " + (yB-yA) + ", " + (xB-xA) + " " + (yB-yA)
  return pathToDraw
}

function drawLink(xA, yA, xB, yB, thickness){
  path = draw.path(getLink(x1, y1, x2, y2, 0.5));
  path.fill('none').stroke({ width: thickness, color: 'black'});
}

function drawCircle(drawArea, x, y, radius){
var tmp = drawArea.circle(radius).move((x-(radius/2)), (y-(radius/2)))
  return tmp
}

var xA = 0;
var yA = 0;
var xB = 40;

var yB = 20;
var toto = "M" + xA + " " + yA + " c " + (0.5*(xB-xA)) + " " + yA + ", " + ((xB-xA)-(0.5*(xB-xA))) + " " + (yB-yA) + ", " + xB + " " + yB
//          M    xA         xB     c      xC1                  yC1                 xC2                       yC2            xB         yB
//var toto = "M100 100 c 200 0, 0 200, " + x + " " + y
//var path = draw.path('M100 100 c 200 0, 0 200, 200 200');
var x1 = 100;
var y1 = 100;
var x2 = 400;
var y2 = 300;
var circle1 = drawCircle(draw, x1, y1, 50);
var circle2 = drawCircle(draw, x2, y2, 50);
var path;
drawLink(x1, y1, x2, y2, 5);

/*
var clicke = false;
circle1.click(function() {
  this.fill({ color: 'blue' })
  clicke = true;
})
circle1.mousemove(function() {
  if(clicke==true)
  {
    this.fill({ color: 'red' })
  }
})
*/

function updateSpline(x, y){
  path.plot(getLink(x, y, x2, y2, 0.5));
}

function startDrag(evt) {
  console.log(this)
  circle1.pressed = true
  //draw.zoom(2)
}
function drag(evt) {
  //console.log("drag");
  console.log(circle1.pressed);
  if(circle1.pressed==true){
    circle1.center((Math.ceil((evt.offsetX) / gridSize) * gridSize), (Math.ceil((evt.offsetY) / gridSize) * gridSize))
    updateSpline((Math.ceil((evt.offsetX) / gridSize) * gridSize), (Math.ceil((evt.offsetY) / gridSize) * gridSize));
  }
}
function endDrag(evt) {
  console.log("fin!");
  circle1.pressed = false
  console.log(draw.zoom());
}

$(document).on('mousedown', startDrag);
$(document).on('mousemove', drag);
$(document).on('mouseup', endDrag);
/*
var path = draw.path(getLink(x1, y1, x2, y2, 0.2));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.3));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.4));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.5));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.6));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.7));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.8));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 0.9));
path.fill('none').stroke({ width: 1, color: 'black'});
var path = draw.path(getLink(x1, y1, x2, y2, 1.0));

//var path = draw.path('M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80');
path.fill('none').stroke({ width: 1, color: 'black'});
*/


console.log(draw.svg());

draw.on('panStart', function(ev) {
    console.log("Hola!");
  })
