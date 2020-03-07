const $ = require("jquery");
const { remote } = require('electron')
const url = require('url');
const path = require('path');
var fs = require("fs");

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
