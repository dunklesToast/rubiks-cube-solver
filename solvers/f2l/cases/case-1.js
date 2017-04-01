const RubiksCube = require('../../../models/RubiksCube')
const BaseSolver = require('./BaseSolver')
const utils = require('../../../utils')

const R = (moves) => RubiksCube.reverseMoves(moves)

/**
 * Top level case 1:
 * Both corner and edge are on the DOWN face.
 */
class Case1Solver extends BaseSolver {
  /**
   * 10 Cases:
   * 1) Pair is matched.
   * 2) Pair is separated.
   *
   * ---- Group 1: Corner's white color is on DOWN face ----
   * 3) Corner and edge share a face and colors on that face are equal.
   * 4) Corner and edge share a face and colors on that face are not equal.
   * 5) Corner and edge do not share a face.
   *
   * ---- Group 2: Corner's "other" color matches edge's "primary" color ----
   * 6) Corner shares a face with edge.
   * 7) Corner does not share a face with edge.
   *
   * ---- Group 3: Corner's "other" color doesn't match edge's "primary" color ----
   * 8) Edge shares a face with corner's cross color's face.
   * 9) Edge shares a face with corner's other color's face.
   * 10) Corner does not share a face with edge.
   *
   * TODO: refactor
   */
  _getCaseNumber({ corner, edge }) {
    if (this.isPairMatched({ corner, edge })) {
      return 1
    }
    if (this.isPairSeparated({ corner, edge })) {
      return 2
    }

    let sharedFace
    edge.faces().forEach(face => {
      if (corner.faces().includes(face) && face !== 'DOWN') {
        sharedFace = face
      }
    })
    let otherColor = corner.colors().find(color => {
      return color !== 'U' && color !== corner.getColorOfFace('DOWN')
    })
    let primaryColor = edge.colors().find(c => edge.getFaceOfColor(c) !== 'DOWN')

    // Group 1
    if (corner.getFaceOfColor('U') === 'DOWN') {
      if (sharedFace) {
        if (corner.getColorOfFace(sharedFace) === edge.getColorOfFace(sharedFace)) {
          return 3
        } else {
          return 4
        }
      } else {
        return 5
      }
    }

    // Group 2
    if (otherColor === primaryColor) {
      if (sharedFace) {
        return 6
      } else {
        return 7
      }
    }

    // Group 3
    if (sharedFace) {
      if (sharedFace === corner.getFaceOfColor('U')) {
        return 8
      } else {
        return 9
      }
    } else {
      return 10
    }
  }

  _solveCase1({ corner, edge }) {
    return this.solveMatchedPair({ corner, edge })
  }

  _solveCase2({ corner, edge }) {
    return this.solveSeparatedPair({ corner, edge })
  }

  _solveCase3({ corner, edge }) {
    // calculate which side the corner is on, the position, etc.
    let currentFace = edge.faces().find(face => face !== 'DOWN')
    let targetFace = utils.getFaceOfMove(edge.getColorOfFace('DOWN'))
    let prepFace = utils.getFaceFromDirection(targetFace, 'BACK', { UP: 'DOWN'})
    let otherFace = corner.getFaceOfColor(edge.getColorOfFace(currentFace))
    let isLeft = utils.getFaceFromDirection(currentFace, otherFace, { UP: 'DOWN' }) === 'LEFT'

    // the moves
    let prep = utils.getRotationFromTo('DOWN', currentFace, prepFace)
    let moveFace = utils.getMoveOfFace(otherFace)
    let dir = isLeft ? 'D' : 'DPrime'

    moveFace = isLeft ? moveFace : R(moveFace)

    let solveMoves = `${prep} ${moveFace} ${moveFace} D D `
    solveMoves += `${moveFace} ${dir} ${R(moveFace)} ${dir} ${moveFace} ${moveFace}`
    this.move(solveMoves)
  }

  _solveCase4({ corner, edge }) {
    // calculate which side the corner is on, the position, etc.
    let currentFace = edge.faces().find(face => face !== 'DOWN')
    let targetFace = utils.getFaceOfMove(edge.getColorOfFace(currentFace))
    let otherFace = corner.faces().find(face => !edge.faces().includes(face))
    let isLeft = utils.getFaceFromDirection(otherFace, currentFace, { UP: 'DOWN' }) === 'LEFT'

    // the moves
    let prep = utils.getRotationFromTo('DOWN', currentFace, targetFace)
    let moveFace = utils.getMoveOfFace(targetFace)
    moveFace = isLeft ? R(moveFace) : moveFace

    this.move(`${prep} ${moveFace} D D ${R(moveFace)}`)
    this.solveSeparatedPair({ corner, edge })
  }

  _solveCase5({ corner, edge }) {
    let primary = edge.colors().find(color => edge.getFaceOfColor(color) !== 'DOWN')
    let secondary = edge.colors().find(color => edge.getFaceOfColor(color) === 'DOWN')

    let isLeft = utils.getFaceFromDirection(
      utils.getFaceOfMove(primary),
      utils.getFaceOfMove(secondary),
      { UP: 'DOWN' }
    ) === 'RIGHT'

    let edgeCurrent = edge.getFaceOfColor(primary)
    let edgeTarget = utils.getFaceOfMove(primary)

    // do the prep move now. need to calculate things after this move is done
    let edgePrep = utils.getRotationFromTo('DOWN', edgeCurrent, edgeTarget)
    this.move(edgePrep)

    // calculate corner stuff
    let cornerCurrent = corner.getFaceOfColor(primary)
    let cornerTarget = edgeTarget

    // the moves
    let cornerPrep = utils.getRotationFromTo('DOWN', cornerCurrent, cornerTarget)
    let open = isLeft ? R(edgeTarget) : edgeTarget

    this.move(`${open} ${cornerPrep} ${R(open)}`)
    this.solveMatchedPair({ corner, edge })
  }

  _solveCase6({ corner, edge }) {
    let primary = edge.colors().find(color => edge.getFaceOfColor(color) !== 'DOWN')

    let currentFace = edge.getFaceOfColor(primary)
    let targetFace = utils.getFaceOfMove(edge.getColorOfFace('DOWN'))
    let isLeft = utils.getDirectionFromFaces(
      currentFace,
      corner.getFaceOfColor(primary),
      { UP: 'DOWN' }
    ) === 'LEFT'

    let prep = utils.getRotationFromTo('DOWN', currentFace, targetFace)
    let moveFace = isLeft ? targetFace : R(targetFace)
    let dir = isLeft ? 'DPrime' : 'D'

    this.move(`${prep} ${moveFace} ${dir} ${R(moveFace)}`)
    this.solveSeparatedPair({ corner, edge})
  }

  _solveCase7({ corner, edge }) {
    let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'DOWN')
    let cornerCurrent = corner.getFaceOfColor('U')
    let cornerTarget = utils.getFaceOfMove(primary)
    let isLeft = utils.getDirectionFromFaces(
      corner.getFaceOfColor(primary),
      corner.getFaceOfColor('U'),
      { UP: 'DOWN' }
    ) === 'LEFT'

    let cornerPrep = utils.getRotationFromTo('DOWN', cornerCurrent, cornerTarget)
    this.move(cornerPrep)

    let edgeCurrent = edge.getFaceOfColor(primary)
    let edgeTarget = corner.getFaceOfColor(primary)

    let open = isLeft ? corner.getFaceOfColor('U') : R(corner.getFaceOfColor('U'))
    let edgeMatch = utils.getRotationFromTo('DOWN', edgeCurrent, edgeTarget)
    this.move(`${open} ${edgeMatch} ${R(open)}`)

    this.solveMatchedPair({ corner, edge })
  }

  _solveCase8({ corner, edge }) {
    let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'DOWN')
    let currentFace = corner.getFaceOfColor(
      edge.colors().find(c => !['U', primary].includes(c))
    )
    let targetFace = utils.getFaceOfMove(primary)
    let isLeft = utils.getDirectionFromFaces(
      currentFace,
      corner.getFaceOfColor('U'),
      { UP: 'DOWN' }
    )

    let prep = utils.getRotationFromTo('DOWN', currentFace, targetFace)
    let open = isLeft ? R(targetFace) : targetFace
    let dir = isLeft ? 'D' : 'DPrime'

    this.move(`${prep} ${open} ${dir} ${R(open)}`)
    this.solveSeparatedPair({ corner, edge })
  }

  _solveCase9({ corner, edge }) {
    let otherColor = edge.colors().find(c => edge.getFaceOfColor(c) === 'DOWN')
    let currentFace = corner.getFaceOfColor('U')
    let targetFace = utils.getFaceOfMove(otherColor)

    let isLeft = utils.getDirectionFromFaces(
      corner.getFaceOfColor(otherColor),
      currentFace,
      { UP: 'DOWN' }
    ) === 'LEFT'

    let prep = utils.getRotationFromTo('DOWN', currentFace, targetFace)
    let moveFace = isLeft ? targetFace : R(targetFace)

    this.move(`${prep} ${moveFace} D D ${R(moveFace)}`)
    this.solveSeparatedPair({ corner, edge })
  }

  _solveCase10({ corner, edge }) {
    let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'DOWN')
    let secondary = edge.colors().find(c => edge.getFaceOfColor(c) === 'DOWN')
    let cornerCurrent = corner.getFaceOfColor('U')
    let cornerTarget = utils.getFaceOfMove(secondary)
    let isLeft = utils.getDirectionFromFaces(
      corner.getFaceOfColor(secondary),
      corner.getFaceOfColor('U'),
      { UP: 'DOWN' }
    ) === 'LEFT'

    let cornerPrep = utils.getRotationFromTo('DOWN', cornerCurrent, cornerTarget)
    this.move(cornerPrep)

    let edgeCurrent = edge.getFaceOfColor(primary)
    let edgeTarget = utils.getFaceOfMove(primary)

    let open = isLeft ? cornerTarget : R(cornerTarget)
    let edgePrep = utils.getRotationFromTo('DOWN', edgeCurrent, edgeTarget)

    this.move(`${open} ${edgePrep} ${R(open)}`)
    this.solveSeparatedPair({ corner, edge })
  }
}

module.exports = Case1Solver