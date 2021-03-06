'use strict';

var gulp	= require('gulp');
var minify	= require('gulp-minify');
var include	= require("gulp-include");
var rename	= require("gulp-rename");
var voidLine= require('gulp-remove-empty-lines');

gulp.task('node', () => {
	return gulp.src('assets/node.js')
		.pipe(include({
			hardFail: true
		}))
		.pipe(rename('index.js'))
		// .pipe(minify())
		.pipe(voidLine())
		.pipe(gulp.dest("dist/"));
});

gulp.task('default', () => {
	console.log('please use: ');
	console.log("\tgulp node\t\t: compile for node js");
});


gulp.task('brighter', () => {
	return gulp.src('assets/brighter.js')
		.pipe(include({
			hardFail: true
		}))
		.pipe(rename('object-utils.js'))
		.pipe(voidLine())
		// .pipe(minify())
		.pipe(gulp.dest("../brighterjs/assets/plugins/"));
});