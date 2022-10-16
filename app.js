var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var AdminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var fileUpload = require('express-fileupload')

var db = require('./config/connection')

var app = express();
var session = require('express-session')
var hbs = require('express-handlebars');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials'
}))


app.set('views', [path.join(__dirname, 'views'),
path.join(__dirname, 'views/admin/'),
path.join(__dirname, 'views/user/')]);



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:"key",cookie:{maxAge:600000000000}}))


app.use('/admin', AdminRouter);
app.use('/users', usersRouter);


db.Connect((err) => {
  if (err)
    console.log("error");

  else
    console.log("Database Connected");

})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
