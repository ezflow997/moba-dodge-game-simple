export class InputHandler {
    constructor(){
        this.buttons = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.clicking = false;

        this.typingInformation = false;
        this.information = [];
        this.informationSubmit = false;

        this.q_key = 0;

        this.escapePressed = false;
        this.tabPressed = false;

        this.keysList = [
            'Shift',
            'Alt',
            'Control',
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            'F7',
            'F8',
            'F9',
            'F10',
            'F11',
            'F12',
            'End',
            'Home',
            'Insert',
            'Windows',
            'Capslock',
            'Tab',
            'NumLock',
            'Escape',
            'Backspace'
        ];

        window.addEventListener('mousedown', ev => {
            // Capture all mouse buttons (0=left, 1=middle, 2=right, 3-4=side buttons)
            if(this.buttons.indexOf(ev.button) == -1){
                this.buttons.push(ev.button);  
            }
        });

        window.addEventListener('mouseup', ev => {
            const index = this.buttons.indexOf(ev.button);
            if(index > -1){
                this.buttons.splice(index, 1);
            }
        });

        window.addEventListener('keydown', ev => {
            //console.log(ev);
            if(ev.key == 'Escape'){
                this.escapePressed = true;
            }
            if(ev.key == 'Tab'){
                ev.preventDefault(); // Prevent Tab from switching focus
                this.tabPressed = true;
            }
            if(ev.key == 'q'){
                this.q_key++;
            }
            if(this.keysList.indexOf(ev.key) == -1 && 
            this.buttons.indexOf(ev.key) == -1 && 
            this.typingInformation == false){
                this.buttons.push(ev.key);
            }
            if(this.typingInformation == true){
                //console.log(ev.key);
                if(ev.key == 'Backspace' && this.information.length > 0){
                    this.information.splice(this.information.length-1, 1);
                }
                else if(ev.key == 'Enter'){
                    this.informationSubmit = true;
                }
                else if(this.keysList.indexOf(ev.key) > -1){

                }
                else{
                    this.information.push(ev.key);
                }
            }
            //console.log(this.buttons);
        });

        window.addEventListener("contextmenu", 
            function(e){
               e.stopPropagation()
          }, false);

        window.addEventListener('keyup', ev => {
            if(ev.key == 'Escape'){
                this.escapePressed = false;
            }
            if(ev.key == 'Tab'){
                this.tabPressed = false;
            }
            if(ev.key == 'q'){
                this.q_key = 0;
            }
            if(this.keysList.indexOf(ev.key) == -1 && this.buttons.indexOf(ev.key) > -1){
                this.buttons.splice(this.buttons.indexOf(ev.key), 1);
            }
        });

        window.addEventListener('mousemove', ev => {
            if(ev.target.id == 'canvas1'){
                this.mouseX = ev.x;
                this.mouseY = ev.y;
                //console.log(ev.target.clientWidth, this.mouseX, ev.target.clientHeight, this.mouseY);
            }
        });
    }
}