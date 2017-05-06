const BaseSolver = require('../BaseSolver');
const utils = require('../../utils');

const SOLVED_STATE = '0 0 0 0 0 0 0 0';

class PLLSolver extends BaseSolver {
  constructor(...args) {
    super(...args);
    this.phase = 'pll';

    this.algorithms = {
			[SOLVED_STATE]: '', // already solved
      '2 -1 1 -1 1 0 0 2': 'R R F F RPrime BPrime R F F RPrime B RPrime', // #1
      '-1 1 -1 2 2 0 0 1': 'R BPrime R F F RPrime B R F F R R', // #2
      '1 -1 2 2 0 0 1 -1': 'R UPrime R U R U R UPrime RPrime UPrime R R', // #3
      '-1 1 -1 1 0 0 2 2': 'R R U R U RPrime UPrime RPrime UPrime RPrime U RPrime', // #4
      '2 2 2 2 2 2 2 2': 'M M U M M U U M M U M M', // #5
      '0 1 1 1 1 0 2 2': 'R U RPrime UPrime RPrime F R R UPrime RPrime UPrime R U RPrime FPrime', // #6
      '1 0 2 0 1 0 0 0': 'R U U RPrime UPrime R U U LPrime U RPrime UPrime L', // #7
      '0 2 2 0 1 1 1 1': 'F R UPrime RPrime UPrime R U RPrime FPrime R U RPrime UPrime RPrime F R FPrime', // #8
      '1 -1 -1 2 -1 -1 1 0': 'RPrime U U R U U RPrime F R U RPrime UPrime RPrime FPrime R R UPrime', // #9
      '0 1 -1 -1 2 -1 -1 1': 'R UPrime RPrime UPrime R U R D RPrime UPrime R DPrime RPrime U U RPrime UPrime', // #10
      '0 2 -1 -1 -1 -1 2 0': 'RPrime U RPrime UPrime BPrime D BPrime DPrime B B RPrime BPrime R B R', // #11
      '2 -1 -1 -1 -1 2 0 0': 'RPrime UPrime FPrime R U RPrime UPrime RPrime F R R UPrime RPrime UPrime R U RPrime U R', // #12
      '-1 2 2 2 -1 2 0 2': 'L U LPrime B B uPrime B UPrime BPrime U BPrime u B B', // #13
      '2 -1 2 0 2 -1 2 2': 'RPrime UPrime R B B u BPrime U B UPrime B uPrime B B', // #14
      '2 -1 1 1 0 1 1 -1': 'R R uPrime R UPrime R U RPrime u R R B UPrime BPrime', // #15
      '1 0 1 1 -1 2 -1 1': 'R R u RPrime U RPrime UPrime R uPrime R R FPrime U F', // #16
      '1 -1 -1 1 1 -1 -1 1': 'U RPrime UPrime R UPrime R U R UPrime RPrime U R U R R UPrime RPrime U', // #17
      '0 1 0 0 0 1 0 2': 'LPrime U U L U LPrime U U R UPrime L U RPrime', // #18
      '1 1 -1 -1 1 1 -1 -1': 'R BPrime RPrime F R B RPrime FPrime R B RPrime F R BPrime RPrime FPrime', // #19
      '2 0 2 0 2 0 2 0': 'R U RPrime U R U RPrime FPrime R U RPrime UPrime RPrime F R R UPrime RPrime U U R UPrime RPrime', // #20
      '0 2 0 2 0 2 0 2': 'RPrime U R UPrime RPrime FPrime UPrime F R U RPrime F RPrime FPrime R UPrime R', // #21
    };
  }

  solve() {
    return this._solve();
  }

  _getCaseNumber() {
    return this.getPllString();
  }

  _solveCase(pllString) {
    let pattern = this.findPattern(pllString);
    let algorithm = this.getAlgorithm(pattern);
		let frontFace = this._getFrontFace(pllString, pattern);

    this.move(algorithm, {
			orientation: { up: 'down', front: frontFace }
		});

		// may need an extra rotation of DOWN for a complete solve
		let cubie = this.cube.getCubie(['down', 'front']); // any cubie on DOWN
		let origin = 'front';
		let target = utils.getFaceOfMove(cubie.getColorOfFace(origin));
		let lastLayerMove = utils.getRotationFromTo('down', origin, target);

		this.move(lastLayerMove);
  }

  isSolved() {
		return this.cube.isSolved();
  }

	/**
	 * Permutations are unique in the way that each cubie is permutated relative
	 * to the one adjacent to it. For each cubie (in order), find the relative
	 * direction from its color to the next cubie's color, and turn it into a
	 * number. This will allow each permutation to be held in a unique string.
	 */
  getPllString() {
		let pllString = [];
    let pllCubies = this._getPllCubies();

		let faces = ['front', 'left', 'back', 'right']; // we're upside down

		for (let i = 0; i < pllCubies.length; i++) {
			let cubie1 = pllCubies[i];
			let cubie2 = pllCubies[i + 1];
			let faceToCheck = faces[~~(i / 2)];

			// get the colors of the two cubies
			let color1 = cubie1.getColorOfFace(faceToCheck);

			// wrap around to the first cubie
			if (!cubie2) {
				cubie2 = pllCubies[0];
			}
			let color2 = cubie2.getColorOfFace(faceToCheck);

			// find the direction between the two
			let face1 = utils.getFaceOfMove(color1);
			let face2 = utils.getFaceOfMove(color2);

			// turn it into a number
			let direction = utils.getDirectionFromFaces(face1, face2, { up: 'down' });
			if (direction === 'front') direction = 0;
			if (direction === 'right') direction = 1;
			if (direction === 'left') direction = -1;
			if (direction === 'back') direction = 2;

			pllString.push(direction);
		}

    return pllString.join(' ');
  }

  findPattern(pllString) {
		let initialString = pllString;

    if (typeof pllString === 'undefined') {
      pllString = this.getPllString();
    }

    for (let i = 0; i < 4; i++) {
			let algorithm = this.algorithms[pllString];

			if (typeof algorithm === 'string') {
				return pllString;
			} else {
				pllString = this._rotatePllStringLeft(pllString);
			}
		}

		throw new Error(`No pattern found for pll string "${initialString}"`);
  }

  getAlgorithm(pattern) {
    if (typeof pattern === 'undefined') {
			pattern = this.findPattern(pattern); // pattern can be a pllString
		}

    if (typeof this.algorithms[pattern] === 'undefined') {
			throw new Error(`No algorithm found for pattern "${pattern}"`);
		}

		return this.algorithms[pattern];
  }

  _getPllCubies() {
    let positions = [
			['front', 'down', 'right'],
			['front', 'down'],
			['front', 'down', 'left'],
			['left', 'down'],
			['left', 'down', 'back'],
			['back', 'down'],
			['back', 'down', 'right'],
			['right', 'down']
		];

		return positions.map(pos => this.cube.getCubie(pos));
  }

  _getCubiePermutation(cubie) {
    // pick a face, any face (expect for the down face)
    let face = cubie.faces().find(face => face !== 'down');

    // get the cube face this face lies on
    let cubeFace = utils.getFaceOfMove(cubie.getColorOfFace(face));

    // find the move that will permute the cubie correctly
    let moveToSolveCubie = utils.getRotationFromTo('down', face, cubeFace);
    moveToSolveCubie = moveToSolveCubie.toLowerCase();

    // translate the move to a number
    let dir;
    if (moveToSolveCubie === '') dir = 0;
    else if (moveToSolveCubie.includes('prime')) dir = 1;
    else if (moveToSolveCubie.split(' ').length > 1) dir = 2;
    else dir = -1;

    return dir;
  }

  _rotatePllStringLeft(pllString) {
		let arr = pllString.split(' ').map(num => parseInt(num));
		return [...arr.slice(2), ...arr.slice(0, 2)].join(' ');
  }

  _getFrontFace(pllString, pattern) {
    let rotationOrder = ['front', 'left', 'back', 'right'];

		for (let i = 0; i < 4; i++) {
			if (pllString === pattern) {
				return rotationOrder[i];
			} else {
				pllString = this._rotatePllStringLeft(pllString);
			}
		}

		throw new Error(`OLL string "${pllString}" does not resolve to the pattern "${pattern}"`);
  }
}

module.exports = PLLSolver;
