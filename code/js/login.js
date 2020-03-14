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


//userName = document.getElementById("login").value
//password = document.getElementById("password").value

simpleGit.addConfig('user.email','astralpetalgames@gmail.com');
simpleGit.addConfig('user.name','Astral Petal Games');
// Add remore repo url as origin to repo
gitHubUrl = `https://${userName}:${password}@github.com/${userName}/${repo}`;
console.log("Logged In");
//simpleGitPromise.addRemote('origin',gitHubUrl);
shellJs.cd('../../data/ROGData/');



console.log("Pulling...");
simpleGitPromise.pull("origin","master")
    .then((success) => {
      console.log('repo successfully pulled');
    },(failed)=> {
      console.log('repo pull failed');
    });

console.log("Adding...");
simpleGitPromise.add('.')
.then(
  (addSuccess) => {
    console.log(addSuccess);
  }, (failedAdd) => {
    console.log('adding files failed');
  });
  // Commit files as Initial Commit
  console.log("Committing...");
  simpleGitPromise.commit('My commit qui est super vraiment bien.')
  .then(
    (successCommit) => {
      console.log(successCommit);
    }, (failed) => {
      console.log('failed commmit');
    });
    // Finally push to online repository
    console.log("Pushing...");
    simpleGitPromise.push('origin','master')
    .then((success) => {
      console.log('repo successfully pushed');
    },(failed)=> {
      console.log('repo push failed');
    });
