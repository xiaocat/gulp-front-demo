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
    revCollector = require('gulp-rev-collector');

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
  }
};

// ########################### 开发环境 ###########################

gulp.task('scripts:coffee', function(){
  return gulp.src(config.app + '/scripts/**/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest(config.app + '/scripts/coffee'))
    .pipe(notify({ message: '@@scripts:coffee  【' + config.app + '】  task complete' }));
});

gulp.task('styles:sass', function(){
  return sass(config.app + '/styles/**/*.sass', {style: 'expanded'})
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(notify({ message: '@@styles:autoprefixer  【' + config.app + '】  task complete' }))
    .pipe(gulp.dest(config.app + '/styles/sass'))
    .pipe(notify({ message: '@@styles:sass  【' + config.app + '】  task complete' }));
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
  var server = livereload.listen(config.server);
  // 看守所有位在 dist/  目录下的档案，一旦有更动，便进行重整
  gulp.watch([config.app + '/**']).on('change', function(file) {
    gulp.src(config.app).pipe(notify({ message: file.path}));;
    livereload.changed(file.path);
  });
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
