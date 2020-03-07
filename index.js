const {app, BrowserWindow, dialog} = require('electron');
const path = require('path');
const url = require('url');
var fs = require('fs');
//import { SVG } from '@svgdotjs/svg.js'
//import { SVG } from 'code/js/svg.esm.js'

var settings;

global.sharedObj = {currentDialogTree: "d0000"};

app.allowRendererProcessReuse = true;

app.on('ready', function(){
  createSplashScreen();
  }
)

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin'){
    app.quit();
  }
});

function shouldLogin(){
  var fileLoc = path.join(__dirname, 'data/settings.json')
  fs.readFile(fileLoc, 'utf8', function(err, contents) {
    if(err){
      throw err;
    }
    else{
      settings = JSON.parse(contents);
      if(settings.username!=""){
        createMainWindow();
        splashScreen.close();
      }
      else{
        createLoginWindow();
        splashScreen.close();
      }
    }
  });
}

function createSplashScreen(){
  splashScreen = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', frame:false, show: false, webPreferences:{nodeIntegration: true}})
  splashScreen.setIgnoreMouseEvents(false);
  splashScreen.loadURL(url.format({
    pathname: path.join(__dirname, 'code/html/splash.html'),
    protocol: 'file:',
    slashes: true
  }));


  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
    shouldLogin();
  });
  splashScreen.on('closed', () => {
    splashScreen=null;
  });
}


function createMainWindow(){
  mainWindow = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', titleBarStyle: 'hidden' , fullscreen:false, show: false, webPreferences:{nodeIntegration: true}})
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.loadURL(url.format({
    //pathname: path.join(__dirname, 'code/html/mainMenu.html'),
    pathname: path.join(__dirname, 'code/html/editDialogTree.html'),
    protocol: 'file:',
    slashes: true
  }));


  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  mainWindow.on('closed', () => {
    mainWindow=null;
  });
}

function createLoginWindow(){
  loginWindow = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', frame:false, fullscreen:false, show: false, webPreferences:{nodeIntegration: true}})
  loginWindow.setIgnoreMouseEvents(false);
  loginWindow.loadURL(url.format({
    //pathname: path.join(__dirname, 'code/html/mainMenu.html'),
    pathname: path.join(__dirname, 'code/html/login.html'),
    protocol: 'file:',
    slashes: true
  }));


  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });
  loginWindow.on('closed', () => {
    loginWindow=null;
  });
}


function askUpdate(){
  const options = {
    type: 'question',
    buttons: ['Oui', 'Non, plus tard'],
    defaultId: 0,
    title: 'Mettre à jour',
    message: "Installer l'application?",
    detail: "v1.0",
    //checkboxLabel: 'Remember my answer',
    //checkboxChecked: true,
  };
  dialog.showMessageBox(null, options, (response, checkboxChecked) => {
    console.log("Hey!");
    if (response==0) {
      //createWindow();
      console.log("On met à jour");
      //createProgess();
      //updateApp();
      //createWindow()
      //splashScreen.close()

    }
    else{
      console.log("Attention!");
      attention("Pensez à faire les mises à jour!");
      //app.quit();
    }
  });
}


function attention(msg, title="Attention!"){
  dialog.showMessageBox({message: msg, title: title, buttons: ["OK"]});
}
