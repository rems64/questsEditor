const path = require("path")

console.log(__dirname);

const simpleGit = require('simple-git')(path.join(__dirname, "../../data/ROGData"));// Shelljs package for running shell tasks optional
const simpleGitPromise = require('simple-git/promise')(path.join(__dirname, "../../data/ROGData"));

simpleGitPromise.checkoutBranch("Toto", "master").then((success)=>{
  console.log("Success!");
  simpleGit.checkout("Toto")
}, (failed => {
  console.log("Exist déjà, basculement");
  simpleGit.checkout("Toto")
  console.log("Tout va bien");
}));
