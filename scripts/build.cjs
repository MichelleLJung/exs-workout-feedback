const fs=require('fs'),path=require('path');
fs.mkdirSync('dist',{recursive:true});
for(const name of fs.readdirSync('.'))if(/\.(html|css|js|svg|ico|png)$/.test(name))fs.copyFileSync(name,path.join('dist',name));
require('esbuild').buildSync({entryPoints:['auth-entry.js'],outfile:'dist/auth.js',bundle:true,format:'iife',platform:'browser',target:'es2022'});
