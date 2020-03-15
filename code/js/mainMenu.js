const $ = require("jquery");
const { remote } = require('electron')
const url = require('url');
const path = require('path');
var fs = require("fs");
const BrowserWindow = remote.BrowserWindow;

$("#dials").click(function(){
  var menu = remote.getCurrentWindow();
  var dialsWin = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', titleBarStyle: 'hidden' , fullscreen:false, show: false, webPreferences:{nodeIntegration: true}})
  dialsWin.setIgnoreMouseEvents(false);
  dialsWin.loadURL(url.format({
    pathname: path.join(__dirname, 'dialsMenu.html'),
    protocol: 'file:',
    slashes: true
  }));


  dialsWin.once('ready-to-show', () => {
    dialsWin.show();
    menu.close()
  });
  newWin.once('closed', () => {
    dialsWin=null;
  });
})
