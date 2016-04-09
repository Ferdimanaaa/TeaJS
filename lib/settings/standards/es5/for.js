module.exports = function(node, param){
	if (!node[1]){
		return rewriteForRange.call(this, node, param);
	}
	switch (node[1].isToken && node[1].text){
		case 'of':case 'in':
			return rewriteForIn.call(this, node, param);
		case '->':case '=>':case '<=':case '<-':
			return rewriteForEach.call(this, node, param);
		case '...':
			return rewriteForRange.call(this, node, param);
		default:
			if (node[0].is('VarPatt', 'LetPatt')){
				return "var @0; @1; @2";
			}
			break;
	}
	return "@0; @1; @2";
};
function rewriteForIn(node, param){
	var vars, state;
	vars = this.handle.variables;
	vars.i = node[0][0];
	vars.temp = node[0][1];
	if (!vars.temp && node[1].text == 'of'){
		vars.temp = vars.i;
		vars.i = this.pattern('#VAR(for_let, i)', node);
	}else {
		if (state = node.scope.state(vars.i.text)){
			this.pattern('#VAR(for_let, i, @)', vars.i);
		}else {
			node.scope.define('let', vars.i);
		}
	}
	if (vars.temp){
		node.scope.define('let', vars.temp);
	}
	return "var @i in #VALUE(@[2], ref)"+"#HEAD( `if (!@ref.hasOwnProperty(@i)) continue`, Let )"+(vars.temp ? "#HEAD( `var @temp = @ref[@i]`, Let )" : "");
};
function rewriteForEach(node, param){
	var vars, scope, mark, i, def, text, state, init, patt;
	vars = this.handle.variables;
	scope = node.scope;
	mark = node[1].text;
	if (node[0][1]){
		i = node[0][0];
		vars.temp = node[0][1];
	}else if (mark == '<=' || mark == '=>'){
		vars.temp = node[0][0];
	}else {
		i = node[0][0];
	}
	if (i){
		if (i.type == 'AssignExpr'){
			def = '@[0.0.2]';
			i = i[0];
		}
		text = i.text;
		state = scope.state(text);
		if (!state || node[0].type != 'InitPatt'){
			scope.define('for_let', i);
			vars['i'] = text;
		}else {
			if (!def && state != 'for_let'){
				def = text;
			}
			this.pattern('#VAR(for_let, i, @)', i);
		}
	}else {
		this.pattern('#VAR(for_let, i)', node);
	}
	init = [];
	if (node[2].is('Access')){
		vars.ref = node[2];
	}else {
		init.push('@ref = #VALUE(@[2])');
	}
	if (vars.temp){
		init.push('@temp');
		scope.define('let', vars.temp);
	}
	if (mark == '=>' || mark == '->'){
		init.push('@i = '+(def || '0'));
		patt = 'var '+init.join(', ')+'; @i < @ref.length; @i++';
	}else {
		init.push('@i = '+(def || '@ref.length - 1'));
		patt = 'var '+init.join(', ')+'; @i >= 0; @i--';
	}
	if (vars.temp){
		patt += "#HEAD( `@temp = @ref[@i]`, Let )";
	}
	return patt;
};
function rewriteForRange(node, param){
	var vars;
	if (node[1]){
		vars = this.handle.variables;
		vars.left = node[0];
		vars.right = node[2];
		if (vars.left.type == 'NUMBER' || vars.right.type == 'NUMBER'){
			return "var @i = @right; @i >= @left; @i--";
		}
		return "var @i = @left; @i <= @right; @i++";
	}
	node = node[0][0];
	if (node.type == 'NUMBER'){
		return "var @i = 0; @i < @; @i++";
	}
	if (node.is('Variable')){
		return "var @i = 0; @i < @.length; @i++";
	}
	if (node.is('Value')){
		return "var @i = 0, @ref = @; @i < @ref.length; @i++";
	}
	return "var @i = 0, @ref = (@); @i < @ref.length; @i++";
};