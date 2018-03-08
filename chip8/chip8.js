(function() {

	function DrawHelper(ctx) {

		this.board = new Array(64 * 32);

		var pixelWidth = 640 / 64;
		this.ctx = ctx;

        this.cacheCanvas = document.createElement("canvas");
        this.cacheCanvas.width = 640;
        this.cacheCanvas.height = 320;
        this.cacheCtx = this.cacheCanvas.getContext('2d');


		this.init = function() {
			for(i = 0; i < 64; i++)
				for(j = 0; j < 32; j++)
					this.board[i + j * 64] = false;
		}

		this.init();

		this.begin = function() {
			//this.cacheCtx.clearRect(0, 0, 640, 320);
		}

		this.end = function() {
			//this.ctx.clearRect(0, 0, 640, 320);
			this.ctx.drawImage(this.cacheCanvas, 0, 0, 640, 320);
			this.ctx.restore();
			this.cacheCtx.restore();
		}

		this.draw = function(x, y, isSet) {
			if(isSet == this.board[x + y * 64]) {
				return;
			}

			this.board[x + y * 64] = isSet;

			if(isSet) {
				this.cacheCtx.fillStyle = 'black';
			}
			else {
				this.cacheCtx.fillStyle = 'white';
			}

			var realX = x * pixelWidth;
			var realY = y * pixelWidth;

			this.cacheCtx.fillRect(realX, realY, pixelWidth, pixelWidth);
			
		}

		this.clear = function() {
			for(i = 0; i < 64; i++) {
				for(j = 0; j < 32; j++) {
					var realX = i * pixelWidth;
					var realY = j * pixelWidth;

					ctx.fillStyle = 'white';
					ctx.fillRect(realX, realY, pixelWidth, pixelWidth);
				}
			}
		}
	}

	function Chip8() {
		var gameBox = document.getElementById('game_box');
		if(gameBox == null)
			console.log("game box not found");

		this.ctx = gameBox.getContext('2d');

		this.drawHelper = new DrawHelper(this.ctx);
		this.drawFlag = false;
		this.gfx = new Uint8Array(64 * 32);	// Total amount of pixels: 2048
		this.key = new Uint8Array(16);

		this.pc = 0;					// Program counter
		this.opcode = 0x1234;			// Current opcode
		this.I = 0;						// Index register
		this.sp = 0;					// Stack pointer
		
		this.V = new Uint8Array(16);			// V-regs (V0-VF)
		this.stack = new Uint16Array(16);		// Stack (16 levels)
		this.memory = new Uint8Array(4096);	// Memory (size = 4k)		
				
		this.delay_timer = 0;			// Delay timer
		this.sound_timer = 0;			// Sound timer

		this.chip8_fontset = [ 
		    0xF0, 0x90, 0x90, 0x90, 0xF0, //0
		    0x20, 0x60, 0x20, 0x20, 0x70, //1
		    0xF0, 0x10, 0xF0, 0x80, 0xF0, //2
		    0xF0, 0x10, 0xF0, 0x10, 0xF0, //3
		    0x90, 0x90, 0xF0, 0x10, 0x10, //4
		    0xF0, 0x80, 0xF0, 0x10, 0xF0, //5
		    0xF0, 0x80, 0xF0, 0x90, 0xF0, //6
		    0xF0, 0x10, 0x20, 0x40, 0x40, //7
		    0xF0, 0x90, 0xF0, 0x90, 0xF0, //8
		    0xF0, 0x90, 0xF0, 0x10, 0xF0, //9
		    0xF0, 0x90, 0xF0, 0x90, 0x90, //A
		    0xE0, 0x90, 0xE0, 0x90, 0xE0, //B
		    0xF0, 0x80, 0x80, 0x80, 0xF0, //C
		    0xE0, 0x90, 0x90, 0x90, 0xE0, //D
		    0xF0, 0x80, 0xF0, 0x80, 0xF0, //E
		    0xF0, 0x80, 0xF0, 0x80, 0x80  //F
		];

		that = this;

		that.init = function() {
			that.pc		= 0x200;		// Program counter starts at 0x200 (Start adress program)
			that.opcode	= 0;			// Reset current opcode	
			that.I		= 0;			// Reset index register
			that.sp		= 0;			// Reset stack pointer

			// Clear display
			for(i = 0; i < 2048; ++i)
				that.gfx[i] = 0;

			// Clear stack
			for(i = 0; i < 16; ++i)
				that.stack[i] = 0;

			for(i = 0; i < 16; ++i)
				that.key[i] = that.V[i] = 0;

			// Clear memory
			for(i = 0; i < 4096; ++i)
				that.memory[i] = 0;
							
			// Load fontset
			for(i = 0; i < 80; ++i)
				that.memory[i] = that.chip8_fontset[i];		

			// Reset timers
			that.delay_timer = 0;
			that.sound_timer = 0;

			// Clear screen once
			that.drawFlag = true;

			// add key listener
			document.onkeydown = function(e) {
				e = e || window.event;

				var key = e.keyCode;

				if(key == 49)		that.key[0x1] = 1;
				else if(key == 50)	that.key[0x2] = 1;
				else if(key == 51)	that.key[0x3] = 1;
				else if(key == 52)	that.key[0xC] = 1;

				else if(key == 81)	that.key[0x4] = 1;
				else if(key == 87)	that.key[0x5] = 1;
				else if(key == 69)	that.key[0x6] = 1;
				else if(key == 82)	that.key[0xD] = 1;

				else if(key == 65)	that.key[0x7] = 1;
				else if(key == 83)	that.key[0x8] = 1;
				else if(key == 68)	that.key[0x9] = 1;
				else if(key == 70)	that.key[0xE] = 1;

				else if(key == 90)	that.key[0xA] = 1;
				else if(key == 88)	that.key[0x0] = 1;
				else if(key == 67)	that.key[0xB] = 1;
				else if(key == 86) that.key[0xF] = 1;

			}
			document.onkeyup = function(e) {
				e = e || window.event;

				var key = e.keyCode;

				if(key == 49)		that.key[0x1] = 0;
				else if(key == 50)	that.key[0x2] = 0;
				else if(key == 51)	that.key[0x3] = 0;
				else if(key == 52)	that.key[0xC] = 0;

				else if(key == 81)	that.key[0x4] = 0;
				else if(key == 87)	that.key[0x5] = 0;
				else if(key == 69)	that.key[0x6] = 0;
				else if(key == 82)	that.key[0xD] = 0;

				else if(key == 65)	that.key[0x7] = 0;
				else if(key == 83)	that.key[0x8] = 0;
				else if(key == 68)	that.key[0x9] = 0;
				else if(key == 70)	that.key[0xE] = 0;

				else if(key == 90)	that.key[0xA] = 0;
				else if(key == 88)	that.key[0x0] = 0;
				else if(key == 67)	that.key[0xB] = 0;
				else if(key == 86) that.key[0xF] = 0;

			}
		}

		that.display = function() {
			

				that.drawHelper.begin();
				for(i = 0; i < 64; i++) {
					for(j = 0; j < 32; j++) {
						if(that.gfx[i + j * 64] == 1)
							that.drawHelper.draw(i, j, true);
						else
							that.drawHelper.draw(i, j, false);
					}
				}
				that.drawHelper.end();

				// Processed frame
				that.drawFlag = false;
			
		}

		that.loadApplication = function(filename) {
			that.init();
			console.log("Loading: " + filename);

			var oReq = new XMLHttpRequest();
			oReq.open("GET", filename, true);
			oReq.responseType = "arraybuffer";

			oReq.onload = function(oEvent) {
			  	var content = new Int8Array(oReq.response);

			  	// Copy buffer to Chip8 memory
				if((4096-512) > content.length) {
					for(i = 0; i < content.length; ++i) {
						that.memory[i + 512] = content[i];
					}
				} 
				else
					console.log("Error: ROM too big for memory");

				
				/*function loop() {
					while(true) {
						that.emulateCycle();
						if(that.drawFlag) {
							that.display();
							setTimeout(function() {	
								loop();
							}, 16);
							break;
						}
					}
				}
				
				setTimeout(function() {	
					loop();
				}, 16);*/


				
				var start = null;

				function step(timestamp) {
					console.log('hhhh');
				  	if (!start) start = timestamp;
				  	var progress = timestamp - start;

				  	if (progress > 16) {   
				  		console.log("dddd");
				  		while(true) {
							that.emulateCycle();
							if(that.drawFlag) {
								that.display();
								break;
							}
						}
				  	}

				  	window.requestAnimationFrame(step);
				  	
				}

				window.requestAnimationFrame(step);

				
			};

			oReq.send();

			return true;
		}	

		that.emulateCycle = function() {
			// Fetch opcode
			that.opcode = that.memory[that.pc] << 8 | that.memory[that.pc + 1];
			
			// Process opcode
			switch(that.opcode & 0xF000) {		
				case 0x0000:
					switch(that.opcode & 0x000F) {
						case 0x0000: // 0x00E0: Clears the screen
							for(i = 0; i < 2048; ++i) {
								that.gfx[i] = 0x0;
							}
							that.drawFlag = true;
							that.pc += 2;
						break;

						case 0x000E: 			// 0x00EE: Returns from subroutine
							--that.sp;			// 16 levels of stack, decrease stack pointer to prevent overwrite
							that.pc = that.stack[that.sp];	// Put the stored return address from the stack back into the program counter					
							that.pc += 2;		// Don't forget to increase the program counter!
						break;

						default:
							console.log("Unknown opcode [0x0000]:" + that.opcode);					
					}
				break;

				case 0x1000: // 0x1NNN: Jumps to address NNN
					that.pc = that.opcode & 0x0FFF;
				break;

				case 0x2000: // 0x2NNN: Calls subroutine at NNN.
					that.stack[that.sp] = that.pc;			// Store current address in stack
					++that.sp;					// Increment stack pointer
					that.pc = that.opcode & 0x0FFF;	// Set the program counter to the address at NNN
				break;
				
				case 0x3000: // 0x3XNN: Skips the next instruction if VX equals NN
					if(that.V[(that.opcode & 0x0F00) >> 8] == (that.opcode & 0x00FF))
						that.pc += 4;
					else
						that.pc += 2;
				break;
				
				case 0x4000: // 0x4XNN: Skips the next instruction if VX doesn't equal NN
					if(that.V[(that.opcode & 0x0F00) >> 8] != (that.opcode & 0x00FF))
						that.pc += 4;
					else
						that.pc += 2;
				break;
				
				case 0x5000: // 0x5XY0: Skips the next instruction if VX equals VY.
					if(that.V[(that.opcode & 0x0F00) >> 8] == that.V[(that.opcode & 0x00F0) >> 4])
						that.pc += 4;
					else
						that.pc += 2;
				break;
				
				case 0x6000: // 0x6XNN: Sets VX to NN.
					that.V[(that.opcode & 0x0F00) >> 8] = that.opcode & 0x00FF;
					that.pc += 2;
				break;
				
				case 0x7000: // 0x7XNN: Adds NN to VX.
					that.V[(that.opcode & 0x0F00) >> 8] += that.opcode & 0x00FF;
					that.pc += 2;
				break;
				
				case 0x8000:
					switch(that.opcode & 0x000F)
					{
						case 0x0000: // 0x8XY0: Sets VX to the value of VY
							that.V[(that.opcode & 0x0F00) >> 8] = that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;
						break;

						case 0x0001: // 0x8XY1: Sets VX to "VX OR VY"
							that.V[(that.opcode & 0x0F00) >> 8] |= that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;
						break;

						case 0x0002: // 0x8XY2: Sets VX to "VX AND VY"
							that.V[(that.opcode & 0x0F00) >> 8] &= that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;
						break;

						case 0x0003: // 0x8XY3: Sets VX to "VX XOR VY"
							that.V[(that.opcode & 0x0F00) >> 8] ^= that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;
						break;

						case 0x0004: // 0x8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't					
							if(that.V[(that.opcode & 0x00F0) >> 4] > (0xFF - that.V[(that.opcode & 0x0F00) >> 8])) 
								that.V[0xF] = 1; //carry
							else 
								that.V[0xF] = 0;					
							that.V[(that.opcode & 0x0F00) >> 8] += that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;					
						break;

						case 0x0005: // 0x8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't
							if(that.V[(that.opcode & 0x00F0) >> 4] > that.V[(that.opcode & 0x0F00) >> 8]) 
								that.V[0xF] = 0; // there is a borrow
							else 
								that.V[0xF] = 1;					
							that.V[(that.opcode & 0x0F00) >> 8] -= that.V[(that.opcode & 0x00F0) >> 4];
							that.pc += 2;
						break;

						case 0x0006: // 0x8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift
							that.V[0xF] = that.V[(that.opcode & 0x0F00) >> 8] & 0x1;
							that.V[(that.opcode & 0x0F00) >> 8] >>= 1;
							that.pc += 2;
						break;

						case 0x0007: // 0x8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
							if(that.V[(that.opcode & 0x0F00) >> 8] > that.V[(that.opcode & 0x00F0) >> 4])	// VY-VX
								that.V[0xF] = 0; // there is a borrow
							else
								that.V[0xF] = 1;
							that.V[(that.opcode & 0x0F00) >> 8] = that.V[(that.opcode & 0x00F0) >> 4] - that.V[(that.opcode & 0x0F00) >> 8];				
							that.pc += 2;
						break;

						case 0x000E: // 0x8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift
							that.V[0xF] = that.V[(that.opcode & 0x0F00) >> 8] >> 7;
							that.V[(that.opcode & 0x0F00) >> 8] <<= 1;
							that.pc += 2;
						break;

						default:
							console.log("Unknown opcode [0x8000]: " + that.opcode);
					}
				break;
				
				case 0x9000: // 0x9XY0: Skips the next instruction if VX doesn't equal VY
					if(that.V[(that.opcode & 0x0F00) >> 8] != that.V[(that.opcode & 0x00F0) >> 4])
						that.pc += 4;
					else
						that.pc += 2;
				break;

				case 0xA000: // ANNN: Sets I to the address NNN
					that.I = that.opcode & 0x0FFF;
					that.pc += 2;
				break;
				
				case 0xB000: // BNNN: Jumps to the address NNN plus V0
					that.pc = (that.opcode & 0x0FFF) + that.V[0];
				break;
				
				case 0xC000: // CXNN: Sets VX to a random number and NN
					that.V[(that.opcode & 0x0F00) >> 8] = (parseInt(Math.random() * 100000) % 0xFF) & (that.opcode & 0x00FF);
					that.pc += 2;
				break;
			
				case 0xD000: // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. 
							 // Each row of 8 pixels is read as bit-coded starting from memory location I; 
							 // I value doesn't change after the execution of that instruction. 
							 // VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, 
							 // and to 0 if that doesn't happen
				{
					var x = that.V[(that.opcode & 0x0F00) >> 8];
					var y = that.V[(that.opcode & 0x00F0) >> 4];
					var height = that.opcode & 0x000F;
					var pixel;

					that.V[0xF] = 0;
					for (yline = 0; yline < height; yline++) {
						pixel = that.memory[that.I + yline];

						for(xline = 0; xline < 8; xline++) {
							if((pixel & (0x80 >> xline)) != 0) {
								if(that.gfx[(x + xline + ((y + yline) * 64))] == 1) {
									that.V[0xF] = 1;                                    
								}

								var index = x + xline + ((y + yline) * 64);
								that.gfx[index] ^= 1;
							}
						}
					}
								
					that.drawFlag = true;			
					that.pc += 2;
				}
				break;
					
				case 0xE000:
					switch(that.opcode & 0x00FF) {
						case 0x009E: // EX9E: Skips the next instruction if the key stored in VX is pressed
							if(that.key[that.V[(that.opcode & 0x0F00) >> 8]] != 0)
								that.pc += 4;
							else
								that.pc += 2;
						break;
						
						case 0x00A1: // EXA1: Skips the next instruction if the key stored in VX isn't pressed
							if(that.key[that.V[(that.opcode & 0x0F00) >> 8]] == 0)
								that.pc += 4;
							else
								that.pc += 2;
						break;

						default:
							console.log("Unknown opcode [0xE000]: " + that.opcode);
					}
				break;
				
				case 0xF000:
					switch(that.opcode & 0x00FF) {
						case 0x0007: // FX07: Sets VX to the value of the delay timer
							that.V[(that.opcode & 0x0F00) >> 8] = that.delay_timer;
							that.pc += 2;
						break;
										
						case 0x000A: // FX0A: A key press is awaited, and then stored in VX		
						{
							var keyPress = false;

							for(i = 0; i < 16; ++i)
							{
								if(that.key[i] != 0)
								{
									that.V[(that.opcode & 0x0F00) >> 8] = i;
									keyPress = true;
								}
							}

							// If we didn't received a keypress, skip that cycle and try again.
							if(!keyPress)						
								return;

							that.pc += 2;					
						}
						break;
						
						case 0x0015: // FX15: Sets the delay timer to VX
							that.delay_timer = that.V[(that.opcode & 0x0F00) >> 8];
							that.pc += 2;
						break;

						case 0x0018: // FX18: Sets the sound timer to VX
							that.sound_timer = that.V[(that.opcode & 0x0F00) >> 8];
							that.pc += 2;
						break;

						case 0x001E: // FX1E: Adds VX to I
							if(that.I + that.V[(that.opcode & 0x0F00) >> 8] > 0xFFF)	// VF is set to 1 when range overflow (I+VX>0xFFF), and 0 when there isn't.
								that.V[0xF] = 1;
							else
								that.V[0xF] = 0;
							that.I += that.V[(that.opcode & 0x0F00) >> 8];
							that.pc += 2;
						break;

						case 0x0029: // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font
							that.I = that.V[(that.opcode & 0x0F00) >> 8] * 0x5;
							that.pc += 2;
						break;

						case 0x0033: // FX33: Stores the Binary-coded decimal representation of VX at the addresses I, I plus 1, and I plus 2
							that.memory[that.I]     = that.V[(that.opcode & 0x0F00) >> 8] / 100;
							that.memory[that.I + 1] = (that.V[(that.opcode & 0x0F00) >> 8] / 10) % 10;
							that.memory[that.I + 2] = (that.V[(that.opcode & 0x0F00) >> 8] % 100) % 10;					
							that.pc += 2;
						break;

						case 0x0055: // FX55: Stores V0 to VX in memory starting at address I					
							for (i = 0; i <= ((that.opcode & 0x0F00) >> 8); ++i)
								that.memory[that.I + i] = that.V[i];	

							// On the original interpreter, when the operation is done, I = I + X + 1.
							that.I += ((that.opcode & 0x0F00) >> 8) + 1;
							that.pc += 2;
						break;

						case 0x0065: // FX65: Fills V0 to VX with values from memory starting at address I					
							for (i = 0; i <= ((that.opcode & 0x0F00) >> 8); ++i)
								that.V[i] = that.memory[that.I + i];			

							// On the original interpreter, when the operation is done, I = I + X + 1.
							that.I += ((that.opcode & 0x0F00) >> 8) + 1;
							that.pc += 2;
						break;

						default:
							console.log("Unknown opcode [0xF000]: " + that.opcode);
					}
				break;

				default:
					console.log("Unknown opcode: " + that.opcode);
			}	

			// Update timers
			if(that.delay_timer > 0)
				--that.delay_timer;

			if(that.sound_timer > 0) {
				if(that.sound_timer == 1)
					console.log("BEEP!");
				--that.sound_timer;
			}	
		}

	}


	var chip8 = new Chip8();
	chip8.loadApplication('pong2.c8');
	//chip8.loadApplication('invaders.c8');
	//chip8.loadApplication('tetris.c8');
})();


