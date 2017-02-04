const BaseSolver = require('./BaseSolver')
const RubiksCube = require('../models/RubiksCube')
const Cubie = require('../models/Cubie')
const Face = require('../models/Face')
const utils = require('../utils')

const CROSS_COLOR = 'U'

class CrossSolver extends BaseSolver {
  solve() {
    let crossEdges = this._getCrossEdges()
    for (let edge of crossEdges) {
      this._solveEdge(edge)
    }

    return this.totalMoves.join(' ')
  }

  /**
   * Finds all edges that have 'F' as a color.
   * @return {array}
   */
  _getCrossEdges() {
    return this.cube.edges().filter(edge => edge.hasColor(CROSS_COLOR))
  }

  /**
   * @param {cubie} edge - The edge that will be solved.
   */
  _solveEdge(edge) {
    let caseNumber = this._getCaseNumber(edge)
    let solveMoves = this[`_solveCase${caseNumber}`](edge)
  }

  /**
   * 6 Cases!
   * 1) The edge's UP color is on the UP face.
   * 2) the edge's UP color is on the DOWN face.
   * 3) The edge's UP color is not on the UP or DOWN face and the other color is on the UP face.
   * 4) The edge's UP color is not on the UP or DOWN face and the other color is on the DOWN face.
   * 5) The edge's UP color is not on the UP or DOWN face and the other color is on the RELATIVE RIGHT face.
   * 6) The edge's UP color is not on the UP or DOWN face and the other color is on the RELATIVE LEFT face.
   *
   * @param {cubie} edge
   */
  _getCaseNumber(edge) {
    if (edge.getColorOfFace('UP') === CROSS_COLOR) {
      return 1
    } else if (edge.getColorOfFace('DOWN') === CROSS_COLOR) {
      return 2
    }

    if (edge.faces().includes('UP')) {
      return 3
    } else if (edge.faces().includes('DOWN')) {
      return 4
    }

    let crossFace = edge.getFaceOfColor(CROSS_COLOR)
    let otherFace = edge.getFaceOfColor(edge.colors().find(color => color !== CROSS_COLOR))
    let direction = utils.getFaceDirection(crossFace, otherFace, { UP: 'UP' })

    if (direction === 'RIGHT') {
      return 5
    } else if (direction === 'LEFT') {
      return 6
    }
  }

  _solveCase1(edge) {
    return this._case1And2Helper(edge, 1)
  }

  _solveCase2(edge) {
    return this._case1And2Helper(edge, 2)
  }

  _solveCase3(edge) {
    return this._case3And4Helper(edge, 3)
  }

  _solveCase4(edge) {
    return this._case3And4Helper(edge, 4)
  }

  _solveCase5(edge) {
    let otherColor = edge.colors().find(color => color !== 'U')
    let currentFace = edge.getFaceOfColor(otherColor)
    let targetFace = utils.getFaceOfMove(otherColor)

    let prepMove = utils.getRotationFromTo('UP', currentFace, targetFace)
    let edgeToCrossFace = utils.getMoveOfFace(currentFace)
    let solveMoves = `${RubiksCube.reverseMoves(prepMove)} ${edgeToCrossFace} ${prepMove}`

    return solveMoves
  }

  _case1And2Helper(edge, caseNum) {
    let crossColorFace = caseNum === 1 ? 'UP' : 'DOWN'
    let currentFace = edge.faces().find(face => face !== crossColorFace)
    let targetFace = utils.getFaceOfMove(edge.getColorOfFace(currentFace))

    let solveMoves = utils.getRotationFromTo(crossColorFace, currentFace, targetFace)

    if (caseNum === 2) {
      let edgeToCrossFace = utils.getMoveOfFace(targetFace)
      solveMoves += ` ${edgeToCrossFace} ${edgeToCrossFace}`
    }

    return solveMoves
  }

  _case3And4Helper(edge, caseNum) {
    let face = edge.faces().find(face => face !== 'UP')
    let prepMove = utils.getMoveOfFace(face)
    let solveMoves = this._solveCase5(edge)

    if (caseNum === 4) {
      prepMove += 'Prime'
    }
    return `${prepMove} ${solveMoves}`
  }

  testAll() {
    this.testCaseNums()

    let numCases = 6
    for (let i = 1; i <= numCases; i++) {
      this[`testCase${i}`] && this[`testCase${i}`]()
    }
  }

  testCaseNums() {
    let tests = [
      { face1: 'UP', face2: 'FRONT', expect: 1 },
      { face1: 'DOWN', face2: 'FRONT', expect: 2 },
      { face1: 'RIGHT', face2: 'UP', expect: 3 },
      { face1: 'RIGHT', face2: 'DOWN', expect: 4 },
      { face1: 'RIGHT', face2: 'BACK', expect: 5 },
      { face1: 'RIGHT', face2: 'FRONT', expect: 6 }
    ]

    console.log(`--- TESTING Case Numbers ---`)

    tests.forEach(({ face1, face2, expect }) => {
      let edge = Cubie.FromFaces([face1, face2]).colorFace(face1, 'U').colorFace(face2, 'R')
      let result = this._getCaseNumber(edge) === expect

      if (result) {
        console.log(`test SUCCESS`)
      } else {
        console.log(`test FAILED --> expected: "${test.expect}" --> got: "${result}"`)
      }
    })

    console.log()
  }

  testCase1() {
    let tests = [
      { currentFace: 'FRONT', color: 'F' },
      { currentFace: 'FRONT', color: 'L' },
      { currentFace: 'FRONT', color: 'R' },
      { currentFace: 'FRONT', color: 'B' },
      { currentFace: 'RIGHT', color: 'L' },
      { currentFace: 'RIGHT', color: 'F' },
      { currentFace: 'LEFT', color: 'B' },
      { currentFace: 'BACK', color: 'L' }
    ]

    this._test('Case1', tests, ({ currentFace, color }) => {
      let edge = Cubie.FromFaces(['UP', currentFace]).colorFace('UP', 'U').colorFace(currentFace, color)
      let solveMoves = this._solveCase1(edge)
      return { edge, solveMoves }
    })
  }

  testCase2() {
    let tests = [
      { currentFace: 'FRONT', color: 'F' },
      { currentFace: 'FRONT', color: 'L' },
      { currentFace: 'FRONT', color: 'R' },
      { currentFace: 'FRONT', color: 'B' },
      { currentFace: 'RIGHT', color: 'L' },
      { currentFace: 'RIGHT', color: 'F' },
      { currentFace: 'LEFT', color: 'B' },
      { currentFace: 'BACK', color: 'L' }
    ]

    this._test('Case2', tests, ({ currentFace, color }) => {
      let edge = Cubie.FromFaces(['DOWN', currentFace]).colorFace('DOWN', 'U').colorFace(currentFace, color)
      let solveMoves = this._solveCase2(edge)
      return { edge, solveMoves }
    })
  }

  testCase5() {
    let tests = [
      { face1: 'LEFT', face2: 'FRONT', color: 'R' },
      { face1: 'LEFT', face2: 'FRONT', color: 'L' },
      { face1: 'BACK', face2: 'LEFT', color: 'R' },
      { face1: 'BACK', face2: 'LEFT', color: 'L' },
      { face1: 'RIGHT', face2: 'BACK', color: 'R' },
      { face1: 'RIGHT', face2: 'BACK', color: 'F' },
      { face1: 'FRONT', face2: 'RIGHT', color: 'R' },
      { face1: 'FRONT', face2: 'RIGHT', color: 'F' }
    ]

    this._test('Case5', tests, ({ face1, face2, color }) => {
      let edge = Cubie.FromFaces([face1, face2]).colorFace(face1, 'U').colorFace(face2, color)
      let solveMoves = this._solveCase5(edge)
      return { edge, solveMoves }
    })
  }

  /**
   * @param {string} testName - The name of the test.
   * @param {array} tests - The list of tests to run.
   * @param {function} runTest - The callback to run for each test.
   * @return {null}
   */
  _test(testName, tests, runTest) {
    console.log(`--- TESTING ${testName} ---`)
    for (let test of tests) {
      let { edge, solveMoves } = runTest(test)

      let fakeCube = RubiksCube.Solved()
      fakeCube._cubies.push(edge)
      fakeCube.move(solveMoves)

      let otherColor = edge.colors().find(color => color !== 'U')
      let otherFace = edge.faces().find(face => face !== 'UP')
      const isMatchingMiddle = otherFace[0] === otherColor
      const isOnCrossFace = edge.getColorOfFace('UP') === 'U'

      if (isOnCrossFace && isMatchingMiddle) {
        console.log(`test SUCCESS`)
      } else {
        console.log('FAIL: ', edge._normalToColor)
      }
    }
    console.log()
  }
}

module.exports = CrossSolver
