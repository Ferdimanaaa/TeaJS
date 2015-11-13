var Argv = (function(){
	function Argv(argv, opt, desc_text, root_file){
		this.___desc = {};
		this.pathdata = {};
		this.length = 0;
		if (arguments.length){
			this.parse(argv, opt, desc_text, root_file);
		}
	}
	Argv.prototype.parse = function (argv, opt, desc_text, root_file){
		if (desc_text){
			var re = /^[\ \t]*(\-(?:\-[\w\-]+)?\w)\,?\ *(\-\-[\w\-]+)?\ *(\<[^\>]+\>)?\s*(.*)$/mg,
				m,
				_opt = [];
			while (m = re.exec(desc_text)){
				_opt.push([m[1], m[2], m[3], m[4]]);
			}
			if (_opt.length){
				opt = opt ? opt.concat(_opt) : _opt;
			}
			this.___desc._help_ = desc_text;
		}
		if (opt && opt.length){
			for (var i=0, o; i < opt.length; i++){
				o = opt[i];
				if (o.length > 2 && o[0] && o[1] && o[0][0] == '-' && o[1][0] == '-'){
					this.add(o[0], o[1], o[3] || o[2] || '');
				}
			}
		}
		var basename = Path.basename(root_file || __filename), b, _i = 0;
		if (/node$/.test(argv[_i])){
			_i++;
		}
		if (argv[_i].indexOf(basename) != -1){
			_i++;
		}
		for (var i=_i, a; i < argv.length; i++){
			a = argv[i];
			if (a[0] == '-'){
				b = argv[i+1];
				if (!b || b[0] == '-'){
					b = true;
				}else {
					i += 1;
				}
				this[a] = b;
			}else if (!this['--file']){
				this['--file'] = a;
			}else {
				this[this.length++] = a;
			}
		}
		return this.check();
	}
	Argv.prototype.check = function (){
		this.pathdata = Path.countPath(this['--file'], this['--path'], this['--out']);
		return this;
	}
	Argv.prototype.__defineGetter__("file", function(){
		return this.pathdata.file;
	});
	Argv.prototype.__defineGetter__("dir", function(){
		return this.pathdata.dir;
	});
	Argv.prototype.__defineGetter__("path", function(){
		return this.pathdata.path;
	});
	Argv.prototype.__defineGetter__("outdir", function(){
		return this.pathdata.outdir;
	});
	Argv.prototype.__defineGetter__("out", function(){
		if (this.pathdata.out){
			return this.pathdata.out;
		}
		if (/\.tea$/.test(this.pathdata.file)){
			return this.pathdata.file.replace(/\.tea$/, '.js');
		}
	});
	Argv.prototype.__defineSetter__("file", function(file){
		this.pathdata = Path.countPath(file, this.pathdata.path, this.pathdata.outdir);
		return this.pathdata.file;
	});
	Argv.prototype.__defineSetter__("out", function(out){
		this.pathdata = Path.countPath(this.pathdata.file, this.pathdata.path, out);
		return this.pathdata.out;
	});
	Argv.prototype.add = function (short, long, desc, fn){
		if (short.substr(0, 2) == '--'){
			desc = long, long = short, short = null;
		}
		var name = long.replace(/^-+/, '');
		if (desc){
			this.___desc[short] = desc;
			this.___desc[long] = desc;
		}
		if (short && long && short != long){
			var self = this;
			this.__defineGetter__(short, function(){
				return self[long];
			});
			this.__defineSetter__(short, function(v){
				return self[long] = v;
			});
		}
	}
	Argv.prototype.showDesc = function (com){
		return this.___desc[com];
	}
	Argv.prototype.showHelp = function (){
		print(this.___desc._help_);
	}
	Argv.prototype.copy = function (extend){
		var argv = new Argv();
		var i_ref = this;
		for (var i in i_ref){
			if (!i_ref.hasOwnProperty(i)) continue;
			if (this[i] == null || i[0] == '_' && i[1] == '_'){
				continue;
			}
			argv[i] = this[i];
		}
		if (extend){
			for (var i in extend){
				if (!extend.hasOwnProperty(i)) continue;
				argv[i] = extend[i];
			}
		}
		argv.parent = argv.parent || argv;
		return argv;
	}
	return Argv;
})();
module.exports = Argv;