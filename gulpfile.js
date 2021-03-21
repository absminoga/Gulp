"use strict";

let gulp = require("gulp"),
	jade = require('gulp-jade'), //препроцессор HTML
	sass = require("gulp-sass"), //препроцессор CSS
	cssmin = require("gulp-cssmin"), //минификатор CSS
	cleancss = require("gulp-clean-css"),
	clean = require('gulp-clean'),
	prefixer = require("gulp-autoprefixer"), //Добавим вендорные префиксы
	uglify = require("gulp-uglify"), //минификатор JS
	babel = require("gulp-babel"), //переводит js-файлы в формат, понятный даже тупому ослику(IE)ю Если точнее, конвертирует javascript стандарта ES6 в ES5
	rename = require("gulp-rename"), //переименовывает файлы, добавляет им префиксы и суффиксы
	include = require("gulp-file-include"), //импорт одних файлов в другие (работает с HTML, SCSS/CSS и JS, но нужен он нам в основном для импорта HTML)
	imagemin = require("gulp-imagemin"), //пережимает изображения
	recompress = require("imagemin-jpeg-recompress"), //тоже пережимает, но лучше. Плагин для плагина
	pngquant = require("imagemin-pngquant"),
	webp = require('gulp-webp'),
	webpcss = require("gulp-webpcss"),
	concat = require("gulp-concat"), //склеивает css и js-файлы в один
	plumber = require('gulp-plumber'), // выводит сообщение про ошибку
	del = require("del"), //удаляет указанные файлы и директории. Нужен для очистки перед билдом
	ttf2woff = require("gulp-ttf2woff"), //конвертирует шрифты в веб-формат
	ttf2woff2 = require("gulp-ttf2woff2"), //конвертирует шрифты в веб-формат
	ttf2eot = require("gulp-ttf2eot"), //конвертирует шрифты в веб-формат
	notify = require('gulp-notify'),
	size = require("gulp-filesize"), //выводит в консоль размер файлов до и после их сжатия, чем создаёт чувство глубокого морального удовлетворения, особенно при минификации картинок
	rsync = require("gulp-rsync"), //заливает файлы проекта на хостинг по ftp с заданными параметрами
	browserSync = require("browser-sync"), //сервер для отображения в браузере в режиме реального времени
	sourcemaps = require("gulp-sourcemaps"); //рисует карту слитого воедино файла, чтобы было понятно, что из какого файла бралось

//Компилируем JADE в HTML
gulp.task('jade', function () {
	return gulp.src('src/jade/*.jade')
		.pipe(plumber({
			errorHandler: notify.onError("Error Jade: <%= error.message %>")
		})) // проверка jade на ошибки и вывод их в консоль
		.pipe(jade())
		// .pipe(gulp.dest('src'))
		.pipe(gulp.dest('build'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

//Компилируем SCSS-код в CSS
gulp.task("scss", function () {
	return gulp
		.src("src/scss/**/*.scss") //берём все файлы в директории scss и директорий нижнего уровня
		.pipe(sourcemaps.init()) //инициализируем sourcemaps, чтобы он начинал записывать, что из какого файла берётся
		.pipe(plumber({
			errorHandler: notify.onError("Error SCSS: <%= error.message %>")
		})) // проверка scss на ошибки и вывод их в консоль
		.pipe(sass()) //конвертируем scss в css и импортируем все импорты
		// .pipe(
		// 	cleancss({
		// 		//минифицируем полученный файл. Eсли разкоментировать не забудь про suffix: ".min",
		// 		compatibility: "ie8",
		// 		level: {
		// 			1: {
		// 				specialComments: 0,
		// 				removeEmpty: true,
		// 				removeWhitespace: true,
		// 			},
		// 			2: {
		// 				mergeMedia: true,
		// 				removeEmpty: true,
		// 				removeDuplicateFontRules: true,
		// 				removeDuplicateMediaBlocks: true,
		// 				removeDuplicateRules: true,
		// 				removeUnusedAtRules: true,
		// 			},
		// 		},
		// 	}),
		// )
		// .pipe(
		// 	rename({
		// 		suffix: ".min",
		// 	}),
		// ) //переименовываем файл, чтобы было понятно, что он минифицирован - если разкоментировать не забудь про .pipe(cssmin())
		.pipe(
			prefixer({
				//добавляем вендорные префиксы
				overrideBrowserslist: ["last 8 versions"],
				browsers: [
					//список поддерживаемых браузеров и их версия - ВНИМАНИЕ! данная опция влияет только на расстановку префиксов и не гарантирут 100% работы сайта в этих браузерах.
					"Android >= 4",
					"Chrome >= 20",
					"Firefox >= 24",
					"Explorer >= 11",
					"iOS >= 6",
					"Opera >= 12",
					"Safari >= 6",
				],
			}),
		)
		.pipe(webpcss())
		.pipe(sourcemaps.write()) //записываем карту в итоговый файл
		.pipe(gulp.dest("build/css")) //кладём итоговый файл в директорию build/css
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		) //обновляем браузер
		.pipe(size()); //смотрим размер получившегося файла
});

// Установка библиотек через npm
gulp.task("style", function () {
	//создаём единую библиотеку из css-стилей всех плагинов
	return gulp
		.src([
			//указываем, где брать исходники. Отключите то, что вам не нужно.
			"node_modules/normalize.css/normalize.css",
		])
		.pipe(concat("libs.min.css")) //склеиваем их в один файл с указанным именем
		// .pipe(cssmin()) //минифицируем полученный файл
		.pipe(gulp.dest("build/css")) //кидаем готовый файл в директорию
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		) //обновляем браузер
		.pipe(size());
});

gulp.task("js", function () {
	//минифицируем наш main.js и перекидываем в директорию build
	return gulp
		.src("src/js/*.js")
		.pipe(plumber({
			errorHandler: notify.onError("Error JS: <%= error.message %>")
		})) // проверка js на ошибки и вывод их в консоль
		.pipe(size())
		.pipe(babel())
		// .pipe(uglify()) // Отключили минимализацию JS
		// .pipe(
		// 	rename({
		// 		suffix: ".min",
		// 	}),
		// )
		.pipe(gulp.dest("build/js"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		) //обновляем браузер
		.pipe(size());
});

// Установка библиотек через npm
gulp.task("script", function () {
	return gulp
		.src([
			//тут подключаем разные js в общую библиотеку. Отключите то, что вам не нужно.
			"node_modules/jquery/dist/jquery.js"
		])
		.pipe(size())
		.pipe(babel())
		.pipe(concat("libs.min.js"))
		// .pipe(uglify()) 
		.pipe(gulp.dest("build/js"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		) //обновляем браузер
		.pipe(size());
});


gulp.task("font-woff", function () {
	//перекидываем шрифты из директории src в build, а заодно следим за новыми файлами, чтобы обновлять браузер, когда появляется шрифт
	return gulp
		.src("src/fonts/**/*.+(eot|svg|ttf|otf|woff|woff2)")
		.pipe(ttf2woff())
		.pipe(gulp.dest("build/fonts/"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		);
});

gulp.task("font-woff2", function () {
	//перекидываем шрифты из директории src в build, а заодно следим за новыми файлами, чтобы обновлять браузер, когда появляется шрифт
	return gulp
		.src("src/fonts/**/*.+(eot|svg|ttf|otf|woff|woff2)")
		.pipe(ttf2woff2())
		.pipe(gulp.dest("build/fonts/"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		);
});

gulp.task("font-eot", function () {
	//перекидываем шрифты из директории src в build, а заодно следим за новыми файлами, чтобы обновлять браузер, когда появляется шрифт
	return gulp
		.src("src/fonts/**/*.+(eot|svg|ttf|otf|woff|woff2)")
		.pipe(ttf2eot())
		.pipe(gulp.dest("build/fonts/"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		);
});

gulp.task("images", function () {
	//пережимаем изображения и складываем их в директорию build
	return gulp
		.src("src/images/**/*.+(png|jpg|jpeg|gif|svg|ico|webp)")
		.pipe(size())
		.pipe(
			imagemin(
				[
					recompress({
						//Настройки сжатия изображений. Сейчас всё настроено так, что сжатие почти незаметно для глаза на обычных экранах. Можете покрутить настройки, но за результат не отвечаю.
						loops: 4, //количество прогонок изображения
						min: 80, //минимальное качество в процентах
						max: 100, //максимальное качество в процентах
						quality: "high", //тут всё говорит само за себя, если хоть капельку понимаешь английский
						use: [pngquant()],
					}),
					imagemin.gifsicle(), //тут и ниже всякие плагины для обработки разных типов изображений
					imagemin.optipng(),
					imagemin.svgo(),
				],
			),
		)
		.pipe(gulp.dest("build/images"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		)
		.pipe(size());
});

gulp.task("webp", function () {
	return gulp
		.src("src/images/**/*.+(png|jpg|jpeg|gif|svg|ico|webp)")
		.pipe(size())
		.pipe(webp({
			quality: 75,
			method: 6,
		}))
		.pipe(gulp.dest("build/images"))
		.pipe(
			browserSync.reload({
				stream: true,
			}),
		)
		.pipe(size())
});

//Следим за изменениями в файлах и директориях и запускаем задачи, если эти изменения произошли
gulp.task("watch", function () {
	gulp.watch("src/scss/**/*.scss", gulp.parallel("scss"));
	gulp.watch("src/**/*.jade", gulp.parallel("jade"));
	gulp.watch(
		"src/fonts/**/*.*",
		gulp.parallel("font-woff", "font-woff2", "font-eot"),
	);
	gulp.watch("src/js/**/*.js", gulp.parallel("js"));
	gulp.watch("src/images/**/*.*", gulp.parallel("images", "webp"));
});

//Настройки лайв-сервера
gulp.task("browser-sync", function () {
	browserSync.init({
		server: {
			baseDir: "build/", //какую папку показывать в браузере
		},
		browser: [""], //в каком браузере
		//tunnel: " ", //тут можно прописать название проекта и дать доступ к нему через интернет. Работает нестабильно, запускается через раз. Не рекомендуется включать без необходимости.
		//tunnel:true, //работает, как и предыдущяя опция, но присваивает рандомное имя. Тоже запускается через раз и поэтому не рекомендуется для включения
		// host: "192.168.0.104", //IP сервера в локальной сети. Отключите, если у вас DHCP, пропишите под себя, если фиксированный IP в локалке.
		notify: false,
		//tunnel: true,
		host: 'localhost',
		port: 8081,
		logPrefix: "Zubrin Serhij"
	});
});

// Удаляет папку build
gulp.task('delete', function () {
	return gulp.src('build', {
		read: false
	})
		.pipe(clean());
});

//Очистки директории со шрифтами в build.
gulp.task("deletefonts", async function () {
	return del.sync("build/fonts/**/*.*");
});

//Очистки директории с картинками в build.
gulp.task("deleteimg", async function () {
	return del.sync("build/images/**/*.*");
});

// Создаёт папку build
gulp.task('build', gulp.series('jade', 'scss', 'js', 'style', 'script', 'font-woff', 'font-woff2', 'font-eot', 'images'));

gulp.task("deploy", function () {
	//грузим файлы на хостинг по FTP
	return gulp.src("build/**").pipe(
		rsync({
			root: "build/", //откуда берём файлы
			hostname: "yourLogin@yourIp", //ваш логин на хостинге@IPхостинга
			destination: "sitePath", //папка, в которую будем загружать
			//port: 25212, //порт, к которому пойдёт подключение. Нужна, если нестандартный порт
			include: ["*.htaccess"], //файлы, которые нужно включить в передачу
			exclude: ["**/Thumbs.db", "**/*.DS_Store"], //файлы, которые нужно исключить из передачи
			recursive: true, //передавать все файлы и папки рекурсивно
			archive: true, //режим архива
			silent: false, //отключим ведение журнала
			compress: true, //включим сжатие
			progress: true, //выведем прогресс передачи в консоль
		}),
	);
});

//Запускает Gulp (все задачи одновременно)
gulp.task(
	"default",
	gulp.parallel(
		"browser-sync",
		"watch",
		"scss",
		"style",
		"script",
		"js",
		"jade",
		"font-woff",
		"font-eot",
		"font-woff2",
		"images",
	),
);