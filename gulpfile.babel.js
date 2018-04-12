
'use strict';

import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();

gulp.task('images', () =>
  gulp.src('src/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe($.size({title: 'img'}))
);

gulp.task('copy', () =>
  gulp.src([
    'src/**',
    '!src/js/**',
    '!src/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}))
);

gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  return gulp.src([
    'src/css/**/*.scss',
    'src/css/**/*.css'
  ])
    .pipe($.newer('.tmp/css'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/css'))
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/css'))
    .pipe(gulp.dest('.tmp/css'));
});


gulp.task('scripts', () =>
  gulp.src([
    './src/js/Energy.js',
    './src/js/Assign.js',
    './src/js/Plot.js',
    './src/js/main.js'
  ])
    .pipe($.newer('.tmp/js'))
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/js'))
    .pipe($.concat('app.min.js'))
    .pipe($.uglify({preserveComments: 'none'}))
    .pipe($.size({title: 'scripts'}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/js'))
    .pipe(gulp.dest('.tmp/js'))
);

gulp.task('html', () => {
  return gulp.src('src/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,src}',
      noAssets: true
    }))

    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['html', 'scripts', 'images', 'copy'],
    cb
  )
);


gulp.task('deploy', ['default'], () => {
  return gulp.src('dist/**/*')
    .pipe($.ghPages());
});
