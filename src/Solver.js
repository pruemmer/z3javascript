/**
 * Copyright Blake Loring <blake_l@parsed.uk> 2015
 */

import Z3 from "./Z3Loader";
import Model from "./Model";

const useZ3 = false;

const childProcess = require("child_process");

class Solver {

	constructor(context, incremental, options) {
		options = options || [];
		this.context = context;

		let config = Z3.Z3_mk_params(this.context.ctx); 
		Z3.Z3_params_inc_ref(this.context.ctx, config);

		options.forEach(option => {
			if (typeof(option.value) === "number") {
				Z3.Z3_params_set_uint(this.context.ctx, config, Z3.Z3_mk_string_symbol(this.context.ctx, option.name), option.value);	
			} else if (typeof(option.value) === "string") {
				Z3.Z3_params_set_symbol(this.context.ctx, config, Z3.Z3_mk_string_symbol(this.context.ctx, option.name), Z3.Z3_mk_string_symbol(this.context.ctx, option.value));
			}
		});

		if (incremental) {
			this.slv = Z3.Z3_mk_simple_solver(this.context.ctx);
		} else {
			let defaultTactic = Z3.Z3_mk_tactic(this.context.ctx, "default");
			Z3.Z3_tactic_inc_ref(this.context.ctx, defaultTactic);
			this.slv = Z3.Z3_mk_solver_from_tactic(this.context.ctx, defaultTactic);
		}
        
		Z3.Z3_solver_inc_ref(this.context.ctx, this.slv);
		Z3.Z3_solver_set_params(this.context.ctx, this.slv, config);

		// Move this to context
	}

    
	destroy() {
		Z3.Z3_solver_dec_ref(this.context.ctx, this.slv);
		if (useZ3 == false) {
			this.context.writeToOstrich("(exit)");
		}
	}

	exitOstrich() {
		this.context.writeToOstrich("(exit)");
	}

	waitForExit() {
        
	}

	reset() {
		Z3.Z3_solver_reset(this.context.ctx, this.slv);
		if (useZ3 == false) {
			this.context.writeToOstrich("(reset)");
		}
	}

	push() {
		Z3.Z3_solver_push(this.context.ctx, this.slv);
		if (useZ3 == false) {
			this.context.writeToOstrich("(push 1)");
		}
	}

	pop() {
		Z3.Z3_solver_pop(this.context.ctx, this.slv, 1);
		if (useZ3 == false) {
			this.context.writeToOstrich("(pop 1)");
		}
	}

	ostrichAnswer() {
		var res = childProcess.spawnSync("./piper2");
		var str = res.stdout.toString();
		console.log(str);
//		this.context.fs.closeSync(this.context.fs.openSync(this.context.namedPipeString, "w"));
		return str == "sat\n";
	}

	check() {
		//this.context.store(this.toString());
		if (useZ3) {
			return Z3.Z3_solver_check(this.context.ctx, this.slv) === Z3.TRUE;
		} else {
			this.context.writeToOstrich("(check-sat)");
			return this.ostrichAnswer();
		}
	}

	/**
     * Process an SMT2Lib string and assert it on slv 
     */
	fromString(str) {
		Z3.Z3_solver_from_string(this.context.ctx, this.slv, str);
	}

	getModel() {
		if (useZ3) {
			if (this.check()) {
				var x = new Model(this.context, Z3.Z3_solver_get_model(this.context.ctx, this.slv));
				console.log(x.toString());
				return x;
			}
		} else {
			if (this.check()) {
				console.log("What.");
//				this.context.writeToOstrich("(get-model)");
				//this.ostrichAnswer();
			}
		}
		return null;
	}

	assert(expr) {
		Z3.Z3_solver_assert(this.context.ctx, this.slv, expr.ast);
		if (useZ3 == false) {
			this.context.writeToOstrich("(assert " + expr.toString() + ")");
		}
	}

	toString() {
		return "Solver {\n" + Z3.Z3_solver_to_string(this.context.ctx, this.slv) + "}";
	}
}

export default Solver;
