const {app, BrowserWindow, dialog} = require('electron');
const path = require('path');
const url = require('url');

app.on('ready', function(){
  createSplashScreen();
  }
)

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin'){
    app.quit();
  }
});













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
    //createMainWindow();
    //splashScreen.close();
  });
  splashScreen.on('closed', () => {
    splashScreen=null;
  });
}


function createMainWindow(){
  splashScreen = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', frame:true, show: false, webPreferences:{nodeIntegration: true}})
  splashScreen.setIgnoreMouseEvents(false);
  splashScreen.loadURL(url.format({
    pathname: path.join(__dirname, 'code/html/splash.html'),
    protocol: 'file:',
    slashes: true
  }));


  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
  });
  splashScreen.on('closed', () => {
    splashScreen=null;
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