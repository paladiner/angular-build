var path = require('path');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var webpackDevMiddleware = require('webpack-dev-middleware');
var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
var webpack = require('webpack'), webpackCompiler;

// dev server
var express = require('express');
var del = require('del');
var fs = require('fs');
var app = express();
var port = process.env.PORT || 80;
var tinylr;

// path configuration
var bases = {
	src: path.resolve('./src'),
	assets: path.resolve('./src/assets'),
	dist: path.resolve('./dist')
};

// webpack configuration
var webpackConfig = {
	context: path.resolve(bases.dist + '/app'),
	entry: './webpack-entry.js',
	output: {
		path: bases.dist + '/app',
		publicPath: '/app',
		filename: 'bundle.js'
	},
	plugins: [
		// this section filled later
	],
	postLoaders: [
		{ loader: 'transform/cacheable?envify' }
	],
	devtool: 'eval'
};

// automatically find all angular dependencies
gulp.task('autodeps', function (callback) {
	gulp.src([bases.src + '/app/*.js', bases.src + '/app/components/**/*.js', bases.src + '/app/shared/**/*.js'])
		.pipe(plugins.requireAngular('YourApp', {
			filename: 'app/webpack-entry.js',
			errorOnMissingModules: false,
			rebase: '../../src/app/'
		}))
		.on('error', function(error) {
			console.log(error.toString());
			this.emit('end');
		})
		.pipe(gulp.dest('dist/'))
		.on('end', callback);
});

// automatically find all angular dependencies
gulp.task('autodeps:clean', function (callback) {
	del(bases.dist + '/app/webpack-entry.js', {force: true}, callback);
});

// webpack task to bundle all angular files
gulp.task('webpack:build', function(cb) {
	delete webpackConfig.devtool;

	webpackConfig.plugins.unshift(new webpack.DefinePlugin({
		'process.env': {
			NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production')
		}
	}));

	webpackConfig.plugins = webpackConfig.plugins.concat([
		new ngAnnotatePlugin({ add: true }),
		// new webpack.optimize.UglifyJsPlugin(),
		new webpack.optimize.OccurenceOrderPlugin()
	]);

	webpack(webpackConfig).run(function(err, stats) {
		if(err) {
			console.log('>> webpack err: ', err);
		}
		cb();
	});
});

// combine all vendor scripts to single file
gulp.task('vendor', function(callback) {
	var vendorModuleList = path.resolve(bases.src + '/app/app.vendor.js');
	var vendorScripts = require(vendorModuleList).vendor.map(function(scriptSrc) {
		return bases.src + '/app/vendor/' + scriptSrc;
	});
	delete require.cache[vendorModuleList];

	return gulp.src(vendorScripts)
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.concat('vendor.js'))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest(bases.dist + '/app/'));
});

// combine and compress vendor scripts
gulp.task('vendor:build', function(callback) {
	var vendorScripts = require(bases.src + '/app/app.vendor.js').vendor.map(function(scriptSrc) {
		return bases.src + '/app/vendor/' + scriptSrc;
	});

	return gulp.src(vendorScripts)
		.pipe(plugins.concat('vendor.js'))
		.pipe(plugins.uglify({preserveComments:false}))
		.pipe(gulp.dest(bases.dist + '/app/'));
});

// clean the "dist" directory
gulp.task('clean', function (cb) {
	del(bases.dist, {force: true}, cb);
});

// copy all files to dist directly (upd)
gulp.task('copy', function() {
	// copy shell html file and robots.txt
	gulp.src([bases.src + '/*.html', bases.src + '/*.txt'], {cwd: bases.src})
		.pipe(gulp.dest(bases.dist));

	// copy fonts/images and other files
	return gulp.src([
		bases.assets + '/fonts/**/*',
		bases.assets + '/icons/**/*',
		bases.assets + '/images/**/*'
	], {base: bases.assets}).pipe(gulp.dest(bases.dist + '/assets'));
});

// sass compile
gulp.task('sass', function () {
	gulp.src(bases.src + '/assets/scss/**/*.scss')
		.pipe(plugins.sourcemaps.init(/*{loadMaps: true}*/))
		.pipe(plugins.sass())
		.on('error', function(err) {
		  return plugins.notify().write(err);
		})
		.pipe(plugins.postcss([
			require('autoprefixer-core')({browsers: ['> 1%']})
		]))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(bases.dist + '/assets/css'))
		.on('end', function() {
			if(tinylr) {
				tinylr.changed({
					body: {
						files: ['dist/css/all.css']
					}
				});
			}
		});
});

// sass compile
gulp.task('sass:build', function () {
	gulp.src(bases.src + '/assets/scss/**/*.scss')
		.pipe(plugins.sass({
			 errLogToConsole: false,
			 onError: function(err) {
				 return plugins.notify().write(err);
			 }
		}))
		.pipe(plugins.postcss([
			require('autoprefixer-core')({browsers: ['> 1%']})
		]))
		.pipe(plugins.minifyCss({processImport:false}))
		.pipe(gulp.dest(bases.dist + '/assets/css'));
});

// combine all templates in single file so they can be cached
gulp.task('templates', function () {
	gulp.src([bases.src + '/app/components/**/*.html', bases.src + '/app/shared/**/*.html'])
		.pipe(plugins.angularTemplatecache({module: 'YourApp', base: path.normalize(bases.src + '/app') }))
		.pipe(gulp.dest(bases.dist + '/app/'))
		.on('end', function() {
			if(tinylr) {
				tinylr.changed({
					body: {
						files: ['dist/app/templates.js']
					}
				});
			}
		});
});

// combine + minify html templates
gulp.task('templates:build', function () {
	return gulp.src([bases.src + '/app/components/**/*.html', bases.src + '/app/shared/**/*.html'])
		.pipe(plugins.minifyHtml({
			empty: true, // do not remove empty attributes
			spare: true, // do not remove redundant attributes
			quotes: true // do not remove arbitrary quotes
		}))
		.pipe(plugins.angularTemplatecache({module: 'YourApp', base: bases.src + '/app'}))
		.pipe(gulp.dest(bases.dist + '/app/'));
});

gulp.task('cachebust', function(callback) {
  var originalFiles = require('vinyl-paths')();

  var revAll = new plugins.revAll({
	dontRenameFile: [
	  'index.html',
	  'robots.txt'
	]
  });

  gulp.src([
	bases.dist + '/index.html',
	bases.dist + '/app/**/*',
	bases.dist + '/assets/**/*'
  ], {base: bases.dist})
	.pipe(originalFiles)
	.pipe(revAll.revision())
	.pipe(gulp.dest(bases.dist))
	.on('end', function() {
	  // remove original files
	  var fs = require('fs');
	  del(originalFiles.paths.filter(function(itemPath) {
		return fs.statSync(itemPath).isFile() && path.basename(itemPath) !== 'index.html';
	  }), {force: true}, callback);
	});
});

// watch task
gulp.task('watch', function() {
	// handle app source
	plugins.watch(bases.src + '/assets/scss/**/*.scss', function() {
		gulp.start('sass');
	});
	plugins.watch([bases.src + '/app/components/**/*.html', bases.src + '/app/shared/**/*.html'], function() {
		gulp.start('templates');
	});
	plugins.watch([bases.src + '/app/vendor/**/*.js', bases.src + '/app/app.vendor.js'], function() {
		gulp.start('vendor');
	});

	// watch for angular project structure changes and update dependencies
	plugins.watch([bases.src + '/app/*.js', bases.src + '/app/components/**/*.js', bases.src + '/app/shared/**/*.js'], function() {
		gulp.start('autodeps');
	});

	// handle assets change
	plugins.watch([
		bases.src + '/*.html',
		bases.src + '/*.txt'
	]).pipe(gulp.dest(bases.dist));
	plugins.watch([
		bases.assets + '/fonts/**/*',
		bases.assets + '/icons/**/*',
		bases.assets + '/images/**/*'
	], {base: bases.assets}).pipe(gulp.dest(bases.dist + '/assets'));
});

// livereload task
gulp.task('livereload', function() {
	tinylr = require('tiny-lr')();
	tinylr.listen(35729);
});

// start dev/preview server 
gulp.task('server', function() {

	// simple webpack plugin to display errors in browser console
	function RedirectErrorsToConsole() {
	  this.apply = function(compiler) {
		compiler.plugin('done', function(stats) {
		  if (stats.hasErrors()) {
			var mainBundle = path.join(compiler.options.output.path, compiler.options.output.filename);
			var errors = stats.toString({
			  hash: false,
			  version: false,
			  timings: false,
			  assets: false,
			  chunks: false,
			  chunkModules: false,
			  modules: false,
			  cached: false,
			  reasons: false,
			  source: false,
			  errorDetails: true,
			  chunkOrigins: false,
			  modulesSort: false,
			  chunksSort: false,
			  assetsSort: false
			}).replace(/\n/g, '\\n').replace(/\[\d+m/g, '').replace(/'/g, '\\\'');
			compiler.outputFileSystem.writeFile(mainBundle, 'throw new Error(\'' + errors + '\')', function() {});
		  }
		});
	  };
	}

	// set dev environment
	webpackConfig.plugins.unshift(new webpack.DefinePlugin({
		'process.env': {
			NODE_ENV: JSON.stringify('development')
		}
	}));

	// redirect webpack errors to browser console instead of system console
	webpackConfig.plugins.push(new RedirectErrorsToConsole());

	// before static !
	var webpackCompiler = webpack(webpackConfig);
	app
		.use(webpackDevMiddleware(webpackCompiler, {
			publicPath: webpackConfig.output.publicPath,
			quiet: true,
			stats: {
				colors: true
			}
		}))
		.use(require('connect-livereload')({port: 35729}));

	// start simple SPA dev server
	app
		.use(express.static(bases.dist))
		.get(/^\/(?!(app|assets|components|shared)\/).*$/, function(req, res) {
			res.sendFile(bases.dist + '/index.html');
		});

	require('http').createServer(app).listen(port, function() {
		console.log('>>> listening on %d', port);
	});
	// require('https').createServer({
	// 	key: fs.readFileSync('cert.pem'),
	// 	cert: fs.readFileSync('cert.crt')
	// }, app).listen(port, function() {
	// 	console.log('>>> listening on %d', port);
	// });
});

// run test server with compressed assets
gulp.task('server:build', function() {
	// start simple SPA dev server
	app
		.use(express.static(bases.dist))
		.get('*', function(req, res) {
			res.sendFile(bases.dist + '/index.html');
		});

	require('http').createServer(app).listen(port, function() {
		console.log('>>> listening on %d', port);
	});
});

// open browser when everything ready
gulp.task('open-browser', function() {
	gulp.src(bases.src + '/index.html').pipe(plugins.open('', {
		url: 'http://localhost:' + port
	}));
});

// build task
gulp.task('build', function(callback) {
	runSequence(
		'clean',
		'copy',
		'autodeps',
		['templates:build', 'sass:build', 'vendor:build', 'webpack:build'],
		'autodeps:clean',
		'cachebust',
		callback);
});


// default task to start dev environment
gulp.task('default', function(callback) {
	runSequence(
		'clean',
		'copy',
		'autodeps',
		['templates', 'sass', 'vendor'],
		['watch', 'livereload', 'server'],
		'open-browser',
		callback);
});