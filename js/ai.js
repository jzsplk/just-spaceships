Game.AI = OZ.Class();

Game.AI.prototype.init = function(game, ship) {
	this._game = game;
	this._ship = ship;
	this._phys = ship.getPhys();
	this._control = ship.getControl();
	this._oldTick = ship.tick;
	
	ship.tick = this._tick.bind(this);
	
	this._target = null;
	this._targetPhys = null;
	this._event = null;
}

Game.AI.prototype._tick = function(dt) {
	if (this._target) { 
	
		var dx = this._targetPhys.position[0]-this._phys.position[0];
		var dy = this._targetPhys.position[1]-this._phys.position[1];
		
		/* FIXME skutecna velikost sveta! */
		if (Math.abs(dx) > 1500) { dx += (dx > 0 ? -1 : 1) * 3000; }
		if (Math.abs(dy) > 1500) { dy += (dy > 0 ? -1 : 1) * 3000; }
		
		var dist = Math.sqrt(dx*dx+dy*dy);

		var angle = Math.atan2(dy, dx);
		this._control.torque.mode = 1;
		this._control.torque.target = angle;
		
		var range = this._ship.getWeapon().getRange();

		this._control.engine = (dist < range/2 ? -1 : 1);
		
		var diff = this._phys.orientation.angleDiff(angle);
		this._control.fire = (dx*dx+dy*dy < range*range && Math.abs(diff) < Math.PI/8);
	}
	
	return this._oldTick.call(this._ship, dt);
}

Game.AI.prototype.setTarget = function(target) {
	if (this._target) { OZ.Event.remove(this._event); }
	this._event = OZ.Event.add(target, "ship-death", this._shipDeath.bind(this));
	this._target = target;
	this._targetPhys = target.getPhys();
}

Game.AI.prototype.setRandomTarget = function() {
	var ships = this._game.getShips();
	var avail = [];
	for (var id in ships) {
		var ship = ships[id];
		if (ship == this._ship) { continue; }
		avail.push(ship);
	}
	if (!avail.length) { return; }
	this.setTarget(avail.random());
}

Game.AI.prototype._shipDeath = function() {
	this._target = null;
	this._control.torque.mode = 0;
	this._control.fire = false;
	this._control.engine = 0;
	OZ.Event.remove(this._event);
	
	this.setRandomTarget();
}