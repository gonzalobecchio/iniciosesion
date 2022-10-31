const randoms = 500
function getRandomArbitrary(min, max) {
    return  Math.floor(Math.random() * (max - min) + min);
}

function getListado(cant) {
    const numerosRandom = []
    for (let i = 0; i < randoms; i++) {
        const nRan = getRandomArbitrary(1, cant);
        numerosRandom.push(nRan)

    }

    const listado = []
    numerosRandom.forEach(elemento => {
        var x = elemento
        let repetido = 0
        numerosRandom.forEach(e => {
            if (elemento == e) {
                repetido++
            }
        })
        const obj = {
            "numero": elemento,
            "repetido": repetido
        }
        listado.push(obj)
    })


    const unicos = []

    for (var indice = 0; indice < listado.length; indice++) {

        const elemento = listado[indice];
        let esDuplicado = false;
        for (var i = 0; i < unicos.length; i++) {

            if (unicos[i].numero === elemento.numero) {
                esDuplicado = true;
                break;
            }
        }

        if (!esDuplicado) {
            unicos.push(elemento);
        }
    }

    return unicos

}

process.on('message', cant => {
    const unicos = getListado(cant)
    process.send(unicos)
    process.exit()
})
