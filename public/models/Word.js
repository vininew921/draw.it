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
            'Meia'
        ];
    }
    randomIndex(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomizeWord() {
        let number = this.randomIndex(0,this.list.length);
        this.actual = this.list.pop(number)
    }
}
module.exports = Word;