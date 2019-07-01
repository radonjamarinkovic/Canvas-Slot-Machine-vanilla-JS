document.addEventListener("DOMContentLoaded", function(){
    var SlotMachine = {
        json_url : 'https://api.myjson.com/bins/j1ym7',
        bg : "url('./img/bg.png')",
        start_button_src : './img/btn_start.png',
        inactive_button_src : './img/btn_inactive.png',

        canvas : document.querySelector('#game-area'),

        gameStart : function() {
            this.context = this.canvas.getContext("2d");
            this.canvas.width = 1200;
            this.canvas.height = 900 ;
            this.canvas.style.border = "2px solid grey";
            this.canvas.style.backgroundImage = this.bg;
            this.angle = 0; //used in animateWin
            this.requestFrame; //used in animateWin
            this.winAmmount; //used in animateWin
            this.fetchJson();
            this.button('inactive');
            this.drawMiddleFrame();
        }, //End of start

        fetchJson: function() {
            fetch(this.json_url)
            .then(res => {
                if(!res.ok){
                    throw new Error('Error: ' + res.status);
                }
                return res.json();
            })
            .then(function(data){
                SlotMachine.loadImages(data);
            });
        }, //End of fetchJson  
        
        button : function(type) {
            var ctx = this.context;
            var btn = new Image();
            //console.log(type);
            if(type === 'inactive'){
                btn.src = this.inactive_button_src;
            }else if( type === 'start'){
                btn.src = this.start_button_src;
                SlotMachine.buttonClick(); //enable button click
            }
            btn.onload = function(){ //when image is loaded draw button
                ctx.drawImage(btn, 951, 500);
            }
        },//End of button

        buttonClick : function(){ //Mouse click event
            var fThis = this; 
            fThis.canvas.addEventListener('click', function clikcOnButton(e){
                //Get coords of button clikc
                var x = e.clientX; //console.log(x);
                var y = e.clientY; //console.log(y);
                //check if mouse click appears in button area
                //not the best solution
                if(x > 951 && x < 1049 && y > 500 && y < 598){
                    fThis.canvas.removeEventListener('click', clikcOnButton);
                    //alert('button clicked');
                    fThis.audio("button");
                    fThis.audio("reels2");
                    fThis.button('inactive');
                    fThis.animate();
                }
            });
        },//End of buttonClick

        loadImages: function(json){
            var numberOfImages = Object.keys(json.symbols).length;
            //console.log(numberOfImages);
            var images = [];

            //var data = json;
            //console.log(data);

            for(var k in json.symbols){
                var image = new Image();
                image.src = json.symbols[k]; //get image paths
                //console.log(json.symbols[k]);
                image.dataset.name = k; //get image names
                //console.log(image.dataset.name);
                //when image is loaded add image to images array
                image.onload = (function(imgVal){
                    return function(){
                        images.push(imgVal);
                        if(images.length === numberOfImages){
                            SlotMachine.imagesArr = images;
                            SlotMachine.createSlots();
                            SlotMachine.button('start');
                        }
                    }
                })(image);
            }
        },//End of loadImages

        createSlots : function(){
            var slotsArr = [];
            var xPositions = [70, 310, 550]; 
            var yPositions = [-170, 10, 190, 370, 550, 730]; 

            for(var i = 0; i < xPositions.length; i++){ //create image matrix
                for(var j = 0; j < yPositions.length; j++){
                    var randomIndex = Math.floor(Math.random() * 6); //gen random image
                    var slot = new SlotImage(randomIndex, xPositions[i], yPositions[j]);
                    slot.drawSlotImage(xPositions[i], yPositions[j]);
                    slotsArr.push(slot);
                }
            }
            this.slotsArr = slotsArr;
            //console.log(slotsArr);

        },//End of createSlots

        clearCanvas : function(){
            this.context.clearRect(0, 0, 830, this.canvas.height);
        },//End of clearCanvas

        animate : function(){
            var fThis = this;
            var slotsArr = this.slotsArr;
            var speed = 15; //px per 5ms
            var dist = -speed;
            var max = speed*180; 

            var spin = setInterval(() => {
                fThis.clearCanvas();
                dist += speed;
                if(dist === max){
                    speed -= 2;
                    dist = 0; 
                    max = speed*180;
                }
                if(speed === 5){ 
                    speed = 0;
                    clearInterval(spin);
                    fThis.determineWin();
                }
                for(var i = 0; i < slotsArr.length; i++){ //draw new img on Y+15
                    slotsArr[i].drawSlotImage(slotsArr[i].posX, slotsArr[i].posY+=speed);
                    //console.log('SlotsArr', slotsArr);
                    if(slotsArr[i].posY >= 910){ //replace bottom image with random top
                        /*Change to var newImg = Math.floor(Math.random() * 1); 
                        to instantly get win result*/
                        var newImg = Math.floor(Math.random() * 6); 
                        slotsArr[i] = new SlotImage(newImg, slotsArr[i].posX,
                        (slotsArr[i].posY-910-170));  
                    }
                    fThis.drawMiddleFrame();
                }
            },5);
        },//End of animate

        determineWin : function(){
            var endResult = [];

            var bid = parseInt(document.querySelector('#bids').value);
            var cash = parseInt(document.querySelector('#cash').value);

            for (var i = 0; i < this.slotsArr.length; i++){ //get images from middle row
                if (this.slotsArr[i].posX === 70 && this.slotsArr[i].posY === 370 ||
                    this.slotsArr[i].posX === 310 && this.slotsArr[i].posY == 370 ||
                    this.slotsArr[i].posX === 550 && this.slotsArr[i].posY == 370){
                  var a = this.slotsArr[i];
                  endResult.push(a.name); 
                }
            }
            //console.log(endResult); 
            const allEqual = arr => arr.every( v => v === arr[0] );

            //Check if all symbols in the middle row are equal
            if(allEqual(endResult) === false){ //if false play sound then enable button
                this.audio('fail', function(){
                    SlotMachine.button('start');  
                });
            }else{ //if true display win animation 
                var updatedAcc = cash + bid;
                document.querySelector("#cash").value = updatedAcc;
                this.winAmmount = bid;
                this.animateWin();
                this.audio('win', function(){ 
                    SlotMachine.button('start');
                    SlotMachine.stopWinAnimation();
                });
            }
        },//End of determineWin

        animateWin : function(){
            var a = this.animateWin.bind(this);
            var ctx = this.context;
          
            ctx.clearRect(800,0,1200, 500);

            var radius = 45 + 140 * Math.abs(Math.cos(this.angle));
            this.angle += Math.PI / 64;

            ctx.beginPath();
            ctx.arc(1000, 200, radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fillStyle = '#a15671';
            ctx.fill();

            ctx.font = '20px Helvetica';
            ctx.fillStyle = 'White';
            //ctx.globalCompositeOperation = "destination-over"; //bugs start button ???
            ctx.fillText('You won', 965,200);
            ctx.fillText(this.winAmmount + '$ !!!', 965, 220);
    
            this.requestFrame = requestAnimationFrame(a);

        },//End of animateWin

        stopWinAnimation : function(){
            var ctx = this.context;
            cancelAnimationFrame(this.requestFrame);
            ctx.clearRect(800,0,1200, 500);
        },//End of stopWinAnimation

        drawMiddleFrame : function(){   
            var ctx = this.context;
            ctx.beginPath();
            ctx.lineWidth="4";
            ctx.strokeStyle="MidnightBlue";
            ctx.rect(75,360,715,175);
            ctx.stroke();
        },//End of drawMiddleFrame

        audio : function(sound, callback){
            var soundEff = new Audio("./audio/" + sound + ".mp3");
            soundEff.play();
            soundEff.addEventListener("ended", callback);
        }//End of audio
    }

    //Constructor class for slot images
    class SlotImage {
        constructor(randomIndex, posX, posY) {
            this.randomIndex = randomIndex;
            this.name = SlotMachine.imagesArr[this.randomIndex].dataset.name;
            this.posX = posX;
            this.posY = posY;
        }
        //Constructor method for drawing images 
        drawSlotImage(posX, posY) {
            var ctx = SlotMachine.context;
            var img = SlotMachine.imagesArr[this.randomIndex];
            ctx.drawImage(img, posX, posY);
        }
    }
    SlotMachine.gameStart();
});