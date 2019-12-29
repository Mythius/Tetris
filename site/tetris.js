function Tetris(div,kk){

	const width = 10,height = 20,fps=12;
	var board = new Grid(div.querySelector('main'),10,20,28);
	var L,O,Z,S,T,J,I; // Each Piece
	var all_pieces,canchange = true,i,saved=false;
	var bag = [],real_pieces = [],alsams = [];
	var current_piece,next_piece,saved_piece;
	var keys = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,Shift:false,Escape:false,i:false};
	keys[" "]=false;
	var count = 0,wait = 10,playing = false;
	var points = 0, display_score = 0;
	var GAMELOOP,speed = 0;
	var multi = false;
	var seed = 23509;

	function Piece(color,blocks){
		var rot = pRandom(1,3);
		var bytearray = toBinary(blocks[rot]);

		var x = pRandom(1,width-4);
		var y = 1;

		var sams = [];

		forEach((x,y)=>{
			let i = create('img');
			i.src = 'imgs/'+color+'.png';
			div.appendChild(i);
			let sam = new SAM(board,i,28,28);
			sams.push(sam);
			alsams.push(sam);
		})

		function rotate(n){
			rot = (rot + n + 4) % 4;
			bytearray = toBinary(blocks[rot]);
		}
		function move(deltax,deltay){
			x += deltax;
			y += deltay;
		}
		function forEach(callback){
			let count = 0;
			for(let ty = y; ty < y+4; ty++){
				for(let tx = x; tx < x+4; tx++){
					if(bytearray[count++] == "1"){
						callback(tx,ty);
					}
				}
			}
		}
		function draw(c=color){
			let sc = 0;
			forEach((x,y)=>{
				board.setColor(x,y,c);
				if(c==color) sams[sc++].goTo(x,y);
			});
		}
		function tryMove(deltax,deltay,deltar,d=true){
			if(d) draw('black');
			rotate(deltar);
			move(deltax,deltay);
			var valid = true;
			forEach((x,y)=>{
				//if(!valid) return;
				let c = board.getColor(x,y);
				if(c != 'black') valid = false;
			});
			if(!valid){
				rotate(-deltar);
				move(-deltax,-deltay);
			}
			if(d) draw();
			return !valid;
		}
		this.draw = draw;
		this.move = tryMove;
		this.moveDown = function(){
			return tryMove(0,1,0);
		}
		this.toString = function(){
			// return piece data
			return `PIECE - Color:${color}, Shape:${bytearray}, Rotation:${rot}, X:${x}, Y:${y}`;
		}
		this.checkLose = function(){
			return tryMove(0,0,0,false);
		}
		this.moveTo = function(x,y){
			for(let s of sams) s.goTo(x,y);
		}
		this.resetPos = function(){
			draw('black');
			x = pRandom(1,width-4);
			y = 1;
		}
	}

	function toBinary(hex){
		// change something like "4444" to
		// "0100010001000100" which can be rendered like: 
		//
		//  0100
		//  0100
		//  0100
		//  0100
		// 
		// which is your strait up and down piece
		return ("0".repeat(16)+parseInt(hex,16).toString(2)).slice(-16);
	}

	function randomPiece(){
		if(bag.length == 0) randomizeBag(4);
		var p = bag.pop();
		return new Piece(p.color,p.blocks);
	}

	function randomizeBag(amount){
		bag = [];
		for(let p of all_pieces) addType(p);

		bag.sort(()=>pRandom(1,3)-2);

		function addType(type){
			for(let i=0;i<amount;i++){
				bag.push(type);
			}
		}
	}

	function addControlls(){
		if(multi) return;
		document.on('keydown',function(e){
			if(e.key in keys){
				keys[e.key] = true;
				e.preventDefault();
			}
		});
		document.on('keyup',function(e){
			if(e.key in keys){
				if(e.key == 'i') return;
				keys[e.key] = false;
				e.preventDefault();
			} 
		});
	}

	function handleControls(){
		let dx=0, dy=0, dr=0;
		if(keys.ArrowLeft) current_piece.move(-1,0,0);
		if(keys.ArrowDown) current_piece.move(0,1,0);
		if(keys.ArrowRight) current_piece.move(1,0,0);
		if(keys.ArrowUp) current_piece.move(0,0,1);
		if(keys.Shift) swapSaved();
		if(keys.Escape){
			playing = false;
			if(!PUBLIC || !multi) clearInterval(GAMELOOP);
		}
		if(keys[" "]){
			let n = false;
			while(!n){
				n = current_piece.moveDown();
				checkNextPiece(n);
			}
		}
	}

	function checkRows(){
		let rr = 0;
		var rowstofall = [];
		for(let y=height;y>0;y--){
			let full = true;
			for(let x=1;x<=width;x++){
				let color = board.getColor(x,y);
				if(color=='black') full = false;
				board.setColor(x,y,'black');
				board.setColor(x,y+rr,color);
			}
			if(full){
				rr++;
				let a = alsams.filter(s=>s.getPosition().y==y);
				let i = 0;
				for(let s of a){
					let temp = alsams.splice(alsams.indexOf(s),1);
					s.obj.remove();
				}
				rowstofall.push(y);
			}
		}
		if(rowstofall.length) points += 50 * 2 ** rowstofall.length;
		for(let r of rowstofall.reverse()){
			a = alsams.filter(s=>s.getPosition().y<r);
			for(let s of a){
				let p = s.getPosition();
				s.goTo(p.x,p.y+1);
			}
			if(saved_piece) saved_piece.moveTo(11,2);
		}
	}

	function addRows(amount){
		for(let s of alsams){
			let p = s.getPosition();
			s.goTo(p.x,p.y-amount);
		}
		if(saved_piece) saved_piece.moveTo(11,2);
		for(let y=1;y<=height;y++){
			for(let x=1;x<=width;x++){
				let c = board.getColor(x,y);
				board.setColor(x,y,'black');
				board.setColor(x,y-amount,c);
			}
		}
//Check here for bugs v v v v v v v v v v
		for(let y=height;y>height-amount;y--){
			let temparr = [];
			for(let x=1;x<=width;x++){
				let i = create('img');
				i.src = 'imgs/gray.png';
				div.appendChild(i);
				let s = new SAM(board,i,28,28);
				s.goTo(x,y);
				temparr.push(s);
				board.setColor(x,y,'gray');
			}
			let r = pRandom(1,width);
			board.setColor(r,y,'black');
//                     Check here for bugs v v v 
			let a = temparr.splice(r-1,1)[0].obj.remove();
			alsams.concat(temparr);
			console.log(alsams);
		}
	}

	function setup(){
		L = {blocks:["4460","0E80","C440","2E00"],color:'orange'};
		O = {blocks:["CC00","CC00","CC00","CC00"],color:'yellow'};
		Z = {blocks:["0C60","4C80","C600","2640"],color:'red'};
		S = {blocks:["06C0","8C40","6C00","4620"],color:'green'};
		T = {blocks:["0E40","4C40","4E00","4640"],color:'purple'};
		J = {blocks:["44C0","8E00","6440","0E20"],color:'blue'};
		I = {blocks:["0F00","2222","00F0","4444"],color:'cyan'};

		all_pieces = [L,O,Z,S,T,J,I];

		// INIT GAME

		board.setColorAll('black');

		setInterval(scoreloop,1000/35);

		addControlls();
	}

	function restart(){
		if(GAMELOOP) clearInterval(GAMELOOP);
		playing = true;
		alsams = [];
		for(let i of document.querySelectorAll('img')) i.remove();
		points = 0;
		display_score = 0;
		board.setColorAll('black');
		playing = true;
		speed=0;
		wait = 10;
		if(!PUBLIC || !multi) GAMELOOP = setInterval(loop,1000/fps);
	}

	function loop(){
		if(!playing) return;
		handleControls();
		if(PUBLIC) kk(keys);
		keys.ArrowDown=false;
		keys.ArrowUp=false;
		keys[" "]=false;
		if(!current_piece) checkNextPiece(true,false);
		if((count++) >= wait){
			count = 0;
			let next = current_piece.moveDown();
			checkNextPiece(next);
		}
		let sc = Math.floor(points/1000);
		if(sc > speed){
			speed = sc;
			wait--;
			wait = Math.max(wait,1);
		}
	}

	function scoreloop(){
		if(display_score<points) display_score+=1;
		div.querySelector('p').innerHTML = "Points: " + display_score;
	}

	function checkNextPiece(next,nopoints){
		if(next){
			if(!next_piece) next_piece = randomPiece();
			if(!nopoints) points += 10;
			if(current_piece) current_piece.draw();
			checkRows();
			current_piece = next_piece;
			saved = false;
			let lose = current_piece.checkLose();
			if(lose) playing = false;
			else current_piece.draw();
			next_piece = randomPiece();
			next_piece.moveTo(11,1);
			if(keys.i){
				addRows(1);
			} 
			keys.i = false;
		}
	}

	function swapSaved(){
		if(!saved){
			saved = true;
			if(saved_piece){
				current_piece.resetPos();

				let temp = current_piece;
				current_piece = saved_piece;
				saved_piece = temp;
				saved_piece.moveTo(11,2);
				current_piece.draw();

			} else {
				current_piece.resetPos();
				saved_piece = current_piece;
				current_piece = next_piece;
				next_piece = randomPiece();
				next_piece.moveTo(11,1);
				saved_piece.moveTo(11,2);
				current_piece.draw();
			}
		}
	}

	var aa=16807,xn=seed,c=5,m=2147483647;
	function pRandom(min,max){
		let psudo = (aa*xn+c)%m;
		let rn = xn/m;
		xn = psudo;
		let rr = min+Math.floor(rn*(max-min+1));
		return rr;
	}

	this.setup = setup;
	this.addRows = addRows;
	this.start = restart;
	this.setMulti = function(){
		multi = true;
	}
	this.setSeed = function(s){
		seed = s;
		xn = seed;
	}
	this.setKeys = k =>{
		keys = k;
		loop();
	}
}
