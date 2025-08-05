const fs = require('fs');

module.exports = {
  getEndPoints: function() {
    // Get the paths to all the index.js files recursively nested in the ./api using fs
    const apiDir = `${__dirname}`;

    const apiEndpointPaths = getAPIEndpointPaths(apiDir, true);

    const endpoints = {};
    apiEndpointPaths.forEach(path => {
      const endpointName = path.replace(apiDir + '/', '/api/').replace('/index.js', '');
      const endpointModule = require(path);
      endpoints[endpointName] = endpointModule;
    });

    return endpoints;
  }
}

function getAPIEndpointPaths(dir, ignoreIndex = false) {
  const paths = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    if (fs.statSync(fullPath).isDirectory()) {
      paths.push(...getAPIEndpointPaths(fullPath)); // Recursively get paths from subdirectories
    } else if (!ignoreIndex && file === 'index.js') {
      paths.push(fullPath); // Add the index.js file path
    }
  }
    
  return paths;
}