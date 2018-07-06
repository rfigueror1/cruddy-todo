const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const counter = require('./counter');
const Promise = require('bluebird');
const readFilePromise = Promise.promisify(fs.readFile);

var items = {};

// Public API - Fix these CRUD functions ///////////////////////////////////////

exports.create = (text, callback) => {
  var id = counter.getNextUniqueId((err,id) => {
    var newDir = path.join(exports.dataDir, `${id}.txt`);
    fs.writeFile(newDir, text, (err) => {
      if (err) {
        throw ('error writing counter');
      } else {
        callback(null, {id: id, text: text});
      }
    });
  });
};

exports.readOne = (id, callback) => {
  var newDir = path.join(exports.dataDir, `${id}.txt`);
  fs.readFile(newDir, (error, item) => {
    if(error){
      callback(new Error(`No item with id: ${id}`));
    }
    callback(null, {id: id, text: item.toString()});
  });
};

exports.readAll = (callback) => {
  fs.readdir(exports.dataDir, (err, files) => {
    if(err){
      throw('error reading data folder');
    }
    //necessary to make promisify
    var data = _.map(files, (file) => {
      var id = path.basename(file, '.txt'); //obtain the id by splitting the file url removing .txt
      var filepath = path.join(exports.dataDir, file);
      return readFilePromise(filepath).then(fileData => {
        return {
          id:id,
          text:fileData.toString()
        };
      });
    });//makes an array of future promises
      Promise.all(data)
        .then(items => callback(null, items), err => callback(err));
    });
};

exports.update = (id, text, callback) => {
  var filepath = path.join(exports.dataDir, `${counter.reformatId(id)}.txt`);
  const flag = fs.constants.O_WRONLY | fs.constants.O_TRUNC;
  fs.writeFile(filepath, text, { flag }, (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { id, text });
    }
  });
};

exports.delete = (id, callback) => {
  var filepath = path.join(exports.dataDir, `${counter.reformatId(id)}.txt`);
  fs.unlink(filepath, (err) => {
    callback(err);
  });
};

// Config+Initialization code -- DO NOT MODIFY /////////////////////////////////

exports.dataDir = path.join(__dirname, 'data');

exports.initialize = () => {
  if (!fs.existsSync(exports.dataDir)) {
    fs.mkdirSync(exports.dataDir);
  }
};
