var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    coffee = require('gulp-coffee'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    gutil = require('gulp-util'),
    minifyhtml = require('gulp-minify-html'),
    livereload = require('gulp-livereload'),
    rev = require('gulp-rev'),
    through = require('through2'),
    path = require('path'),
    revCollector = require('gulp-rev-collector');


// ########################### 项目配置 ###########################
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var Q = require('q');
var _ = require('underscore');


var opts = null;	//配置文件中require.config()的参数,会通过正则匹配出来,用来算文件路径

var diskBase;	   //当前业务模块的根目录

var confFile;	   //配置文件的路径+文件名

var aliaMap = {};   //别名配置

var depMap = {};	//依赖版本

var verMap = {};	//版本号配置 ，key:路径别名,value:文件md5值

var aliaPaths = []; //所有的别名路径集合，用来计算文件对应的别名路径

var conf = (function() {
  return {
    config:{
      fileset:["demo-cache/scripts/coffee/main.js"],
      dest:"dist/demo-cache"
    },
    js: {
      fileset: ["demo-cache/scripts/coffee/**/*.js","demo-cache/scripts/libs/*.js"],
      dest: "dist/demo-cache"
    },
    html:{
      fileset:["demo-cache/*.html","!dist/","!dist/**/*.*"],
      dest:"dist/demo-cache"
    }
  };

})();

var sepReg = new RegExp("\\" + path.sep, "g");

function tryEval(obj) {
  var json;
  try {
    json = eval('(' + obj + ')');
  } catch (err) {

  }
  return json;
}

//统一文件名的路径分割符，
function formatFileName(name) {
  return name.replace(/[\\\/]+/g, path.sep).replace(/^(\w)/, function (str,cd) {
    return cd.toUpperCase();
  });
}

//过滤掉依赖表里的关键字
function filterDepMap(depMap) {
  if(depMap == null || depMap == undefined) return [];
  depMap = depMap.filter(function (dep) {
    return ["require", "exports", "module"].indexOf(dep) === -1;
  });

  return depMap.map(function(dep) {
    return dep.replace(/\.js$/,'');
  });
}

//根据文件名计算对应别名路径
function getAliaPath(file) {
  file = file.replace(sepReg, "/");

  //paths配置转成数组，按路径级数排序
  if (aliaPaths.length === 0) {
    for (var alia in opts.paths) {
      aliaPaths.push({
        alia:alia,
        path:opts.paths[alia]
      });
    }

    aliaPaths.sort(function(path1,path2) {
      return path2.path.split(/[\\\/]/).length - path1.path.split(/[\\\/]/).length;
    });
  }

  //优先匹配路径级数多的
  for (var i = 0; i < aliaPaths.length; i++) {
    var aliaPath = aliaPaths[i];
    var fullPath = path.join(opts.baseUrl, aliaPath.path);
    var pathReg = new RegExp('^.*?' + fullPath.replace(/\\/g, '/') + '(.*?)\.js$');
    var matches = file.match(pathReg);
    if (matches) {
      return aliaPath.alia + matches[1];
    }
  }

  //todo?
  return file.replace(diskBase.replace(sepReg, "/"), '').replace(/\.js$/, '');
}

//根据文件内容计算md5串
function getDataMd5(data) {
  return crypto.createHash('md5').update(data).digest('base64');
}

//根据文件名计算发布包对应该文件路径
function getDestFile(file) {
  try {
    var fileDirs = file.split(path.sep);
    fileDirs.shift();
    return formatFileName(_.unique(path.join(__dirname, conf.js.dest).split(path.sep).concat(fileDirs)).join(path.sep));
  } catch(e) {
    return null;
  }
}

//根据发布包文件计算原文件名路径
function getSrcFile(file) {
  file = formatFileName(file);
  var destPath = formatFileName(path.join(__dirname, conf.js.dest));
  var restPath = file.replace(/[\\\/]+/g, '/').replace(destPath.replace(/[\\\/]+/g, '/'), '').replace(/[\\\/]+/g,path.sep);
  //todo
  var fileName = formatFileName(path.join(__dirname, '../', restPath));

  return fileName;
}

gulp.task('makeOpts',function() {
  return gulp.src(conf.config.fileset)
    .pipe(through.obj(function(file,enc,cb) {
      var js = file.contents.toString();
      var name = formatFileName(file.path);
      confFile = name;

      var configMatches = js.match(/require(js)?\.config\s*?\(\s*?({[\s\S]*?})\s*?\)/);
      var options = configMatches[2];
      opts = tryEval(options);

      //todo 有点不靠谱
      var dirs = name.split(path.sep);
      var base = opts.baseUrl.split('/')[0];
      dirs.splice(dirs.indexOf(base));
      diskBase = dirs.join(path.sep);

      var aliaPath = getAliaPath(name);

      //提取依赖，用来合并
      js.replace(/\s*require(js)?\s*\(\s*(\[[^\]\[]*?\])/, function (str, suf,map) {
        var map = tryEval(map);
        if(map) depMap[aliaPath] = filterDepMap(map);
      });

      this.push(file);
      cb();
    }))
});

//遍历所有文件，生成依赖关系配置
gulp.task('makeDeps', ['makeOpts'], function () {
  return gulp.src(conf.js.fileset)
    //.pipe(uglify({
    //	mangle: {
    //		except: ['require', 'requirejs', 'exports']
    //	}
    //}))
    .pipe(through.obj(function (file, enc, cb) {
      var js = file.contents.toString();

      var name = formatFileName(file.path);

      var aliaPath = getAliaPath(name);

      aliaMap[aliaPath] = name;

      //todo 在这里把文件内容按规范修改掉？
      //提取依赖，用来合并
      js.replace(/;?\s*define\s*\(([^(]*),?\s*?function\s*\([^\)]*\)/, function (str, map) {

        var depStr = map.replace(/^[^\[]*(\[[^\]\[]*\]).*$/, "$1");

        if (/^\[/.test(depStr)) {
          var arr = tryEval(depStr);
          try {
            depMap[aliaPath] = filterDepMap(arr);
          } catch (e) {
            gutil.log("makeDeps Error: " + e);
          }
        }

      });

      this.push(file);
      cb();
    }))
    .pipe(through.obj(function (file, enc, cb) {
      var name = formatFileName(file.path);
      var aliaPath = getAliaPath(name);
      verMap[aliaPath] = getDataMd5(file.contents);

      this.push(file);
      cb();
    }))
    .pipe(gulp.dest(conf.js.dest));
});
var packPromises = [];

gulp.task('makePacks', ['makeDeps'], function () {

  //递归依赖关系，去重
  function makeDeps(deps) {
    var set = [];

    function make(deps) {
      deps.forEach(function (dep) {
        var currDeps = depMap[dep];		 //每个文件对应的依赖
        if (currDeps) {
          make(currDeps);
        }
        set.push(dep);
      });
    }

    make(deps);

    return _.unique(set);
  }

  gulp.src(conf.js.dest)
    .pipe(through.obj(function (file, enc, cb) {
      gutil.log(123);
    }));

  var defineWithModuleNameReg = /;?\s*define\s*\(\s*["']/;
  var defineWithoutModuleNameReg = /(;?\s*define\s*)\(\s*([^,]*),/;

  for (var aliaPath in depMap) {
    var clearDepMap = makeDeps(depMap[aliaPath]);

    var fileMap = clearDepMap.map(function (dep) {
      return aliaMap[dep];
    });

    var destFile = aliaMap[aliaPath];
    fileMap.push(destFile);

    //修改原文件地址为生成发布包对应文件地址
    var destFileMap = fileMap.map(function (file) {
      return getDestFile(file);
    });



    (function (destFileMap) {
      var deferred = Q.defer();

      var destFile = _.last(destFileMap);
      var name = destFile.split(/[\\\/]+/).pop();
      var dir = destFile.replace(name, '');

      gulp.src(destFileMap)
        .pipe(through.obj(function (file, enc, cb) {
          var js = file.contents.toString();
          var name = getSrcFile(file.path);
          var aliaPath = getAliaPath(name);

          if (!defineWithModuleNameReg.test(js)){
            //添加模块名称
            js = js.replace(defineWithoutModuleNameReg, function (str, def, mod) {
              return ';define("' + aliaPath + '",' + mod + ',';
            });

            file.contents = new Buffer(js);
          }

          this.push(file);
          cb();
        }))
        .pipe(concat(name))
        //.pipe(uglify({
        //	mangle: {
        //		except: ['require', 'requirejs', 'exports']
        //	}
        //}))
        .pipe(through.obj(function (file, enc, cb) {
          var name = getSrcFile(file.path);
          var aliaPath = getAliaPath(name);
          gutil.log('start');

          verMap[aliaPath] = getDataMd5(file.contents);

          this.push(file);
          gutil.log('ready');
          deferred.resolve();
          cb();
        }))
        .pipe(gulp.dest(dir));

      gutil.log('go!');
      // deferred.resolve();
      packPromises.push(deferred.promise);

    })(destFileMap);

  }

});
gulp.task('makeConf', ['makePacks'], function () {
  gutil.log(packPromises);
  Q.all(packPromises)
    .done(function () {
      gutil.log(confFile);
      gulp.src(getDestFile(confFile))
        .pipe(through.obj(function (file, enc, cb) {
          var js = file.contents.toString();
          gutil.log(js);
          js = js.replace(/require(js)?\.config\s*?\(\s*?({[\s\S]*?)}\s*?\)/, "require.config($2" + ',\n"verMap" : ' + JSON.stringify(verMap) + "})");

          file.contents = new Buffer(js);
          this.push(file);
          cb();
        }))
        .pipe(gulp.dest(conf.config.dest));
    });
});

gulp.task('makeTpls',function() {
  gulp.src(conf.html.fileset)
    .pipe(gulp.dest(conf.html.dest));
});

gulp.task('default', ['makeTpls','makeConf']);


// ########################### 项目配置 ###########################

var config = {
  app: 'demo-cache',
  dist: 'dist',
  server: {
    port: 9999,
    host: 'localhost',
    start: true,
    basePath: this.app,
    reloadPage: 'index.html'
  },
  noteLeft: "【",
  noteRight: "】",
  noteConcat: "——",
  noteComplete: "task complete 👍 👍 👍",
  note: function(name, path){
    return this.noteLeft + name + this.noteRight + this.noteConcat + this.noteLeft + path + this.noteRight + this.noteConcat + this.noteComplete;
  }
};

// ########################### 开发环境 ###########################

gulp.task('scripts:coffee', function(){
  return gulp.src(config.app + '/scripts/**/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest(config.app + '/scripts/coffee'))
    .pipe(through.obj(function(file, enc, cb){
      gutil.log(config.note(file.relative, file.path));
      cb();
    }))
});

gulp.task('styles:sass', function(){
  return sass(config.app + '/styles/**/*.sass', {style: 'expanded'})
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest(config.app + '/styles/sass'))
    .pipe(through.obj(function(file, enc, cb){
      gutil.log(config.note(file.relative, file.path));
      cb();
    }))
});

gulp.task('clean:dev', function(){
  return gulp.src([config.app + '/scripts/coffee', config.app + '/styles/sass'])
    .pipe(clean())
    .pipe(notify({ message: '@@clean:dev  【' + config.app + '】  task complete'}));
});

gulp.task('watch:dev', function(){
  gulp.watch(config.app + '/styles/*.sass', ['styles:sass']);
  gulp.watch(config.app + '/scripts/**/*.coffee', ['scripts:coffee']);

  // 建立即时重整伺服器
  // var server = livereload.listen(config.server);
  // 看守所有位在 dist/  目录下的档案，一旦有更动，便进行重整
  // gulp.watch([config.app + '/**']).on('change', function(file) {
  //   gulp.src(config.app).pipe(notify({ message: file.path}));;
  //   livereload.changed(file.path);
  // });
});

gulp.task('start:dev', ['styles:sass', 'scripts:coffee'], function(){
  gulp.start('watch:dev');
});

// ########################### 测试及产品环境 ###########################

gulp.task('styles', function() {
  return gulp.src(config.app + '/styles/**/*.css')
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest(config.dist + '/styles/src'))
    // .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest(config.dist + '/styles'))
    .pipe(rev())
    // .pipe(gulp.dest(config.dist + '/styles'))
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.dist + '/styles'))
    .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('scripts', function() {
  return gulp.src(config.app + '/scripts/**/*.js')
    // .pipe(jshint())
    // .pipe(jshint.reporter('default'))
    // .pipe(concat('main.js'))
    .pipe(gulp.dest(config.dist + '/scripts/src'))
    // .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(config.dist + '/scripts/'))
    .pipe(rev())
    // .pipe(gulp.dest(config.dist + '/scripts/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.dist + '/scripts'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('images', function() {
  return gulp.src(config.app + '/images/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest(config.dist + '/images'))
    .pipe(notify({ message: 'Images task complete' }));
});

gulp.task('html', function(){
  return gulp.src(config.app + '/**/*.html')
    // .pipe(minifyhtml())
    .pipe(gulp.dest(config.dist))
    .pipe(notify({ message: 'Html task complete' }));
});

//替换文件路径
gulp.task('changePath', function(){
  return gulp.src([config.dist + '/**/*.json', config.dist + '/*.html'])
    .pipe( revCollector({
            replaceReved: true,
        }))
    .pipe(gulp.dest(config.dist))
});

gulp.task('clean', function(){
  return gulp.src([config.dist + '/*'])
    .pipe(clean());
});

// ########################### 组合命令 ###########################

gulp.task('dev', ['clean:dev'], function(){
  gulp.start('start:dev');
});

gulp.task('build', ['clean'], function(){
  gulp.start('styles', 'scripts', 'images', 'html');
});

gulp.task('release',function(){
  gulp.start('changePath');
});
