function constrainVector(v, low, high) {
	return createVector(constrain(v.x, low, high), constrain(v.y, low, high), constrain(v.z, low, high));
}


class Planet {
	
	constructor(pos, radius, baseColor=createVector(220, 220, 220), isStatic=false) {
		this.pos = pos;
		this.radius = radius;
		this.baseColor = baseColor;
		this.lighterColor = constrainVector(p5.Vector.add(this.baseColor, createVector(25, 25, 25)).mult(1.5), 0, 255);
		this.darkerColor = p5.Vector.mult(this.baseColor, 0.5);
		this.darkestColor = p5.Vector.mult(this.baseColor, 0.3);
		this.craters = [];
		this.generateProperties();
		this.angle = 0;
		this.isStatic = isStatic;
	}
	
	generateProperties(nCraters=10) {
		let a, a2, a3;
		for (let i=0; i<nCraters; i++) {
			a = p5.Vector.random2D().mult(this.radius/2+random(0,2)*this.radius/11);
			a2 = p5.Vector.mult(a, 0.99);
			a3 = p5.Vector.mult(a2, 0.99);
			this.craters.push({"radius": this.radius/random(4,10), "a": a, "a2": a2, "a3": a3,});
		}
	}	
	
	drawCrater(crater) {
		let a, a2, a3;
		a = p5.Vector.add(crater.a, this.pos);
		a2 = p5.Vector.add(crater.a2, this.pos);
		a3 = p5.Vector.add(crater.a3, this.pos);
		WindowHandler.drawCircle(a3, crater.radius*1.1, this.darkerColor, this.lighterColor);
		WindowHandler.drawCircle(a2, crater.radius, this.baseColor, this.lighterColor);
		WindowHandler.drawCircle(a, crater.radius, this.darkestColor, this.lighterColor);
	}
	
	move(vec) {
		this.pos.add(vec);
	}
	
	rotate(ang) {
		this.angle += ang;
	}
	
	handleKeys() {
		
	}
	
	drawExtras(keyResults) {
		
	}
	
	selfRotate(angle) {
		let c = WindowHandler.transformCoordinates(this.pos);
		translate(c);
		rotate(angle);
		translate(c.mult(-1));
	}
	
	draw() {
		if (WindowHandler.onScreen(this.pos, this.radius+0.1)) {
			if (!this.isStatic) { 
				this.pos.x = constrain(this.pos.x, totalDims.xmin+this.radius, totalDims.xmax-this.radius);
				this.pos.y = constrain(this.pos.y, totalDims.ymin+this.radius, totalDims.ymax-this.radius);
				this.rotationVector = p5.Vector.fromAngle(this.angle);
				this.rotPerp = p5.Vector.fromAngle(this.angle+HALF_PI);
			}
			let keyResults = this.handleKeys();
			
			push();
			WindowHandler.drawCircle(this.pos, this.radius+0.1, this.lighterColor, this.lighterColor);
			this.selfRotate(-this.angle);
			this.drawExtras(keyResults);
			WindowHandler.drawCircle(this.pos, this.radius, this.baseColor, this.lighterColor);
			for (let crater of this.craters) {
				this.drawCrater(crater);
			}
			pop();
		}
	}	
}


class Moon extends Planet {
	
	constructor(pos, radius, baseColor=createVector(220, 220, 220)) {
		super(pos, radius, baseColor, false);
		this.bulletColor = createVector(0, 255, 255);
		this.bullets = [];
		this.canShoot = true;
	}
	
	handleKeys() {
		let leftThrusterOn = false, rightThrusterOn = false;
		if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
			this.rotate(PI/40);
			rightThrusterOn = true;
		}
		if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
			this.rotate(-PI/40);
			leftThrusterOn = true;
		}
		if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
			this.move(p5.Vector.mult(this.rotationVector, 0.2));
			rightThrusterOn = true;
			leftThrusterOn = true;
		}
		WindowHandler.cameraTrack(this);
		this.pos.x = constrain(this.pos.x, totalDims.xmin+this.radius+0.1, totalDims.xmax-this.radius-0.1);
		this.pos.y = constrain(this.pos.y, totalDims.ymin+this.radius+0.1, totalDims.ymax-this.radius-0.1);
		return [leftThrusterOn, rightThrusterOn];
	}
	
	shoot() {
		if (this.canShoot) {
			this.bullets.push(new Bullet(this.gunPoints[0], this.rotationVector, this.bulletColor));
			this.bullets.push(new Bullet(this.gunPoints[1], this.rotationVector, this.bulletColor));
			this.toggleWeapon();
		}
	}
	
	toggleWeapon() {
		this.canShoot = !this.canShoot;
	}
	
	drawExtras(thrustersOn) {
		let thrusterX = this.pos.x - this.radius * 1.1, fthR = this.radius/5;
		let leftGunY = this.pos.y + this.radius * 1.3, rightGunY = this.pos.y - this.radius+fthR;
		this.gunPoints = [this.rotationVector.copy().mult(fthR).add(this.rotPerp.copy().mult(this.radius*1.3-fthR/4)).add(this.pos),
						  this.rotationVector.copy().mult(fthR).add(this.rotPerp.copy().mult(-this.radius-fthR-fthR/4)).add(this.pos)];
		
		WindowHandler.drawRect(createVector(thrusterX, this.pos.y + 3*fthR), this.radius/2, fthR, this.darkestColor, this.lighterColor);
		WindowHandler.drawRect(createVector(thrusterX, this.pos.y-2*fthR), this.radius/2, fthR, this.darkestColor, this.lighterColor);
		WindowHandler.drawRect(createVector(this.pos.x, leftGunY), fthR, this.radius/2, this.darkerColor, this.darkerColor);
		WindowHandler.drawRect(createVector(this.pos.x, rightGunY), fthR, this.radius/2, this.darkerColor, this.darkerColor);
		WindowHandler.drawRect(createVector(this.pos.x, leftGunY), 2*fthR, fthR/2, this.darkerColor, this.darkerColor);
		WindowHandler.drawRect(createVector(this.pos.x, rightGunY-2*fthR), 2*fthR, fthR/2, this.darkerColor, this.darkerColor);
		
		if (thrustersOn[0]) {
			WindowHandler.drawFire(createVector(thrusterX, this.pos.y+this.radius/2), fthR, fthR);
		}
		if (thrustersOn[1]) {
			WindowHandler.drawFire(createVector(thrusterX, this.pos.y-this.radius/2), fthR, fthR);
		}
		
		let bullet;
		for (let i=0; i<this.bullets.length; i++) {
			bullet = this.bullets[i];
			this.selfRotate(this.angle);
			bullet.draw();
			this.selfRotate(-this.angle);
			if (!WindowHandler.onScreen(bullet.pos, bullet.l)) {
				this.bullets.splice(i,1);
				i--;
			}
		}
	}
	
}