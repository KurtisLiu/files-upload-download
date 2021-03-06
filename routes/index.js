var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var config = require('../config');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get('/filemanager', function(req, res) {
  fs.readdir(config.uploadDir, function(err, files) {
    res.render('fileUploadAndDownload', {files: files});
  });
});

router.get('/canvasexport', function(req, res) {
   res.render('canvasexport');
});

router.post('/files/export', function(req, res) {
  var imageData = req.body.imageData;
  res.setHeader('content-type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=canvas.png');

  var buffer = new Buffer(imageData, 'base64');
  res.write(buffer);
  res.end();
});

router.post('/files/upload', function(req, res, next) {
  console.log(config.uploadDir);
  var form = formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.uploadDir = config.uploadDir;
  form.keepExtensions = true;
  form.multiples = true;
  // form.maxFieldsSize = 2 * 1024 * 1024; // 单位为byte

  form.on('progress', function(bytesReceived, bytesExpected) {
    var progressInfo = {
      value: bytesReceived,
      total: bytesExpected
    };
    console.log('[progress]: ' + JSON.stringify(progressInfo));
  }); 

  form.on('end', function() {
    console.log('end'); 
    res.end('success');
  });

  form.on('error', function(err) {
    console.error('upload failed', err.message);
    next(err);
  });

  form.parse(req, function(err, fields, files) {
    for(var key in files) {
      var file = files[key];
      fs.rename(file.path, config.uploadDir + '/' + file.name, function(err) {
        console.log('rename %s failed', file.name);
      });
    }
  });
});

router.get('/files/download', function(req, res, next) {
  var filename = req.query.filename;    
  var downloadPath = path.join(config.uploadDir, filename);
  console.log(downloadPath);

  // 方法1
  // res.download(downloadPath, realName, function(err) {
  //   if(err) {
  //     next(err);
  //   }
  // });

      //方法2
  fs.exists(downloadPath, function(exists) {
    if(!exists) {
      res.send({message: 'File not exist'});
    } else {
      res.setHeader('content-type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURI(filename));
      var stream = fs.createReadStream(downloadPath);

      stream.on('data', function(chunk) {
        res.write(chunk);
      });
      //或者直接用
      // stream.pipe(res);

      stream.on('end', function() {
        res.end();
      })
    }
  });
});

module.exports = router;
