const $ = require("jquery");
const { remote } = require('electron')
const url = require('url');
const path = require('path');
var fs = require("fs");

// Simple-git without promise
const simpleGit = require('simple-git')("./data/ROGData");// Shelljs package for running shell tasks optional
const shellJs = require('shelljs');// Simple Git with Promise for handling success and failure
const simpleGitPromise = require('simple-git/promise')("./data/ROGData");

// Repo name
const repo = 'ROGData';  //Repo name
// User name and password of your GitHub
var userName = 'astralpetalgames';
var password = 'r1seofglory';
var gitHubUrl;



var dialogsList=[]
var pendingDelete;
var highestID=0;

function openDialogTree(id){
  const BrowserWindow = remote.BrowserWindow;
  remote.getGlobal('sharedObj').currentDialogTree = String(id);
  remote.getGlobal('sharedObj').menuWindow = remote.getCurrentWindow();
  var menu = remote.getCurrentWindow();
  /*
  remote.getCurrentWindow().loadURL(url.format({
    pathname: path.join(__dirname, 'editDialogTree.html'),
    protocol: 'file:',
    slashes: true
  }));
  */
  newWin = new BrowserWindow({width:1280, height:720, icon:__dirname+'/Images/Icons/icon.png', titleBarStyle: 'hidden' , fullscreen:false, show: false, webPreferences:{nodeIntegration: true}})
  newWin.setIgnoreMouseEvents(false);
  newWin.loadURL(url.format({
    pathname: path.join(__dirname, 'editDialogTree.html'),
    protocol: 'file:',
    slashes: true
  }));


  newWin.once('ready-to-show', () => {
    newWin.show();
    menu.close()
  });
  newWin.once('closed', () => {
    newWin=null;
  });

}

function removeDialogTree(id){
  var pathToDel = path.join(__dirname, "../../data/ROGData/dialogs/"+id+".json");
  fs.unlink(pathToDel, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

function checkDelete(){
  console.log("Really want to delete?");
  $("#promptDelete").css("visibility", "visible")
}

$("#yesDelete").on("click", function(){
  if(pendingDelete){
    removeDialogTree($(pendingDelete).parent()[0].id)
    pendingDelete.parentNode.parentNode.removeChild(pendingDelete.parentNode);
    $("#promptDelete").css("visibility", "hidden")
  }
});

$("#noDelete").on("click", function(){
  pendingDelete=null;
  $("#promptDelete").css("visibility", "hidden")
});

function loadDialogsList(){
  var pathToDials = path.join(__dirname, "../../data/ROGData/dialogs/");
  fs.readdir(pathToDials, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      files.forEach(function (file) {
          // Do whatever you want to do with the file
          //console.log(String(file).replace(".json", ""));
          fs.readFile(pathToDials+file, 'utf8', function(err, contents) {
            if(err){
              throw err;
            }
            else{
              var result = JSON.parse(contents);
              dialogsList.push({
                name: result.name,
                id: String(file).replace(".json", "")
              });
              var newDiv = document.createElement("div");
              var p = document.createElement("p");
              p.innerHTML = result.name;
              newDiv.appendChild(p)
              newDiv.classList.add("dial")
              newDiv.id = String(file).replace(".json", "")
              var openBtn = document.createElement("button");
              openBtn.innerHTML = "Ouvrir"
              openBtn.classList.add("dialOpenButton")
              var deleteBtn = document.createElement("button");
              deleteBtn.innerHTML = "Supprimer"
              deleteBtn.classList.add("dialDeleteButton");
              newDiv.appendChild(openBtn);
              newDiv.appendChild(deleteBtn);
              document.getElementById("dialogsList").appendChild(newDiv);
              $(openBtn).on("click", function(event){
                openDialogTree($(this).parent()[0].id)
              });
              $(deleteBtn).on("click", function(event){
                pendingDelete = this;
                checkDelete()
              });
            }
          });
      });
  });
}

$(".dialDeleteButton").on("click", function(){
  console.log(this.parent);
})

$("#createNewDialog").on("click", function(){
  console.log($("#newDialogTitle").val());
  var jsonToWrite = {
    version: "1.0",
    name: $("#newDialogTitle").val(),
    lastIndex: 0,
    nodes: []
  }
  var toWrite = JSON.stringify(jsonToWrite, null, "\t");
  var pathToDials = path.join(__dirname, "../../data/ROGData/dialogs/");
  fs.readdir(pathToDials, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
      if(parseFloat(String(file).replace(".json", "").replace("d", ""))>highestID){
        highestID=parseFloat(String(file).replace(".json", "").replace("d", ""))
      }
    })
    console.log(highestID);
    highestID+=1
    var name = "d" + String(highestID) + ".json"
    fs.writeFile(pathToDials+name, toWrite, function(err, data){
      if (err) {console.log(err);}
    });
    var newDiv = document.createElement("div");
    var p = document.createElement("p");
    p.innerHTML = jsonToWrite.name;
    newDiv.appendChild(p)
    newDiv.classList.add("dial")
    console.log("Ceci:");
    console.log(highestID);
    newDiv.id = String("d"+String(highestID))
    var openBtn = document.createElement("button");
    openBtn.innerHTML = "Ouvrir"
    openBtn.classList.add("dialOpenButton")
    var deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "Supprimer"
    deleteBtn.classList.add("dialDeleteButton");
    newDiv.appendChild(openBtn);
    newDiv.appendChild(deleteBtn);
    document.getElementById("dialogsList").appendChild(newDiv);
    $(openBtn).on("click", function(event){
      openDialogTree($(this).parent()[0].id)
    });
    $(deleteBtn).on("click", function(event){
      pendingDelete = this;
      checkDelete()
    });
  });
});

loadDialogsList();









function addLog(type, content){
  var paragraph = document.createElement("p");
  if (content!="") {
    paragraph.innerHTML = content;
  }
  else {
    paragraph.innerHTML = "Empty"
  }
  document.getElementById("gitLog").appendChild(paragraph);

  if(type=="info"){
    paragraph.classList.add("info")
  }
  else if(type=="warning"){
    paragraph.classList.add("warning")
  }
  else if(type=="error"){
    paragraph.classList.add("error")
  }
}

$("#updateBtn").click(function(){
  console.log("UpdatingGit");
  $("#gitUpdate").css("visibility", "visible");

  simpleGit.addConfig('user.email','astralpetalgames@gmail.com');
  simpleGit.addConfig('user.name','Astral Petal Games');
  // Add remore repo url as origin to repo
  gitHubUrl = `https://${userName}:${password}@github.com/${userName}/${repo}`;
  addLog("info", "Logged in")
  //simpleGitPromise.addRemote('origin',gitHubUrl);
  shellJs.cd("./data/ROGData");
  alert(shellJs.pwd())


  addLog("info", "Pulling...")
  simpleGitPromise.pull("origin","master")
      .then((success) => {
        addLog("info", "Réussite du pull")
        addLog("info", "Adding...")
        simpleGitPromise.add('.')
        .then(
          (addSuccess) => {
            addLog("info", "Bien ajouté au commit")
            // Commit files as Initial Commit
            addLog("info", "Début du commit")
            simpleGitPromise.commit('My commit qui est super vraiment bien.')
            .then(
              (successCommit) => {
                addLog("info", "Succès du commit")
                addLog("info", successCommit.commit)
                console.log(successCommit.commit);
                // Finally push to online repository
                addLog("info", "Début du push...")
                simpleGitPromise.push('origin','master')
                .then((success) => {
                  addLog("info", "Dialogues bien envoyés")
                  addLog("info", "Succès")
                  setTimeout(function () {
                    $("#gitUpdate").css("visibility", "hidden");
                  }, 4000);
                },(failed)=> {
                  addLog("error", "Erreur lors de l'envoi")
                });
              }, (failed) => {
                addLog("error", "Errur lors du commit")
              });
          }, (failedAdd) => {
            addLog("error", "Erreur lors de l'ajout")
          });
      },(failed)=> {
        addLog("error", "Erreur lors du pull")
        addLog("error", failed)
      });



})

function getFromGithub(){

}
