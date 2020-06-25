/**
 * Copyright Blake Loring <blake_l@parsed.uk>
 */
class Query {
	constructor(exprs, checks) {
		this.exprs = exprs;
		this.checks = checks;
		this.fs = require("fs");
	}

	store(string) {
		this.fs.writeFileSync("./query_output3.txt", string + "\n",{flag: "a"});
		return string;
	}

    
	getModel(solver) {
		//this.store(solver.toString());
		return Query.process(solver, [this]);
	}
}

Query.MAX_REFINEMENTS = -1;
Query.TOTAL = 0;
Query.LAST_ATTEMPTS = 0;

Query.canAttempt = function(currentAttempts) {
	return Query.MAX_REFINEMENTS == -1 || (currentAttempts < Query.MAX_REFINEMENTS);
};

Query.process = function(solver, alternatives) {
	let attempts = 0;
	let model = null;

	while (Query.canAttempt(attempts) && alternatives.length) {
		attempts++;
		Query.TOTAL++;

		let next = alternatives.splice(Math.floor(Math.random() * alternatives.length), 1)[0];

		solver.push();

		next.exprs.forEach(clause => solver.assert(clause));
		model = solver.getModel();

		solver.pop();

		if (model) {
			//Run all the checks and concat any alternatives
			const all_checks = next.checks.map(check => check(next, model)).filter(x => !!x);
			alternatives = all_checks.reduce((alt, next) => alt.concat(next.alternatives), alternatives);

			//Find any failing check
			const failed_check = all_checks.find(check => !check.isSAT);
			
			//If we have found a satisfying model return it otherwise add alternatives from check
			if (failed_check) {
				model.destroy();
				model = null;
			} else {
				break;
			}
		}
	}

	Query.LAST_ATTEMPTS = attempts;
	return model;
};

export default Query;
