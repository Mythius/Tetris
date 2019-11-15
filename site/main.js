var socket = io();
var userid;
hide(obj('#users'));
hide(obj('#reqs'));

obj('#name').focus();
document.on('keydown',e=>{
	// SUBMIT USERNAME
	if(e.keyCode == 13 && obj('#start')) obj('#username').click();
});

obj('#username').on('click',function(){
	var input = obj('#name');
	if(input.value.length){
		socket.emit('user',input.value);
	} else {
		alert('Enter Name');
		input.focus();
	}
});

obj('#play').on('click',function(){
	location.href = 'game.html';
})

socket.on('id',id=>{userid=id});

socket.on('upd',users=>{
	if(!userid) return;
	obj('ul').innerHTML='';
	show(obj('#users'));
	show(obj('#reqs'));
	if(obj('#start')) obj('#start').remove();
	for(let u of users){
		if(u.ID == userid) continue;
		var button = create('button','Request');
		button.style.float='right';
		button.disabled = !u.active;
		button.on('click',function(){
			socket.emit('request',u.ID);
		});
		var li = create('li','',create('h4',u.name),button);
		li.title = 'ID#'+u.ID;
		li.classList.add('user')
		obj('#users').appendChild(li);
	}
});

socket.on('pubreq',data=>{
	if(!userid) return;
	if(data.to.ID == userid){
		var button1 = create('button','Accept');
		var button2 = create('button','Decline');
		var li = create('li','Request From '+data.from.name+' ',button1,button2);
		button1.on('click',function(){
			socket.emit('acc',data);
			li.remove();
		});
		button2.on('click',function(){
			li.remove();
		});
		obj('#reqs').appendChild(li);
	}
});

socket.on('send',data=>{
	if(data.from.ID == userid || data.to.ID == userid){
		location.href = data.link+'*'+userid;
	}
})