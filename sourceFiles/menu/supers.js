export class superFunctions {
    constructor(){
        this.data = [];
    }

    // Enhanced text with glow effect
    drawGlowText(context, x, y, text, size, color, glowColor, glowSize = 10, centered = false) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        context.save();
        context.shadowColor = glowColor;
        context.shadowBlur = glowSize * rX;
        // Use a cleaner, more modern font
        context.font = `bold ${size * rX}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
        context.fillStyle = color;
        if (centered) {
            context.textAlign = 'center';
            context.fillText("" + text, x * rX, y * rY);
        } else {
            context.fillText("" + text, x * rX, y * rY);
        }
        context.restore();
    }

    // Gradient-filled rectangle
    drawGradientRect(context, x, y, w, h, colorStart, colorEnd, vertical = true) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        let gradient;
        if (vertical) {
            gradient = context.createLinearGradient(x * rX, y * rY, x * rX, (y + h) * rY);
        } else {
            gradient = context.createLinearGradient(x * rX, y * rY, (x + w) * rX, y * rY);
        }
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        context.fillStyle = gradient;
        context.fillRect(x * rX, y * rY, w * rX, h * rY);
    }

    // Radial gradient (for glowing effects)
    drawRadialGlow(context, x, y, innerRadius, outerRadius, innerColor, outerColor) {
        let rX = window.innerWidth / 2560;
        let rY = window.innerHeight / 1440;

        let gradient = context.createRadialGradient(
            x * rX, y * rY, innerRadius * rX,
            x * rX, y * rY, outerRadius * rX
        );
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(1, outerColor);

        context.beginPath();
        context.fillStyle = gradient;
        context.arc(x * rX, y * rY, outerRadius * rX, 0, Math.PI * 2);
        context.fill();
    }

    drawText(context, x, y, text, size, color){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        context.beginPath();
        context.font = size*rX + "px Arial Black";
        context.fillStyle = color;
        context.fillText(""+text, x*rX, y*rY);
        context.closePath();
    }
    drawTypingWindow(context, game, menu){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        context.beginPath();
        context.fillStyle = 'black';
        context.fillRect(300*rX, 300*rY, 1200*rX, 350*rY);
        context.closePath();

        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = 10*rX;
        context.strokeRect(300*rX, 300*rY, 1200*rX, 350*rY);
        context.closePath();
        
        if(menu.typingPassword == false){
            let chars = game.input.information;
            let charsToText = '';
            for(let i = 0; i < chars.length; i++){
                charsToText = '' + charsToText + '' + chars[i];
            }
            menu.super.drawText(context, 360, 460, ''+charsToText, 50, 'white');
        }
        else{
            let chars = game.input.information;
            let charsToText = '';
            for(let i = 0; i < chars.length; i++){
                if(i != chars.length - 1){
                    charsToText = '' + charsToText + '*';
                }
                else{
                    charsToText = '' + charsToText + '' + chars[i];
                }
            }
            menu.super.drawText(context, 360, 460, ''+charsToText, 50, 'white'); 
        }
    }
    drawMessageWindow(context, menu){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        // Draw semi-transparent overlay
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);
        context.restore();

        // Draw main window background with glow effect
        context.save();
        context.fillStyle = 'rgba(10, 20, 40, 0.95)';
        context.fillRect(300*rX, 300*rY, 1500*rX, 380*rY);
        
        // Draw glowing border
        context.strokeStyle = '#00ffff';
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20 * rX;
        context.lineWidth = 4 * rX;
        context.strokeRect(300*rX, 300*rY, 1500*rX, 380*rY);
        context.restore();

        // Draw title with glow
        this.drawGlowText(context, 1050, 380, 'GAME OVER', 70, '#ff4444', '#ff0000', 15);

        // Draw messages with glow
        if(menu.showMessage != ''){
            this.drawGlowText(context, 360, 480, ''+menu.showMessage, 50, '#ffffff', '#00ffff', 10);
        }
        if(menu.showMessageRow2 != '' && menu.showMessageRow2 != undefined){
            this.drawGlowText(context, 360, 540, ''+menu.showMessageRow2, 50, '#00ff88', '#00ffff', 10);
        }        
        if(menu.showMessageRow3 != '' && menu.showMessageRow3 != undefined){
            this.drawGlowText(context, 360, 600, ''+menu.showMessageRow3, 50, '#00ff88', '#00ffff', 10);
        }
    }
    createJSONAccount(user, pass, high_score, birth_date, gender, email, date, time, last_score, isBanned, 
            remember_me, device_id, daily_score, weekly_score, total_kills, total_q_presses, total_e_presses, 
            total_f_presses, total_time_spent, level, experience, easy_games, medium_games, hard_games, expert_games, insane_games){

        let i = 0;
        let data = '{"name":"' + user + '",';
        data = '' + data + '"password":"' + pass + '",';
        data = '' + data + '"high_score":{';
            i = 0; // easy
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + high_score[i].value + '",';
            data = '' + data + '"date":"' + high_score[i].date + '",';
            data = '' + data + '"time":"' + high_score[i].time + '",';
            data = '' + data + '"day":"' + high_score[i].day + '",';
            data = '' + data + '"week":"' + high_score[i].week + '",';
            data = '' + data + '"year":"' + high_score[i].year + '",';
            data = '' + data + '"kills":"' + high_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + high_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + high_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + high_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + high_score[i].f_presses + '"},';
            i = 1; // medium
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + high_score[i].value + '",';
            data = '' + data + '"date":"' + high_score[i].date + '",';
            data = '' + data + '"time":"' + high_score[i].time + '",';
            data = '' + data + '"day":"' + high_score[i].day + '",';
            data = '' + data + '"week":"' + high_score[i].week + '",';
            data = '' + data + '"year":"' + high_score[i].year + '",';
            data = '' + data + '"kills":"' + high_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + high_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + high_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + high_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + high_score[i].f_presses + '"},';
            i = 2; // hard
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + high_score[i].value + '",';
            data = '' + data + '"date":"' + high_score[i].date + '",';
            data = '' + data + '"time":"' + high_score[i].time + '",';
            data = '' + data + '"day":"' + high_score[i].day + '",';
            data = '' + data + '"week":"' + high_score[i].week + '",';
            data = '' + data + '"year":"' + high_score[i].year + '",';
            data = '' + data + '"kills":"' + high_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + high_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + high_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + high_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + high_score[i].f_presses + '"},';
            i = 3; // expert
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + high_score[i].value + '",';
            data = '' + data + '"date":"' + high_score[i].date + '",';
            data = '' + data + '"time":"' + high_score[i].time + '",';
            data = '' + data + '"day":"' + high_score[i].day + '",';
            data = '' + data + '"week":"' + high_score[i].week + '",';
            data = '' + data + '"year":"' + high_score[i].year + '",';
            data = '' + data + '"kills":"' + high_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + high_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + high_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + high_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + high_score[i].f_presses + '"},';
            i = 4; // insane
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + high_score[i].value + '",';
            data = '' + data + '"date":"' + high_score[i].date + '",';
            data = '' + data + '"time":"' + high_score[i].time + '",';
            data = '' + data + '"day":"' + high_score[i].day + '",';
            data = '' + data + '"week":"' + high_score[i].week + '",';
            data = '' + data + '"year":"' + high_score[i].year + '",';
            data = '' + data + '"kills":"' + high_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + high_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + high_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + high_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + high_score[i].f_presses + '"}},';
        data = '' + data + '"birth_date":"' + birth_date + '",';
        data = '' + data + '"gender":"' + gender + '",';
        data = '' + data + '"email":"' + email + '",';
        data = '' + data + '"account_date":"' + date + '",';
        data = '' + data + '"account_time":"' + time + '",';
        data = '' + data + '"last_score":{';
            i = 0; // easy
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + last_score[i].value + '",';
            data = '' + data + '"date":"' + last_score[i].date + '",';
            data = '' + data + '"time":"' + last_score[i].time + '",';
            data = '' + data + '"day":"' + last_score[i].day + '",';
            data = '' + data + '"week":"' + last_score[i].week + '",';
            data = '' + data + '"year":"' + last_score[i].year + '",';
            data = '' + data + '"kills":"' + last_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + last_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + last_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + last_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + last_score[i].f_presses + '"},';
            i = 1; // medium
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + last_score[i].value + '",';
            data = '' + data + '"date":"' + last_score[i].date + '",';
            data = '' + data + '"time":"' + last_score[i].time + '",';
            data = '' + data + '"day":"' + last_score[i].day + '",';
            data = '' + data + '"week":"' + last_score[i].week + '",';
            data = '' + data + '"year":"' + last_score[i].year + '",';
            data = '' + data + '"kills":"' + last_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + last_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + last_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + last_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + last_score[i].f_presses + '"},';
            i = 2; // hard
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + last_score[i].value + '",';
            data = '' + data + '"date":"' + last_score[i].date + '",';
            data = '' + data + '"time":"' + last_score[i].time + '",';
            data = '' + data + '"day":"' + last_score[i].day + '",';
            data = '' + data + '"week":"' + last_score[i].week + '",';
            data = '' + data + '"year":"' + last_score[i].year + '",';
            data = '' + data + '"kills":"' + last_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + last_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + last_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + last_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + last_score[i].f_presses + '"},';
            i = 3; // expert
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + last_score[i].value + '",';
            data = '' + data + '"date":"' + last_score[i].date + '",';
            data = '' + data + '"time":"' + last_score[i].time + '",';
            data = '' + data + '"day":"' + last_score[i].day + '",';
            data = '' + data + '"week":"' + last_score[i].week + '",';
            data = '' + data + '"year":"' + last_score[i].year + '",';
            data = '' + data + '"kills":"' + last_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + last_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + last_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + last_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + last_score[i].f_presses + '"},';
            i = 4; // insane
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + last_score[i].value + '",';
            data = '' + data + '"date":"' + last_score[i].date + '",';
            data = '' + data + '"time":"' + last_score[i].time + '",';
            data = '' + data + '"day":"' + last_score[i].day + '",';
            data = '' + data + '"week":"' + last_score[i].week + '",';
            data = '' + data + '"year":"' + last_score[i].year + '",';
            data = '' + data + '"kills":"' + last_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + last_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + last_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + last_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + last_score[i].f_presses + '"}},';
        data = '' + data + '"is_banned":"' + isBanned + '",';
        data = '' + data + '"remember_me":"' + remember_me + '",';
        data = '' + data + '"device_id":"' + device_id + '",';
        data = '' + data + '"daily_score":{';
            i = 0; // easy
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + daily_score[i].value + '",';
            data = '' + data + '"date":"' + daily_score[i].date + '",';
            data = '' + data + '"time":"' + daily_score[i].time + '",';
            data = '' + data + '"day":"' + daily_score[i].day + '",';
            data = '' + data + '"week":"' + daily_score[i].week + '",';
            data = '' + data + '"year":"' + daily_score[i].year + '",';
            data = '' + data + '"kills":"' + daily_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + daily_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + daily_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + daily_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + daily_score[i].f_presses + '"},';
            i = 1; // medium
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + daily_score[i].value + '",';
            data = '' + data + '"date":"' + daily_score[i].date + '",';
            data = '' + data + '"time":"' + daily_score[i].time + '",';
            data = '' + data + '"day":"' + daily_score[i].day + '",';
            data = '' + data + '"week":"' + daily_score[i].week + '",';
            data = '' + data + '"year":"' + daily_score[i].year + '",';
            data = '' + data + '"kills":"' + daily_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + daily_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + daily_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + daily_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + daily_score[i].f_presses + '"},';
            i = 2; // hard
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + daily_score[i].value + '",';
            data = '' + data + '"date":"' + daily_score[i].date + '",';
            data = '' + data + '"time":"' + daily_score[i].time + '",';
            data = '' + data + '"day":"' + daily_score[i].day + '",';
            data = '' + data + '"week":"' + daily_score[i].week + '",';
            data = '' + data + '"year":"' + daily_score[i].year + '",';
            data = '' + data + '"kills":"' + daily_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + daily_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + daily_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + daily_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + daily_score[i].f_presses + '"},';
            i = 3; // expert
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + daily_score[i].value + '",';
            data = '' + data + '"date":"' + daily_score[i].date + '",';
            data = '' + data + '"time":"' + daily_score[i].time + '",';
            data = '' + data + '"day":"' + daily_score[i].day + '",';
            data = '' + data + '"week":"' + daily_score[i].week + '",';
            data = '' + data + '"year":"' + daily_score[i].year + '",';
            data = '' + data + '"kills":"' + daily_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + daily_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + daily_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + daily_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + daily_score[i].f_presses + '"},';
            i = 4; // insane
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + daily_score[i].value + '",';
            data = '' + data + '"date":"' + daily_score[i].date + '",';
            data = '' + data + '"time":"' + daily_score[i].time + '",';
            data = '' + data + '"day":"' + daily_score[i].day + '",';
            data = '' + data + '"week":"' + daily_score[i].week + '",';
            data = '' + data + '"year":"' + daily_score[i].year + '",';
            data = '' + data + '"kills":"' + daily_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + daily_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + daily_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + daily_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + daily_score[i].f_presses + '"}},';
        data = '' + data + '"weekly_score":{';
            i = 0; // easy
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + weekly_score[i].value + '",';
            data = '' + data + '"date":"' + weekly_score[i].date + '",';
            data = '' + data + '"time":"' + weekly_score[i].time + '",';
            data = '' + data + '"day":"' + weekly_score[i].day + '",';
            data = '' + data + '"week":"' + weekly_score[i].week + '",';
            data = '' + data + '"year":"' + weekly_score[i].year + '",';
            data = '' + data + '"kills":"' + weekly_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + weekly_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + weekly_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + weekly_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + weekly_score[i].f_presses + '"},';
            i = 1; // medium
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + weekly_score[i].value + '",';
            data = '' + data + '"date":"' + weekly_score[i].date + '",';
            data = '' + data + '"time":"' + weekly_score[i].time + '",';
            data = '' + data + '"day":"' + weekly_score[i].day + '",';
            data = '' + data + '"week":"' + weekly_score[i].week + '",';
            data = '' + data + '"year":"' + weekly_score[i].year + '",';
            data = '' + data + '"kills":"' + weekly_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + weekly_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + weekly_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + weekly_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + weekly_score[i].f_presses + '"},';
            i = 2; // hard
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + weekly_score[i].value + '",';
            data = '' + data + '"date":"' + weekly_score[i].date + '",';
            data = '' + data + '"time":"' + weekly_score[i].time + '",';
            data = '' + data + '"day":"' + weekly_score[i].day + '",';
            data = '' + data + '"week":"' + weekly_score[i].week + '",';
            data = '' + data + '"year":"' + weekly_score[i].year + '",';
            data = '' + data + '"kills":"' + weekly_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + weekly_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + weekly_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + weekly_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + weekly_score[i].f_presses + '"},';
            i = 3; // expert
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + weekly_score[i].value + '",';
            data = '' + data + '"date":"' + weekly_score[i].date + '",';
            data = '' + data + '"time":"' + weekly_score[i].time + '",';
            data = '' + data + '"day":"' + weekly_score[i].day + '",';
            data = '' + data + '"week":"' + weekly_score[i].week + '",';
            data = '' + data + '"year":"' + weekly_score[i].year + '",';
            data = '' + data + '"kills":"' + weekly_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + weekly_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + weekly_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + weekly_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + weekly_score[i].f_presses + '"},';
            i = 4; // insane
            data = '' + data + '"' + i + '":';
            data = '' + data + '{"value":"' + weekly_score[i].value + '",';
            data = '' + data + '"date":"' + weekly_score[i].date + '",';
            data = '' + data + '"time":"' + weekly_score[i].time + '",';
            data = '' + data + '"day":"' + weekly_score[i].day + '",';
            data = '' + data + '"week":"' + weekly_score[i].week + '",';
            data = '' + data + '"year":"' + weekly_score[i].year + '",';
            data = '' + data + '"kills":"' + weekly_score[i].kills + '",';
            data = '' + data + '"best_streak":"' + weekly_score[i].best_streak + '",';
            data = '' + data + '"q_presses":"' + weekly_score[i].q_presses + '",';
            data = '' + data + '"e_presses":"' + weekly_score[i].e_presses + '",';
            data = '' + data + '"f_presses":"' + weekly_score[i].f_presses + '"}},';
        data = '' + data  + '"total_kills":"' + total_kills + '",';
        data = '' + data  + '"total_q_presses":"' + total_q_presses + '",';
        data = '' + data  + '"total_e_presses":"' + total_e_presses + '",';
        data = '' + data  + '"total_f_presses":"' + total_f_presses + '",';
        data = '' + data  + '"total_time_spent":"' + total_time_spent + '",';
        data = '' + data  + '"level":"' + level + '",';
        data = '' + data  + '"experience":"' + experience + '",';
        data = '' + data  + '"easy_games":"' + easy_games + '",';
        data = '' + data  + '"medium_games":"' + medium_games + '",';
        data = '' + data  + '"hard_games":"' + hard_games + '",';
        data = '' + data  + '"expert_games":"' + expert_games + '",';
        data = '' + data  + '"insane_games":"' + insane_games + '"';
        data = '' + data + '}';
        
        
        this.data = data;
    }

    getOffset(bullets, x, y, aR, C){
        bullets.offY = y + (Math.sin(aR) * C);
        bullets.offX = x + (Math.cos(aR) * C);

        //console.log(bullets.offX, x);
        //console.log(bullets.offY, y);
    }
    
    getTravel(bullets, x, y, aR, C){
        bullets.endY = y + (Math.sin(aR) * C);
        bullets.endX = x + (Math.cos(aR) * C);

        //console.log(bullets.endX, x);
        //console.log(bullets.endY, y);
    }
    
    getAngle(bullets, sX, sY, eX, eY){
        bullets.dirX = 1;
        if(eX - sX < 0){
            bullets.dirX = -1;
        }
    
        bullets.dirY = 1;
        if(eY - sY < 0){
            bullets.dirY = -1;
        }
    
        // FIX: Use atan2 for proper full-angle calculation
        bullets.angle = Math.atan2(eY - sY, eX - sX);

        //console.log(bullets.angle, sX, sY, eX, eY, bullets.dirX, bullets.dirY, c);
    }
}

export class Button {
    constructor(x, y, w, h, text, textSize, textX, textY, isHovered, has_border, text_color, border_color){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
        this.textSize = textSize;
        this.textX = textX;
        this.textY = textY;
        this.isHovered = isHovered;

        this.has_border = has_border;
        if(has_border == undefined){
            this.has_border = true;
        }

        this.text_color = text_color;
        if(text_color == undefined){
            this.text_color = 'white';
        }

        this.border_color = border_color;
        if(border_color == undefined){
            this.border_color = 'white';
        }

        // Animation properties
        this.hoverProgress = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.glowIntensity = 0;
        this.wasHovered = false;
    }
    draw(context){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        drawButtonEnhanced(context, this.x*rX, this.y*rY, this.w*rX, this.h*rY, this.isHovered, this.text, this.textSize*rX, this.textX*rX, this.textY*rY, this.has_border, this.text_color, this.border_color, this.hoverProgress, this.pulsePhase, this.glowIntensity);
    }
    update(inX, inY){
        let rX = window.innerWidth/2560;
        let rY = window.innerHeight/1440;

        var hovered = checkHover(inX, inY, this.x*rX, this.y*rY, this.w*rX, this.h*rY);
        if(hovered == true){
            this.isHovered = true;
            // Play hover sound when first entering button
            if (!this.wasHovered && window.gameSound) {
                window.gameSound.playMenuHover();
            }
        }
        else{
            this.isHovered = false;
        }
        this.wasHovered = hovered;

        // Smooth hover transition
        if (this.isHovered) {
            this.hoverProgress = Math.min(1, this.hoverProgress + 0.12);
            this.glowIntensity = Math.min(20, this.glowIntensity + 2);
        } else {
            this.hoverProgress = Math.max(0, this.hoverProgress - 0.08);
            this.glowIntensity = Math.max(0, this.glowIntensity - 1.5);
        }

        // Update pulse
        this.pulsePhase += 0.06;
    }
}

function checkHover(inX, inY, btnX, btnY, btnW, btnH){
    if(inX > btnX && inX < btnX + btnW){
        if(inY > btnY && inY < btnY + btnH){
            return true;
        }
        else{
            return false;
        }
    }
    else{
        return false;
    }
}

function drawButton(ctx, btnX, btnY, btnW, btnH, hovered, text, textSize, textX, textY, has_border, text_color, border_color){
    if(has_border == true){
        let rY = window.innerHeight/1440;
        ctx.beginPath();
        ctx.strokeStyle = border_color;
        ctx.lineWidth = 5*rY;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.closePath();
    }

    if(hovered == true){
        ctx.beginPath();
        ctx.fillStyle = 'cyan';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.font = textSize + "px Arial Black";
    ctx.fillStyle = text_color;
    ctx.fillText(""+text, btnX + textX, btnY + textY);
    ctx.closePath();
}

// Enhanced button with gradients, glow, and smooth animations
function drawButtonEnhanced(ctx, btnX, btnY, btnW, btnH, hovered, text, textSize, textX, textY, has_border, text_color, border_color, hoverProgress, pulsePhase, glowIntensity) {
    let rY = window.innerHeight / 1440;
    let rX = window.innerWidth / 2560;
    const radius = 8 * rX; // Rounded corner radius

    ctx.save();

    // Helper to draw rounded rectangle
    function roundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // Outer glow when hovered
    if (hoverProgress > 0) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = (15 + hoverProgress * 20) * rX;
    }

    // Background gradient - dark glass effect
    const bgGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (hoverProgress > 0) {
        // Hovered: cyan glow fill
        bgGradient.addColorStop(0, `rgba(0, 80, 100, ${0.7 + hoverProgress * 0.2})`);
        bgGradient.addColorStop(0.4, `rgba(0, 60, 80, ${0.85 + hoverProgress * 0.1})`);
        bgGradient.addColorStop(1, `rgba(0, 40, 60, ${0.9})`);
    } else {
        // Normal: dark semi-transparent
        bgGradient.addColorStop(0, 'rgba(20, 30, 50, 0.85)');
        bgGradient.addColorStop(0.5, 'rgba(15, 25, 45, 0.9)');
        bgGradient.addColorStop(1, 'rgba(10, 20, 40, 0.95)');
    }

    ctx.fillStyle = bgGradient;
    roundedRect(btnX, btnY, btnW, btnH, radius);
    ctx.fill();

    // Inner highlight at top (glass effect)
    ctx.save();
    const highlightGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH * 0.5);
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${0.08 + hoverProgress * 0.12})`);
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    roundedRect(btnX + 2 * rX, btnY + 2 * rX, btnW - 4 * rX, btnH * 0.5, radius - 2 * rX);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Border
    if (has_border) {
        ctx.save();
        const borderPulse = 0.7 + Math.sin(pulsePhase * 0.5) * 0.3;

        if (hoverProgress > 0) {
            // Glowing cyan border when hovered
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10 * rX * hoverProgress;
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 + hoverProgress * 0.2})`;
            ctx.lineWidth = (2 + hoverProgress * 1.5) * rX;
        } else {
            // Subtle pulsing border
            ctx.strokeStyle = `rgba(80, 120, 160, ${borderPulse})`;
            ctx.lineWidth = 1.5 * rX;
        }

        roundedRect(btnX, btnY, btnW, btnH, radius);
        ctx.stroke();

        // Inner border line for depth
        if (hoverProgress > 0.2) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${hoverProgress * 0.3})`;
            ctx.lineWidth = 1 * rX;
            roundedRect(btnX + 3 * rX, btnY + 3 * rX, btnW - 6 * rX, btnH - 6 * rX, radius - 2 * rX);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Text - centered and with better font
    ctx.save();

    // Text glow when hovered
    if (hoverProgress > 0.2) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = (3 + hoverProgress * 10) * rX;
    }

    // Use a cleaner font, properly scaled
    const fontSize = Math.max(12, textSize);
    ctx.font = `600 ${fontSize}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text color transitions from normal to white when hovered
    if (hoverProgress > 0.3) {
        ctx.fillStyle = '#ffffff';
    } else {
        ctx.fillStyle = text_color;
    }

    // Draw text centered in button
    ctx.fillText(text, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
}