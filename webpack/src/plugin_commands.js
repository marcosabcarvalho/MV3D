import mv3d from './mv3d.js';
import { makeColor, relativeNumber, booleanString } from './util.js';

const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	if(command.toLowerCase() !== 'mv3d'){
		return _pluginCommand.apply(this,arguments);
	}
	const pc = new mv3d.PluginCommand();
	pc.INTERPRETER=this;
	pc.FULL_COMMAND=[command,...args].join(' ');
	args=args.filter(v=>v);
	pc.CHAR=$gameMap.event(this._eventId);
	if(args[0]){
		const firstChar = args[0][0];
		if(firstChar==='@'||firstChar==='＠'){
			pc.CHAR = pc.TARGET_CHAR(args.shift());
		}
	}

	const com = args.shift().toLowerCase();
	if(com in pc){
		pc[com](...args);
	}
};


mv3d.PluginCommand=class{
	async camera(...a){
		var time=this._TIME(a[2]);
		switch(a[0].toLowerCase()){
			case 'pitch'    : this.pitch (a[1],time); return;
			case 'yaw'      : this.yaw   (a[1],time); return;
			case 'dist'     :
			case 'distance' : this.dist  (a[1],time); return;
			case 'height'   : this.height(a[1],time); return;
			case 'mode'     : this.cameramode(a[1]); return;
			case 'target': this._cameraTarget(a[1],time); return;
			case 'pan': this.pan(a[1],a[2],a[3]); return;
		}
	}
	yaw(deg,time=1){
		this._RELATIVE_BLEND(mv3d.blendCameraYaw,deg,time);
		if ( mv3d.is1stPerson() ) { mv3d.playerFaceYaw(); }
	}
	pitch(deg,time=1){ this._RELATIVE_BLEND(mv3d.blendCameraPitch,deg,time); }
	dist(n,time=1){ this._RELATIVE_BLEND(mv3d.blendCameraDist,n,time); }
	height(n,time=1){ this._RELATIVE_BLEND(mv3d.blendCameraHeight,n,time); }
	_cameraTarget(target,time){
		mv3d.setCameraTarget(this.TARGET_CHAR(target), time);
	}
	pan(x,y,time=1){
		console.log(x,y,time);
		time=this._TIME(time);
		this._RELATIVE_BLEND(mv3d.blendPanX,x,time);
		this._RELATIVE_BLEND(mv3d.blendPanY,y,time);
	}

	get rotationmode(){ return this.allowrotation; }
	get pitchmode(){ return this.allowpitch; }

	allowrotation(b){ mv3d.saveData('allowRotation',booleanString(b)); }
	allowpitch(b){ mv3d.saveData('allowPitch',booleanString(b)); }
	lockcamera(b){ mv3d.saveData('cameraLocked',booleanString(b)); }

	_VEHICLE(vehicle,data,value){
		data=data.toLowerCase();
		const key = `${Vehicle}_${data}`;
		if(data==='big'){ value=booleanString(value); }
		else{ value=relativeNumber(mv3d.loadData(key,0),value); }
		mv3d.saveData(key,value);
	}
	boat(d,v){ this._VEHICLE('boat',d,v); }
	ship(d,v){ this._VEHICLE('ship',d,v); }
	airship(d,v){ this._VEHICLE('airship',d,v); }
	cameramode(mode){ mv3d.cameraMode=mode; }
	fog(...a){
		var time=this._TIME(a[2]);
		switch(a[0].toLowerCase()){
			case 'color': this._fogColor(a[1],time); return;
			case 'near': this._fogNear(a[1],time); return;
			case 'far': this._fogFar(a[1],time); return;
			case 'dist': case 'distance':
				time=this._TIME(a[3]);
				this._fogNear(a[1],time);
				this._fogFar(a[2],time);
				return;
		}
		time=this._TIME(a[3]);
		this._fogColor(a[0],time);
		this._fogNear(a[1],time);
		this._fogFar(a[2],time);
	}
	_fogColor(color,time){ mv3d.blendFogColor.setValue(makeColor(color).toNumber(),time); }
	_fogNear(n,time){ this._RELATIVE_BLEND(mv3d.blendFogNear,n,time); }
	_fogFar(n,time){ this._RELATIVE_BLEND(mv3d.blendFogFar,n,time); }
	get ambient(){ return this.light; }
	light(...a){
		var time=this._TIME(a[2]);
		switch(a[0].toLowerCase()){
			case 'color'    : this._lightColor    (a[1],time); return;
			//case 'intensity': this._lightIntensity(a[1],time); return;
		}
		time=this._TIME(a[1]);
		this._lightColor(a[0],time);
		//this._lightintensity(a[0],time);
	}
	_lightColor(color,time=1){ mv3d.blendAmbientColor.setValue(makeColor(color).toNumber(),time); }
	//_lightIntensity(n,time=1){ this._RELATIVE_BLEND(mv3d.blendLightIntensity,n,time); }
	async lamp(...a){
		const char = await this.AWAIT_CHAR(this.CHAR);
		char.setupLamp();
		var time=this._TIME(a[2]);
		switch(a[0].toLowerCase()){
			case 'color'    : this._lampColor    (char,a[1],time); return;
			case 'intensity': this._lampIntensity(char,a[1],time); return;
			case 'dist'     :
			case 'distance' : this._lampDistance (char,a[1],time); return;
		}
		time=this._TIME(a[3]);
		this._lampColor(char,a[0],time);
		this._lampIntensity(char,a[1],time);
		this._lampDistance(char,a[2],time);
	}
	_lampColor(char,color,time=1){ char.blendLampColor.setValue(makeColor(color).toNumber(),time); }
	_lampIntensity(char,n,time=1){ this._RELATIVE_BLEND(char.blendLampIntensity,n,time); }
	_lampDistance(char,n,time=1){ this._RELATIVE_BLEND(char.blendLampDistance,n,time); }
	async flashlight(...a){
		const char = await this.AWAIT_CHAR(this.CHAR);
		char.setupFlashlight();
		var time=this._TIME(a[2]);
		switch(a[0].toLowerCase()){
			case 'color'    : this._flashlightColor    (char,a[1],time); return;
			case 'intensity': this._flashlightIntensity(char,a[1],time); return;
			case 'dist'     :
			case 'distance' : this._flashlightDistance (char,a[1],time); return;
			case 'angle'    : this._flashlightAngle    (char,a[1],time); return;
			case 'yaw'      : this._flashlightYaw      (char,a[1],time); return;
			case 'pitch'    : this._flashlightPitch    (char,a[1],time); return;
		}
		time=this._TIME(a[4]);
		this._flashlightColor(char,a[0],time);
		this._flashlightIntensity(char,a[1],time);
		this._flashlightDistance(char,a[2],time);
		this._flashlightAngle(char,a[3],time);
	}
	_flashlightColor(char,color,time){ char.blendFlashlightColor.setValue(makeColor(color).toNumber(),time); }
	_flashlightIntensity(char,n,time){ this._RELATIVE_BLEND(char.blendFlashlightIntensity,n,time); }
	_flashlightDistance(char,n,time){ this._RELATIVE_BLEND(char.blendFlashlightDistance,n,time); }
	_flashlightAngle(char,n,time){ this._RELATIVE_BLEND(char.blendFlashlightAngle,n,time); }
	_flashlightPitch(char,n,time){ this._RELATIVE_BLEND(char.blendFlashlightPitch,n,time); }
	_flashlightYaw(char,yaw,time){ char.flashlightTargetYaw=yaw; }
	async elevation(...a){
		const char = await this.AWAIT_CHAR(this.CHAR);
		let time=this._TIME(a[1]);
		this._RELATIVE_BLEND(char.blendElevation,a[0],time);
	}
	disable(fadeType){ mv3d.disable(fadeType); }
	enable(fadeType){ mv3d.enable(fadeType); }
	_RELATIVE_BLEND(blender,n,time){ blender.setValue(relativeNumber(blender.targetValue(),n),Number(time)); }
	_TIME(time){
		if(typeof time==='number'){ return time; }
		time=Number(time);
		if(Number.isNaN(time)){ return 1; }
		return time;
	}
	ERROR_CHAR(){
		console.warn(`MV3D: Plugin command \`${this.FULL_COMMAND}\` failed because target character was invalid.`);
		//console.log(this.CHAR);
	}
	async AWAIT_CHAR(char){
		if(!char){ return this.ERROR_CHAR(); }
		let w=0;
		while(!char.mv3d_sprite){
			await sleep(100);
			if(++w>10){ return this.ERROR_CHAR(); }
		}
		return char.mv3d_sprite;
	}
	TARGET_CHAR(target){
		return mv3d.targetChar(target,$gameMap.event(this.INTERPRETER._eventId),this.CHAR);
	}
};

mv3d.targetChar=function(target,self=null,dfault=null){
	if(!target){ return dfault; }
	let m=target.toLowerCase().match(/[a-z]+/);
	const mode=m?m[0]:'e';
	m=target.match(/\d+/);
	const id=m?Number(m[0]):0;
	switch(mode[0]){
		case 's': return self;
		case 'p': return $gamePlayer;
		case 'e':
			if(!id){ return self; }
			return $gameMap.event(id);
		case 'v':
			return $gameMap.vehicle(id);
		case 'f':
			return $gamePlayer.followers()._data[id];
	}
	return char;
}
mv3d.getTargetString=function(char){
	if( char instanceof Game_Player){
		return `@p`;
	}
	if( char instanceof Game_Event ){
		return `@e${char._eventId}`;
	}
	if( char instanceof Game_Follower){
		return `@f${$gamePlayer._followers._data.indexOf(char)}`;
	}
	if( char instanceof Game_Vehicle){
		return `@v${$gameMap._vehicles.indexOf(char)}`;
	}
}