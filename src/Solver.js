/**
 * Copyright Blake Loring <blake_l@parsed.uk> 2015
 */

import Z3 from "./Z3Loader";
import Model from "./Model";

const useZ3 = false;


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
		if (this.ostrich.stdin.write(string + "\n") == false) {
			console.log("ostrich.stdin overflow, nothing was written");
		}

	}
    
	destroy() {
		Z3.Z3_solver_dec_ref(this.context.ctx, this.slv);
		this.writeToOstrich("(exit)");
		console.log("Exit");
	}

	reset() {
		Z3.Z3_solver_reset(this.context.ctx, this.slv);
		this.writeToOstrich("(reset)");
		console.log("Reset");
	}

	push() {
		Z3.Z3_solver_push(this.context.ctx, this.slv);	
		this.writeToOstrich("(push 1)");
		console.log("Push");
	}

	pop() {
		Z3.Z3_solver_pop(this.context.ctx, this.slv, 1);
		this.writeToOstrich("(pop 1)");
		console.log("Pop");
	}

    

	check() {
		if (useZ3) {
			return Z3.Z3_solver_check(this.context.ctx, this.slv) === Z3.TRUE;
		} else {
			this.writeToOstrich("(check-sat)");

			//			if (this.ostrich.stdout.readable) {
			//			    var data = this.ostrich.stdout.read();
			//			    if (data != null) {
			//			        console.log(data.length + " characters have been read from ostrich.stdout");
			//			    } else {
			//				    console.log("stdout.read failed");
			//			    }
			//
			//			    var error = this.ostrich.stderr.read();
			//			    if (error != null) {
			//			        console.log(error.length + " characters have been read from ostrich.stderr");
			//			    } else {
			//				    console.log("stderr.read failed");
			//			    }
			//			} else {
			//				console.log("ostrich.stdout is broken");
			//			}
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
				return new Model(this.context, Z3.Z3_solver_get_model(this.context.ctx, this.slv));
			}
		} else {
			if (this.check()) {
				console.log("What.");
			}
		}
		return null;
	}

	assert(expr) {
		Z3.Z3_solver_assert(this.context.ctx, this.slv, expr.ast);
		this.writeToOstrich("(assert " + expr.toString() + ")");
		console.log("Added assertion");
	}

	toString() {
		return "Solver {\n" + Z3.Z3_solver_to_string(this.context.ctx, this.slv) + "}";
	}
}

export default Solver;
