var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

var FILE = {
	save:function(name,text){
		fs.writeFile(name,text,e=>{
			console.log(e);
		});
	},
	load:function(name,callback){
		fs.readFile(name,(error,buffer)=>{
			if (error) console.log(error);
			else callback(buffer.toString());
		});
	}
};

const port = 2000;
const path = __dirname+'/';

app.use(express.static(path+'site/'));
app.get(/.*/,function(request,response){
	response.sendFile(path+'site/');
});

http.listen(port,()=>{console.log('Serving Port: '+port)});

var USERS = [],uniq=1;
var LINKS = [];

function User(n){
	this.ID = uniq++;
	this.active = true;
	this.name = n;
	USERS.push(this);
}

io.on('connection',function(socket){
	var u;
	// FOR MAIN PAGE
	socket.on('user',name=>{
		u = new User(name);
		socket.emit('id',u.ID);
		io.emit('upd',USERS);
	});
	socket.on('disconnect',()=>{
		if(u){
			USERS.splice(USERS.indexOf(u),1);
			io.emit('upd',USERS);
		}
	});
	socket.on('request',reqid=>{
		let to = USERS.filter(e=>e.ID==reqid)[0];
		io.emit('pubreq',{from:u,to});
	});
	socket.on('acc',data=>{
		data.link = getLink(data);
		io.emit('send',data);
	});

	// FOR GAME
	var id;
	socket.on('verify',d=>{
		let verify = LINKS.filter(e=>e.d == d.gid)[0];
		if(!LINKS.length) return;
		if(verify.con > 2) return;
		if(verify.id1.ID == d.id){
			ok = true;
			id = d.gid;
			user = verify.id1;
			verify.con++;
		}
		if(verify.id2.ID == d.id){
			ok = true;
			id = d.gid;
			user = verify.id2;
			verify.con++;
		}
		socket.emit('name',ok);
		var ooo = {gid:d.gid,i1:verify.id1,i2:verify.id2,s1:random(1,9999),s2:random(1,9999)};
		if(verify.con == 2){
			io.emit('start',ooo);
			LINKS.pop();
		} 
		setTimeout(function(){
			socket.emit('actuallystart',d.gid);
		});
	});
	socket.on('sendkeys',appa=>{
		io.emit('keys',appa);
	});
	socket.on('sendtrash',trash=>{
		io.emit('trash',trash);
	});
});

function getLink(data){
	let d = digit();
	LINKS.push({d,id1:data.from,id2:data.to,con:0});
	function digit(){
		return random(1111,9999);
	}
	return 'multi.html?'+d;
}

function random(min,max){
	// inclusive
	return min + Math.floor(Math.random()*(max-min+1));
}