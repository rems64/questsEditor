const $ = require("jquery");
const { remote } = require('electron')
const url = require('url');
const path = require('path');
const fs = require("fs");

var dialogsList=[]
var pendingDelete;

function openDialogTree(id){
  remote.getGlobal('sharedObj').currentDialogTree = String(id);
  remote.getCurrentWindow().loadURL(url.format({
    pathname: path.join(__dirname, 'editDialogTree.html'),
    protocol: 'file:',
    slashes: true
  }));
}

function removeDialogTree(id){
  var pathToDel = "data/ROGData/dialogs/"+id+".json";
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
  var pathToDials = "data/ROGData/dialogs/";
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

loadDialogsList();
console.log(dialogsList);
