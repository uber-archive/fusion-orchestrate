const fs = require('fs');

module.exports = function(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  readStream.pipe(writeStream);
  var endPromise = new Promise((resolve, reject) => {
    readStream.on('end', () => {
      writeStream.end();
      return resolve();
    });
    readStream.on('error', reject);
  });
  return endPromise;
};
