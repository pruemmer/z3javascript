/**
 * Copyright Blake Loring <blake_l@parsed.uk> 2015
 */

import Z3 from "./Z3Loader";
import Z3Utils from "./Z3Utils";
import Expr from "./Expr";

class Context {

	constructor() {
		this.fs = require("fs");
		this.store_increment = 1;
		let config = Z3.Z3_mk_config();
        
		Z3.Z3_set_param_value(config, "model", "true");

		this.ctx = Z3.Z3_mk_context_rc(config);
		Z3.Z3_del_config(config);

        
		const { spawn } = require("child_process");
		this.ostrich = spawn("/home/henrik/UU/bachelor/ostrich/ostrich", ["+stdin", "+incremental"], {
			stdio: [
				"pipe",
				0,
				0
			]
		});
        
		this.ostrich.on("close", (code) => {
			console.log("what happened?");
			console.log("Error code: " + code);
		});
	}
    
	writeToOstrich(string) {
		console.log("\n\n Writing to ostrich\n @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		console.log(string);
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		if (this.ostrich.stdin.write(string + "\n") == false) {
			console.log("ostrich.stdin overflow, nothing was written");
		}

	}


	store(thingy) {
		this.fs.writeFileSync("./context_output3.txt", this.store_increment + ". " + thingy + "\n",{flag: "a"});
		return thingy;
	}

	_nullExpr() {
		return new Expr(this, null);
	}

	_appendList(list, l2) {
		return l2 ? list.concat(l2) : list;
	}

	/**
     * TODO: is not recursive on array
     */
	_buildChecks(args) {
		return args.filter(next => next.checks).reduce((last, next) => this._appendList(last, next.checks), []);
	}

	_build(func, ...args) {
		return this._buildConst.apply(this, [func, this._buildChecks(args, false)].concat(Z3Utils.astArray(args)));
	}

	_buildConst(func, checks, ...args) {
		let fnResult = func.apply(this, [this.ctx].concat(args));
		return new Expr(this, fnResult, checks);
	}

	_buildVar(func, ...args) {
		return this._buildVarNoArgs(func, args);
	}

	_buildVarNoArgs(func, args) {
		return new Expr(this, func(this.ctx, args.length, Z3Utils.astArray(args)), this._buildChecks(args, false));
	}

	destroy() {
		return this._build(Z3.Z3_del_context);
	}

	incRef(e) {
		"Z3.Z3_inc_ref";
		Z3.Z3_inc_ref(this.ctx, e.ast);
	}

	decRef(e) {
		"Z3.Z3_dec_ref";
		Z3.Z3_dec_ref(this.ctx, e.ast);
	}

	mkApp(func, args) {
		var res = this._build(Z3.Z3_mk_app, func, args.length, args);
		console.log("mkApp");
		this.writeToOstrich(res.toString());
		return res;
	}

	mkArray(name, baseSort) {
		let arraySort = this.mkArraySort(this.mkIntSort(), baseSort);
		let arrayInstance = this.mkVar(name, arraySort);
		let arrayLen = this.mkIntVar(name + "_Array_Length");
		return arrayInstance.setLength(arrayLen);
	}

	mkObject(name, baseSort) {
		let objectSort = this.mkArraySort(this.mkStringSort(), baseSort);
		let objectInstance = this.mkVar(name, objectSort);
		return objectInstance;
	}

	mkGetSort(e) {
		return Z3.Z3_get_sort(this.ctx, e.ast);
	}

	mkSortName(sort) {
		return Z3.Z3_get_sort_name(this.ctx, sort);
	}

	mkSymbolString(s) {
		return Z3.Z3_get_symbol_string(this.ctx, s);
	}

	mkVar(name, sort) {
		var res = this._build(Z3.Z3_mk_const, this.mkStringSymbol(name), sort);
		this.writeToOstrich(res.toString());
		console.log("mkVar");
		return res;
	}

	mkIntVar(name) {
		return this.mkVar(name, this.mkIntSort());
	}

	mkRealVar(name) {
		return this.mkVar(name, this.mkRealSort());
	}

	mkBoolVar(name) {
		return this.mkVar(name, this.mkBoolSort());
	}

	mkString(val) {
		var res = this._buildConst(Z3.Z3_mk_string, [], val);
		var str = res.toString();
		str = str.slice(1, str.length);
		this.writeToOstrich(str.slice(0, str.length - 1));
		console.log("mkString");
		return res;
	}

	mkStringVar(name) {
		return this.mkVar(name, this.mkStringSort());
	}

	mkIntVal(val) {
		return this.mkInt(val, this.mkIntSort());
	}

	mkUnsignedIntVal(val) {
		return this.mkUnsignedInt(val, this.mkIntSort());
	}

	mkSeqLength(val) {
		var res = this._build(Z3.Z3_mk_seq_length, val);
		this.writeToOstrich(res.toString());
		console.log("mkSeqLength");
		return res;
	}
    
	mkSeqAt(val, off) {
		var res = this._build(Z3.Z3_mk_seq_at, val, off);
		this.writeToOstrich(res.toString());
		console.log("mkSeqAt");
		return res;
	}
   
	mkSeqContains(val1, val2) {
		var res = this._build(Z3.Z3_mk_seq_contains, val1, val2);
		this.writeToOstrich(res.toString());
		console.log("mkSeqContains");
		return res;
	}
    
	mkSeqConcat(strings) {
		var res = this._buildVarNoArgs(Z3.Z3_mk_seq_concat, strings);
		this.writeToOstrich(res.toString());
		console.log("mkSeqConcat");
		return res;
	}
    
	mkSeqSubstr(str, offset, length) {
        
		if (!length) {
			length = this._nullExpr();
		}

		var res = this._build(Z3.Z3_mk_seq_extract, str, offset, length);
		this.writeToOstrich(res.toString());
		console.log("mkSeqSubstr");
		return res;
	}
    
	mkSeqIndexOf(str, str2, off) {
		var res = this._build(Z3.Z3_mk_seq_index, str, str2, off);
		this.writeToOstrich(res.toString());
		console.log("mkSeqIndexOf");
		return res;
	}

	mkStrToInt(str) {
		var res = this._build(Z3.Z3_mk_str_to_int, str);
		this.writeToOstrich(res.toString());
		console.log("mkStrToInt");
		return res;
	}

	mkIntToStr(num) {
		var res = this._build(Z3.Z3_mk_int_to_str, num);
		this.writeToOstrich(res.toString());
		console.log("mkIntToStr");
		return res;
	}

	mkSeqInRe(seq, re) {
		var res = this._build(Z3.Z3_mk_seq_in_re, seq, re);
		this.writeToOstrich(res.toString());
		console.log("mkSeqInRe");
		return res;
	}

	mkReConcat(re1, re2) {
		var res = this._buildVar(Z3.Z3_mk_re_concat, re1, re2);
		this.writeToOstrich(res.toString());
		console.log("mkReConcat");
		return res;
	}

	mkReEmpty() {
		var res = this._build(Z3.Z3_mk_re_empty, this.mkReSort(this.mkStringSort()));
		this.writeToOstrich(res.toString());
		console.log("mkReEmpty");
		return res;
	}

	mkReFull() {
		var res = this._build(Z3.Z3_mk_re_full, this.mkStringSort());
		this.writeToOstrich(res.toString());
		console.log("mkReFull");
		return res;
	}

	mkReOption(re) {
		var res = this._build(Z3.Z3_mk_re_option, re);
		this.writeToOstrich(res.toString());
		console.log("mkReOption");
		return res;
	}

	mkReStar(re) {
		var res = this._build(Z3.Z3_mk_re_star, re);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReUnion(re1, re2) {
		var res = this._buildVar(Z3.Z3_mk_re_union, re1, re2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReIntersect(re1, re2) {
		var res = this._buildVar(Z3.Z3_mk_re_intersect, re1, re2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReComplement(re) {
		var res = this._build(Z3.Z3_mk_re_complement, re);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkRePlus(re) {
		var res = this._build(Z3.Z3_mk_re_plus, re);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReRange(ch1, ch2) {
		var res = this._build(Z3.Z3_mk_re_range, ch1, ch2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReLoop(re, lo, hi) {
		var res = this._build(Z3.Z3_mk_re_loop, re, lo, hi);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkSeqToRe(seq) {
		var res = this._build(Z3.Z3_mk_seq_to_re, seq);
		this.writeToOstrich(res.toString());
		return res;
	}

	isString(ast) {
		var res = this.build(Z3.Z3_is_string, ast) === Z3.TRUE;
		this.writeToOstrich(res.toString());
		return res;
	}

	mkBoolSort() {
		return Z3.Z3_mk_bool_sort(this.ctx);
	}

	mkStringSort() {
		return Z3.Z3_mk_string_sort(this.ctx);
	}

	mkIntSort() {
		return Z3.Z3_mk_int_sort(this.ctx);
	}

	mkSeqSort(sort) {
		return Z3.Z3_mk_seq_sort(this.ctx, sort);
	}

	mkReSort(sort) {
		return Z3.Z3_mk_re_sort(this.ctx, sort);
	}

	mkIntSymbol(val) {
		return Z3.Z3_mk_int_symbol(this.ctx, val);
	}

	mkStringSymbol(val) {
		return Z3.Z3_mk_string_symbol(this.ctx, val);
	}

	mkConst(symb, sort) {
		var res = this._build(Z3.Z3_mk_const, symb, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkFunc(name, args, sort) {
		var res = this._build(Z3.Z3_mk_func_decl, name, args.length, args, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkRecFunc(name, args, sort) {
		var res = this._build(Z3.Z3_mk_rec_func_decl, name, args.length, args, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkRecFuncDef(fn, args, body) {
		var res = this._build(Z3.Z3_add_rec_func_decl, fn, args.length, args, body);
		this.writeToOstrich(res.toString());
		return res;
	}

	/**
     * Propositional logic and equality
     */

	mkTrue() {
		var res = this._build(Z3.Z3_mk_true);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkFalse() {
		var res = this._build(Z3.Z3_mk_false);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkEq(left, right) {
		var res = this._build(Z3.Z3_mk_eq, left, right);
		this.writeToOstrich(res.toString());
		return res;
	} 

	//missing: distinct

	mkNot(arg) {
		var res = this._build(Z3.Z3_mk_not, arg);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkIte(ifarg, thenarg, elsearg) {
		var res = this._build(Z3.Z3_mk_ite, ifarg, thenarg, elsearg);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkIff(left, right) {
		var res = this._build(Z3.Z3_mk_iff, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkImplies(left, right) {
		var res = this._build(Z3.Z3_mk_implies, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkXOr(left, right) {
		var res = this._build(Z3.Z3_mk_xor, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkAnd(left, right) {
		var res = this._buildVar(Z3.Z3_mk_and, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkAndList(conditions) {
		var res = this._buildVarNoArgs(Z3.Z3_mk_and, conditions);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkOr(left, right) {
		var res = this._buildVar(Z3.Z3_mk_or, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	/**
     * Arithmetic: Integers and Reals
     */

	mkRealSort() {
		return Z3.Z3_mk_real_sort(this.ctx);
	}

	mkDoubleSort() {
		return Z3.Z3_mk_fpa_sort_64(this.ctx);
	}

	mkAdd(left, right) {
		var res = this._buildVar(Z3.Z3_mk_add, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkMul(left, right) {
		var res = this._buildVar(Z3.Z3_mk_mul, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkSub(left, right) {
		var res = this._buildVar(Z3.Z3_mk_sub, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkUnaryMinus(arg) {
		var res = this._build(Z3.Z3_mk_unary_minus, arg);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkDiv(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_div, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkBitwiseShiftLeft(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_bvshl, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkBitwiseShiftRight(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_bvlshr, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkMod(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_mod, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkRem(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_rem, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkPower(arg1, arg2) {
		var res = this._build(Z3.Z3_mk_power, arg1, arg2);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkLt(left, right) {
		var res = this._build(Z3.Z3_mk_lt, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkLe(left, right) {
		var res = this._build(Z3.Z3_mk_le, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkGt(left, right) {
		var res = this._build(Z3.Z3_mk_gt, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkGe(left, right) {
		var res = this._build(Z3.Z3_mk_ge, left, right);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkRealToInt(real) {
		var res = this._build(Z3.Z3_mk_real2int, real);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkIntToReal(ival) {
		var res = this._build(Z3.Z3_mk_int2real, ival);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkIntToBv(ival) {
		var res = this._build(Z3.Z3_mk_int2bv, 32, ival);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkBvToInt(bval) {
		var res = this._build(Z3.Z3_mk_bv2int, bval, true);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkIsInt(arg) {
		var res = this._build(Z3.Z3_mk_is_int, arg);
		this.writeToOstrich(res.toString());
		return res;
	}

	/**
     * Numerals
     */

	mkNumeral(numeral, sort) {
		var res = this._build(Z3.Z3_mk_numeral, numeral, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkReal(num, den) {
		var res = this._build(Z3.Z3_mk_real, num, den);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkInt(v, sort) {
		var res = this._build(Z3.Z3_mk_int, v, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkUnsignedInt(v, sort) {
		var res = this._build(Z3.Z3_mk_unsigned_int, v, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkInt64(v, sort) {
		var res = this._build(Z3.Z3_mk_int64, v, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkUnsignedInt64(v, sort) {
		var res = this._build(Z3.Z3_mk_unsigned_int64, v, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkToString(e) {
		return Z3.Z3_ast_to_string(this.ctx, e.ast || e);
	}

	/**
     * Arrays
     */

	mkArraySort(indexSort, elemSort) {
		var res = this._build(Z3.Z3_mk_array_sort, indexSort, elemSort);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkSelect(array, index) {
		var res = this._build(Z3.Z3_mk_select, array, index);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkStore(array, index, v) {
		var res = this._build(Z3.Z3_mk_store, array, index, v).setLength(array.getLength());
		this.writeToOstrich(res.toStrign());
		return res;
	}

	mkConstArray(sort, v) {
		var res = this._build(Z3.Z3_mk_const_array, sort, v).setLength(this.mkIntVal(v.length));
		this.writeToOstrich(res.toString());
		return res;
	}

	/**
     * Quantifiers
     * SEE: https://stackoverflow.com/questions/9777381/c-api-for-quantifiers
     */

	/// https://z3prover.github.io/api/html/group__capi.html#gaa80db40fee2eb0124922726e1db97b43
	mkBound(index, sort) {
		var res = this._build(Z3.Z3_mk_bound, index, sort);
		this.writeToOstrich(res.toString());
		return res;
	}

	/// Weight, and patterns are optional. Bound should be an array of consts.
	mkForAllConst(bound, body, patterns = [], weight = 0) {
		var res = this._build(Z3.mkForAllConst, weight, bound.length, bound, patterns.length, patterns, body);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkForAll(decl_names, sorts, body, patterns = [], weight = 0) {
		var res = this._build(Z3.Z3_mk_forall, weight, patterns.length, patterns, decl_names.length, [sorts], decl_names, body);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkExists(decl_names, sorts, body, patterns = [], weight = 0) {
		var res = this._build(Z3.Z3_mk_exists, weight, patterns.length, patterns, decl_names.length, [sorts], decl_names, body);
		this.writeToOstrich(res.toString());
		return res;
	}

	/// Weight, and patterns are optional. Bound should be an array of consts.
	mkExistsConst(bound, body, patterns = [], weight = 0) {
		var res = this._build(Z3.Z3_mk_exists_const, weight, bound.length, bound, patterns.length, patterns, body);
		this.writeToOstrich(res.toString());
		return res;
	}

	mkPattern(terms) {
		var res = this._build(Z3.Z3_mk_pattern, terms.length, terms);
		this.writeToOstrich(res.toString());
		return res;
	}
}

export default Context;
