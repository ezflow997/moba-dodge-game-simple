import { Bullet } from "./bullet.js";
import { superFunctions } from "../menu/supers.js";

export class Bullets {
    constructor(){
        this.super = new superFunctions();
        this.bulletsList = [];
        this.bulletsMax = 5;
        this.bulletsSpawnInterval = 10;
        this.bulletsSpawnNow = window.performance.now();
        this.bulletsSpawnCount = 0;
        this.bulletsCreated = false;
        this.bulletsSpawned = false;
        this.bulletsDeSpawned = false;
        this.bulletsHitTarget = false;

        this.bulletsMaxTravel = 780 * window.innerWidth / 2560;

        this.bulletSpeed = 18 * 120/60;
        this.bulletSize = 15;
        this.bulletColor = 'purple';

        this.endX = 0;
        this.endY = 0;
        this.dirX = 1;
        this.dirY = 1
        this.offX = 0;
        this.offY = 0;
        this.angle = 0;

        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;
    }
    reset(){
        this.bulletsList = [];
        this.bulletsMaxTravel = 780 * window.innerWidth / 2560;
        this.bulletsSpawnCount = 0;
        this.bulletsCreated = false;
        this.bulletsSpawned = false;
        this.bulletsDeSpawned = false;
        this.bulletsHitTarget = false;
    }
    update(player, input, enemies, game){
        if(this.prevWindowWidth != window.innerWidth || this.prevWindowHeight != window.innerHeight){
            this.bulletsMaxTravel = this.bulletsMaxTravel * window.innerWidth / this.prevWindowWidth;

            this.prevWindowWidth = window.innerWidth;
            this.prevWindowHeight = window.innerHeight;
        }
        if(player.qPressed == true){
            let msNow = window.performance.now();
            player.qCoolDownElapsed = msNow - player.qPressedNow;
            //console.log(player.qCoolDownElapsed);

            if(this.bulletsCreated == true){
                if(this.bulletsList.length == 0 || this.bulletsHitTarget == true){
                    this.bulletsCreated = false;
                    this.bulletsSpawned = false;
                    this.bulletsDeSpawned = true;
                    this.bulletsSpawnCount = 0;
                    this.bulletsHitTarget = false;
                }
                else{
                    let msNow = window.performance.now();
                    let msPassed = msNow - this.bulletsSpawnNow;
                    if(msPassed > this.bulletsSpawnInterval && this.bulletsSpawnCount < this.bulletsMax){
                        this.bulletsSpawnNow = window.performance.now();
                        this.bulletsSpawnCount += 1;
                        this.bulletsSpawned = false;
                    }
                    else if(this.bulletsSpawnCount == this.bulletsMax){
                        this.bulletsSpawned = true;
                    }

                    if(this.bulletsSpawned == true && this.bulletsHitTarget == false){
                        for(let i = 0; i < this.bulletsList.length; i++){
                            //console.log(this.bulletsList[i].destroy, this.bulletsList.length);
                            //console.log(i);
                            if(this.bulletsList[i].destroy == true || this.bulletsList[i].enemyCollision == true){
                                //console.log(i,this.bulletsList[i].destroy);
                                if(this.bulletsList[i].enemyCollision == true){
                                    this.bulletsList = [];
                                    this.bulletsHitTarget = true;
                                    break;
                                }
                                else if(this.bulletsList[i].destroy == true){
                                    enemies.hitStreak = 0;
                                    this.bulletsList.splice(i,1);
                                }
                            }
                            else{
                                this.bulletsList[i].update();
                                this.bulletsList[i].checkCollision(enemies.enemiesList);
                                //this.bulletsList[i].checkCollision()
                            }
                        }
                    }
                    else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0 && this.bulletsList.length > 0 && this.bulletsHitTarget == false){
                        let max = Math.min(this.bulletsSpawnCount, this.bulletsList.length);
                        for(let i = 0; i < max; i++){
                            if(!this.bulletsList[i]) break;
                            if(this.bulletsList[i].enemyCollision == true){
                                this.bulletsList = [];
                                this.bulletsHitTarget = true;
                                break;
                            }
                            else{
                                this.bulletsList[i].update();
                                this.bulletsList[i].checkCollision(enemies.enemiesList);
                            }
                        }
                    }
                }
            }

            if(player.qCoolDownElapsed >= player.qCoolDown && this.bulletsDeSpawned == true){
                player.qPressed = false;
                this.bulletsDeSpawned = false;
                //console.log(this);
            }
            else if(player.qCoolDownElapsed >= 0 && player.qTriggered == false){
                this.super.getAngle(this, player.x, player.y, input.mouseX, input.mouseY);
                //this.angle = this.angle * 180 / Math.PI;
                this.super.getTravel(this, player.x, player.y, this.angle, this.bulletsMaxTravel);
                this.super.getOffset(this, player.x, player.y, this.angle, (player.size/2));
                player.qTriggered = true;
                this.bulletsList = [];
                //console.log("first:",this);
                for(let i = 0; i < this.bulletsMax; i++){
                    let b = new Bullet(this.offX, this.offY, this.endX, this.endY, this.bulletSize*((100-(i*20))/100), this.bulletColor, this.bulletSpeed, 'Normal');
                    //console.log(b);
                    this.bulletsList.push(b);
                }
                this.bulletsCreated = true;
                if (window.gameSound) window.gameSound.playShoot();
                this.bulletsSpawnNow = window.performance.now();
                //console.log("second:",this.bulletsList);
            }
        }
        this.prevWindowWidth = window.innerWidth;
        this.prevWindowHeight = window.innerHeight;
    }
    draw(context){
        if(this.bulletsSpawned == true){
            for(let i = 0; i < this.bulletsList.length; i++){
                //console.log('spawned',this.bulletsList[i]);
                this.bulletsList[i].draw(context);
            }
        }
        else if(this.bulletsSpawned == false && this.bulletsSpawnCount > 0){
            let max = this.bulletsSpawnCount;
            if(max <= this.bulletsList.length){
                for(let i = 0; i < max; i++){
                    //console.log('',this.bulletsList);
                    this.bulletsList[i].draw(context);
                }
            }
        }
    }
}