// TODO: Remove this unused class
class Word {
  constructor() {
    this.actual = undefined;
    this.list = [
      'Astronauta',
      'Leite',
      'Pescador',
      'Livro',
      'Melancia',
      'Escola',
      'Macaco',
      'Palma',
      'Margarida',
      'Cérebro',
      'Lagarto',
      'Saco',
      'Saia',
      'Violão',
      'Cometa',
      'Hamburger',
      'Giz',
      'Rosa',
      'Alface',
      'Vendedor',
      'Tambor',
      'Pente',
      'Tempestade',
      'Salto',
      'Ouro',
      'Meia',
    ];
  }

  /**
   * Returns a random index between min (inclusive) and max (exclusive).
   *
   * @param {number} min the minimum index value
   * @param {number} max the maximum index value
   * @returns the random index
   */
  randomIndex(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Setter
   * Sets a new random word.
   */
  randomizeWord() {
    const number = this.randomIndex(0, this.list.length);
    this.actual = this.list.pop(number);
  }
}

// ! this next line won't work on the client side
module.exports = Word;
