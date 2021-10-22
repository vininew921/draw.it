class Word {
    constructor() {
        this.actual = null;
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

    randomizeWord() {
        let number = Math.floor(Math.random() * this.list.length);
        this.actual = this.list[number];
        this.list.splice(number, 1);
    }
}