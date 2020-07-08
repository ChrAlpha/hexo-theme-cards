const gulp = require('gulp');
const stylus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify-es').default;
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const del = require('del');

const configs = {
    autoprefixer: {
        overrideBrowserslist: [
            'last 2 versions',
            '> 1%',
            'Chrome >= 40',
            'Firefox >= 40',
            'ie >= 10',
            'Safari >= 8'
        ]
    },
    uglify: {
        toplevel: true
    },
    cleanCSS: {
        compatibility: 'ie10'
    }
}

function clean() {
    return del(['./dist/**/*']);
}

function ignore() {
    return del(['./dist/**/_*/**', './dist/**/_*', './tmp']);
}

function minifyJS() {
    return gulp.src('./source/**/*.js')
        .pipe(gulp.dest('./dist'))
        .pipe(uglify(configs.uglify))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist'));
}

function compileStylus() {
    return gulp.src('./tmp/**/*.styl')
        .pipe(stylus())
        .pipe(autoprefixer(configs.autoprefixer))
        .pipe(gulp.dest('./dist'))
        .pipe(cleanCSS(configs.cleanCSS))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist'));
}

function minifyCSS() {
    return gulp.src('./source/**/*.css')
        .pipe(autoprefixer(configs.autoprefixer))
        .pipe(gulp.dest('./dist'))
        .pipe(cleanCSS(configs.cleanCSS))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist'));
}

module.exports = {
    clean: clean,
    minifyJS: minifyJS,
    compileStylus: compileStylus,
    minifyCSS: minifyCSS,
    ignore: ignore
};

gulp.task('rmHexoConfig', function () {
    gulp.src('./source/**/*.styl')
        .pipe(replace(/convert\((.*?)\) \|\|\ /g, ''))
        .pipe(gulp.dest('./tmp'));
});

gulp.task('dist', gulp.series(
    clean,
    gulp.parallel(
        minifyJS,
        compileStylus,
        minifyCSS
    ),
    ignore
));

gulp.task('default', gulp.series('dist'));
