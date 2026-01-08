export class makeMovements{
    make(x, y, speed, endX, endY){
        var xVal = Math.abs(endX - x);
        var yVal = Math.abs(endY - y);
        var cVal = Math.sqrt(Math.pow(xVal,2) + Math.pow(yVal,2));
        var xAngle = Math.acos(xVal/cVal);
        var yAngle = Math.asin(yVal/cVal);
    
        var xSpeed = speed * Math.cos(xAngle);
        var ySpeed = speed * Math.sin(yAngle);
        
        if(endX - x < 0 && endX != x){
            if(x - xSpeed <=  endX){
                x = endX;
            }
            else{
                x = x - xSpeed;
            }
        }
        else if(endX != x){
            if(x + xSpeed >=  endX){
                x = endX;
            }
            else{
                x = x + xSpeed;
            }
        }
        else{
            x = endX;
        }
    
        if(endY - y < 0 && endY != y){
            if(y - ySpeed <= endY){
                y = endY;
            }
            else{
                y = y - ySpeed;
            }
        }
        else if(endY != y){
            if(y + ySpeed >= endY){
                y = endY;
            }
            else{
                y = y + ySpeed;
            }    
        }
        else{
            y = endY;
        }
    
        return [x, y];
    }
}