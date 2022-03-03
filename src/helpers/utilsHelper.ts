import { Container } from 'typedi';
import config from '../config';

module.exports = {
  // To Generate Random Password
  generateRandomWord: (length, includeSpecial) => {
     var result           = '';
     var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     if (includeSpecial) {
       characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()[]{}~<>;:-=';
     }
     var charactersLength = characters.length;
     for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }

     return result;
  },
  // To remove a file
  removeFile: async (filepath) => {
    return await new Promise ((resolve, reject) => {
      require('fs').unlink(path, (err) => {
        if (err) {
          Logger.log(err);
          reject(err);
        }
        else {
          resolve(true);
        }
      });
    });
  },

  getNumberOfDays: (start, end) => {
    const date1 = new Date(start);
    const date2 = new Date(end);

    // One day in milliseconds
    const oneDay = 1000 * 60 * 60 * 24;

    // Calculating the time difference between two dates
    const diffInTime = date2.getTime() - date1.getTime();

    // Calculating the no. of days between two dates
    const diffInDays = Math.round(diffInTime / oneDay);

    return diffInDays;
  },

  // To Handle Base 64 file writing
  writeBase64File: async (base64, filename) => {
    const Logger = Container.get('logger');

    // Remove png or jpg
    var sizeOf = require('image-size');
    var base64Data = base64.split(';base64,').pop();
    var img = Buffer.from(base64Data, 'base64');
    var dimensions = sizeOf(img);

    // Only proceed if image is equal to or less than 256, allowign it though should be only 128x128
    if (dimensions.width > 256 || dimensions.height > 256) {
      Logger.error("Image size check failed... returning");
      return false;
    }

    // only proceed if png or jpg
    // This is brilliant: https://stackoverflow.com/questions/27886677/javascript-get-extension-from-base64-image
    // char(0) => '/' : jpg
    // char(0) => 'i' : png
    let fileext;
    console.log(base64Data.charAt(0));
    if (base64Data.charAt(0) == '/') {
      fileext = '.jpg';
    }
    else if (base64Data.charAt(0) == 'i') {
      fileext = '.png';
    }
    else {
      return false;
    }

    const filepath = config.staticCachePath + filename + fileext;

    // Write the file
    return await new Promise ((resolve, reject) => {
      require("fs").writeFile(filepath, base64Data, 'base64', function(err) {
        if (err) {
          Logger.log(err);
          reject(err)
        }
        else {
          resolve(config.fsServerURL + filename + fileext);
        }
      });
    })
  }
};
