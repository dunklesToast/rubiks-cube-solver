const Vector = require('./Vector');
const Face = require('./Face');

class Cubie {
  /**
   * Factory method. Returns an instance of a cubie identified by the faces it
   * sits on.
   * @param {array} faces - A list of all the faces this cubie sits on.
   */
	static FromFaces(faces) {
		let position = new Vector([0, 0, 0]);
		let colorMap = {};

		for (let face of faces) {
			if (!face) {
				continue;
			}

			let temp = new Face(face);
			let axis = temp.vector.getAxis().toUpperCase();
			position[`set${axis}`](temp.vector.getMagnitude());

			colorMap[face] = temp.toString()[0].toUpperCase();
		}

		return new Cubie({ position: position.toArray(), colorMap });
	}

  /**
   * @param {object} [options]
   * @param {object} options.position - The cubie's position.
   * @param {object} options.colorMap - A map with faces as keys and colors
   * as values. For example: { 'FRONT' : 'F' }.
   */
	constructor({ position, colorMap }) {
		this.position(position);
		this.colorMap = colorMap || {};
	}

  /**
   * @return {Cubie}
   */
	clone() {
		return new Cubie({
			position: this.position(),
			colorMap: this.colorMap
		});
	}

  /**
   * Getter/setter for the vector position.
   * @param {array} [position] - The new position to store.
   * @return {array}
   */
	position(position) {
		if (typeof position === 'undefined') {
			return this.vector ? this.vector.toArray() : this.vector;
		}

		this.vector = new Vector(position);
	}

  /**
   * @return {number}
   */
	getX() {
		return this.vector.getX();
	}

  /**
   * @return {number}
   */
	getY() {
		return this.vector.getY();
	}

  /**
   * @return {number}
   */
	getZ() {
		return this.vector.getZ();
	}

  /**
   * @return {boolean}
   */
	isCorner() {
		return Object.keys(this.colorMap).length === 3;
	}

  /**
   * @return {boolean}
   */
	isEdge() {
		return Object.keys(this.colorMap).length === 2;
	}

  /**
   * @return {boolean}
   */
	isMiddle() {
		return Object.keys(this.colorMap).length === 1;
	}

  /**
   * @return {array}
   */
	colors() {
		return Object.keys(this.colorMap).map(face => this.colorMap[face]);
	}

  /**
   * @param {string} color - Check if the cubie has this color.
   * @return {boolean}
   */
	hasColor(color) {
		for (let face of Object.keys(this.colorMap)) {
			if (this.colorMap[face] === color) {
				return true;
			}
		}

		return false;
	}

  /**
   * Sets a color on a given face or normal of a cubie.
   * @param {string} face - The face of the cubie we want to set the color on.
   * @param {string} color - The color we want to set.
   * @return {Cubie}
   */
	colorFace(face, color) {
		this.colorMap[face] = color;
		return this;
	}

  /**
   * @param {string} face - The color on the face this cubie sits on.
   * @return {string}
   */
	getColorOfFace(face) {
		return this.colorMap[face];
	}

  /**
   * @param {string} color - Find the face that this color sits on.
   * @return {string}
   */
	getFaceOfColor(color) {
		return Object.keys(this.colorMap).find(cubieColor => {
			return this.colorMap[cubieColor] === color;
		});
	}

  /**
   * Return all the faces this cubie sits on.
   * @return {array}
   */
	faces() {
		return Object.keys(this.colorMap);
	}

  /**
   * Rotates the position vector around `axis` by `angle`. Updates the internal
   * position vector and the normal-color map.
   * @param {string} axis - The axis of rotation.
   * @param {number} angle - The magnitude of rotation.
   * @return {null}
   */
	rotate(axis, angle) {
    // update position vector after rotation
		this.vector.rotate(axis, angle);

    // update normal-color map
		let newMap = {}; // need to completely overwrite the old one

    // go through each normal, rotate it, and assign the new normal the old color
		for (let face of Object.keys(this.colorMap)) {
			face = new Face(face);
			let color = this.colorMap[face];

			let newNormal = face.rotate(axis, angle).normal().join(' ');
			newMap[Face.FromNormal(newNormal)] = color;
		}

		this.colorMap = newMap;
	}
}

module.exports = Cubie;
