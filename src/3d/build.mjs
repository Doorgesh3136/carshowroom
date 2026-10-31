// Builds the 3D showroom into plain scripts that also work when index.html is opened straight from disk:
//   ../../assets/showroom.bundle.js  three.js + showroom.js as one classic script (window.V8Showroom)
//   ../../assets/showroom-car.js     the car model as base64 (used when the page is opened as a file;
//                                    online the page downloads showroom-car.glb directly, with progress)
import {build} from 'esbuild';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const D = path.dirname(fileURLToPath(import.meta.url)), A = path.join(D, '..', '..', 'assets');
await build({
  entryPoints: [path.join(D, 'showroom.js')], bundle: true, minify: true, format: 'iife', globalName: 'V8Showroom',
  target: 'es2020', legalComments: 'eof', outfile: path.join(A, 'showroom.bundle.js'), logLevel: 'info'
});
const glb = fs.readFileSync(path.join(A, 'showroom-car.glb'));
fs.writeFileSync(path.join(A, 'showroom-car.js'), `window.V8_CAR_GLB="${glb.toString('base64')}";\n`);
console.log('showroom-car.js', (fs.statSync(path.join(A, 'showroom-car.js')).size / 1048576).toFixed(2), 'MB');
