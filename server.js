//dependencies
var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , pg = require('pg')
  , query = require('pg-query')
  , uuid = require('node-uuid')
  , config = require('./config');

//creating the server object
var server = express();

var conString = config.db.url;
query.connectionParameters = conString;

function auth(req, res, next) {
	query("SELECT * FROM sessions WHERE sid='" + req.signedCookies.sid + "'", function(err, rows, result){
		if (result.rows.length === 1) {
			next();
		} else {
			res.render('error/401');
		}
	});
}

// server settings and middleware
server.engine('.html', require('ejs').__express);
server.set('port', process.env.PORT || config.web.port);
server.set('views', path.join(__dirname, '/views'));
server.set('view engine', 'html');
server.use(express.favicon(path.join(__dirname, 'public/img/favicon.ico')));
server.use(express.logger('dev'));
server.use(express.bodyParser());
server.use(express.methodOverride());
server.use(express.cookieParser(config.web.secureKey));
server.use(express.session());
//server.use(express.csrf());
server.use('/admin', auth);
server.use(express.static(path.join(__dirname, 'public')));
server.use(server.router);

//development only
if ('development' == server.get('env')) {
  server.use(express.errorHandler());
}


//routes

//public routes
server.get('/', function(req, res){
	query("SELECT * FROM posts", function(err, rows, result){
		if (err) {
			throw err;
		}
		
		res.render('index', {
			posts: rows.reverse()
		});
	});
});

server.get('/loremipsum', function(req, res){
	res.render('loremipsum');
});

server.get('/cicero', function(req, res){
	res.render('cicero');
});

server.get('/login', function(req, res){
	res.render('login');
});

server.get('/imprint', function(req, res){
	res.render('imprint');
});

server.get('/blogentries', function(req, res){
	query("SELECT * FROM posts", function(err, rows, result){
		if (err) {
			throw err;
		}
		res.write(JSON.stringify(rows));
		res.end();
	});
});

server.get('/media', function(req, res){
	query("SELECT * FROM images", function(err, rows, result){
		res.render('media', {
			images: rows
		});
	});
});

server.post('/login', function(req, res){
	query("SELECT * FROM users WHERE password='" + escape(req.body.password) + "' AND username='" + req.body.username + "'", function(err, rows, result){
		if (err) throw err;
		if (rows.length === 1) {
			var sid = uuid.	v1();
			res.cookie('sid', sid, {signed : true});
			res.cookie('username', req.body.username, {signed : true});
			query("INSERT INTO sessions VALUES ('" + sid + "', '" + escape(req.body.username) + "', NULL, current_date)", function(err, rows, result){
				if (err) {
					throw err;
				}
				res.redirect('/admin');
			});
		} else {
			res.redirect('/login');
		}
	});
});


//admin routes
server.get('/admin', function(req, res){
	query("SELECT * FROM posts", function(err, rows, result){
		if (err) {
			throw err;
		}
		
		res.render('admin/index', {
			posts: rows.reverse()
		});
	});
});

server.post('/admin/logout', function(req, res){
	query("UPDATE sessions SET logout=now() WHERE sid='" + req.signedCookies.sid + "'", function(err, rows, result){
		req.session.destroy();
		res.clearCookie('sid');
		res.clearCookie('username');
		res.redirect('/');
	});
});

server.post('/admin/newblogentry', function(req, res){
	console.log(req.body.title);
	console.log(req.body.text);
	query("INSERT INTO posts VALUES (DEFAULT, '" + escape(req.body.title) + "', '" + escape(req.body.text.replace(/\n/g, '<br />')) + "', date_part('day', now()), date_part('month', now()), date_part('year', now()) )", function(err, rows, result){
		if (err) {
			throw err;
		}
		res.redirect('/admin');
	});
});

server.del('/admin/delentry', function(req, res){
	query("DELETE FROM posts WHERE postid=" + req.query.id, function(err, rows, result){
		res.end();
	});
});

server.put('/admin/editentry', function(req, res){
	console.log(req.body);
	query("UPDATE posts SET title='" + escape(req.body.title) + "', content='" + escape(req.body.text) + "' WHERE postid=" + escape(req.body.id), function(err, rows, result){
		res.end();
	});
});

server.get('/admin/media', function(req, res){
	query("SELECT * FROM images", function(err, rows, result){
		res.render('admin/media', {
			images: rows
		});
	});
});

server.post('/admin/image', function(req, res){
	var tmp_path = req.files.image.path;
	console.log(tmp_path);
	target_path = path.join(__dirname, '/public/img/') + req.files.image.name;
	console.log(target_path);
	
	fs.rename(tmp_path, target_path, function(err) {
		if (err) throw err;

		query("INSERT INTO images (path, name) VALUES ('" + target_path + "', '" + req.files.image.name + "')", function(err, rows, result){
			if (err) throw err;
			res.redirect('admin/media');
		});
	});


});

server.get('/image/:id', function(req, res){
	query("SELECT path FROM images WHERE id=" + req.params.id, function(err, rows, result){
		if (err) throw err;
		console.log(rows);
		if (rows.length > 0) {
			fs.readFile(rows[0].path, "binary", function(err, data){
				if (err) {
					throw err;
				} else {
					res.writeHead(200, {"Content-Type": "image/jpg"});
					res.write(data, "binary");
					res.end();
				}
			});
		} else {
			res.render('error/404');
		}
	});
});

server.del('/admin/image/:id', function(req, res){
	query("SELECT path FROM images WHERE id=" + req.params.id, function(err, rows, result){
		if (err) throw err;
		fs.unlink(rows[0].path, function(err){
			if (err) throw err;
			query("DELETE FROM images WHERE id=" + req.params.id, function(err){
				if (err) throw err;
				res.redirect('/admin/media');
			});
		});
	});
});




server.all('*', function(req, res){
	res.render('error/404');
});



//starting server...
http.createServer(server).listen(server.get('port'), function(){
  console.log('Express server listening on port ' + server.get('port'));
});
