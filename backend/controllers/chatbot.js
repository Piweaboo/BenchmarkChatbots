const dff = require('dialogflow-fulfillment');
const { response, request } = require('express');
const VGBBDD = require('../models/VGSales');

const respuestaDFChatbot = async(req, res) => {
    //console.log('Ha entrado a respuestaChatbot');
    //console.log('req en el metodo: ', req.body);

    const agent = new dff.WebhookClient({
        request: req,
        response: res
    });

    //Intent de prueba
    function callBackend(agent) {
        agent.add('envio response desde el webhook');
    }

    //Devuelve una tarjeta con el videojuego más vendido el año pasado por parámetro
    async function getVGPerYear(agent) {

        try {
            agent.add('Sure!');
            //Obtenemos el año
            let fecha = agent.parameters['date-period']['startDate'];
            let splited = fecha.split('-');
            let anyo = splited[0];
            const vg = await VGBBDD.findOne({ Year: anyo }); //Importante las mayúsculas, que coincidan con el Model
            if (vg != null) {
                agent.add('Showing the best selling game of ' + anyo + ': ' + vg.Name);
                img_url = "https://www.vgchartz.com/" + vg.img_url;
                //Gestionamos la consola
                let consola = getConsola(vg.Platform);


                const payload = {

                    "richContent": [
                        [{
                                "type": "image",
                                "rawUrl": img_url,
                                "accessibilityText": vg.Name + "-cover"
                            },
                            {
                                "type": "description",
                                "title": vg.Name,
                                "text": [
                                    "Genre: " + vg.Genre,
                                    "Global Sales: " + vg.Global_Sales,
                                    "Rating: " + vg.ESRB_Rating,
                                    "Score: " + vg.Critic_Score,
                                    "Platform: " + consola,
                                    "Release: " + vg.Year
                                ]
                            },
                            {
                                "type": "button",
                                "icon": {
                                    "type": "explore",
                                    "color": "#FF9800"
                                },
                                "text": "Go to page",
                                "link": vg.url

                            }
                        ]
                    ]

                };
                agent.add(new dff.Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true }));
            } else {
                agent.add("Oops, I can't find the best selling game of that year. Try with another one");
            }

        } catch (error) {
            console.log(error);
        }

    }

    //Recibimos como parámetros una consola y devolveremos una lista de juegos más vendidos con nombre, género y ventas
    async function getVGsPerPlatform(agent) {
        try {
            agent.add('kowabunga');
            let consola = agent.parameters['nombre-consola'];
            const vg = await VGBBDD.find({ Platform: consola }).limit(6);
            if (vg != null) {
                let lista, boton;
                let separador = '{"type": "divider"}';

                //Recorremos todas las entradas de los juegos y construimos el mensaje
                var mensaje = [];
                for (let i = 0; i < vg.length; i++) { //"title": "' + vg[i].Name + '",
                    boton = '{"type": "button","icon": {"type": "sports_esports","color": "#FF9800"},"text": "' + vg[i].Name + '","link": "' + vg[i].url + '"}';
                    lista = '{"type": "list","subtitle": "Genre: ' + vg[i].Genre + '. Global Sales: ' + vg[i].Global_Sales + '"}';
                    mensaje[i] = boton + ',' + lista + ',' + separador;
                    if (i != vg.length - 1) { //No pones la , final
                        mensaje[i] = mensaje[i] + ',';
                    }

                }

                let payload = '{"richContent": [[';
                for (let i = 0; i < mensaje.length; i++) {
                    payload = payload + mensaje[i];
                }
                payload = payload + ']]}';

                agent.add(new dff.Payload(agent.UNSPECIFIED, JSON.parse(payload), { rawPayload: true, sendAsMessage: true }));
            } else {
                agent.add("Oops there's been an error with the search. Please try again.");
            }

        } catch (error) {
            console.log(error);
        }
    }

    //Recibimos como parámetros un año y un género y devolvemos una lista de juegos
    async function getVGsPerGenreAndYear(agent) {
        try {
            agent.add('wowoowwowo');
            //Primero obtenemos parámetros de género y año
            let fecha = agent.parameters['date-period']['startDate'];
            let splited = fecha.split('-');
            let anyo = splited[0];
            let genero = agent.parameters['nombre-genero'];

            const vg = await VGBBDD.find({ Genre: genero, Year: anyo }).limit(6);
            if (vg != null) {
                //Recorremos todas las entradas de los juegos y construimos el mensaje
                var mensaje = [];

                for (let i = 0; i < vg.length; i++) {
                    let img_url = "https://www.vgchartz.com/" + vg[i].img_url;
                    let consola = getConsola(vg[i].Platform);

                    let prueba = '{"type": "info","title": "' + vg[i].Name + '","subtitle": "Platform: ' + consola + '. Global sales: ' + vg[i].Global_Sales + '.","image": {"src": {"rawUrl": "' + img_url + '"}},"actionLink": "' + vg[i].url + '"}';
                    mensaje[i] = prueba;
                    if (i != vg.length - 1) { //No pones la , final
                        mensaje[i] = mensaje[i] + ',';
                    }
                }

                let payload = '{"richContent": [[';
                for (let i = 0; i < mensaje.length; i++) {
                    payload = payload + mensaje[i];
                }
                payload = payload + ']]}';

                agent.add(new dff.Payload(agent.UNSPECIFIED, JSON.parse(payload), { rawPayload: true, sendAsMessage: true }));
            } else {
                agent.add("Oops there's been an error with the search. Please try again.");
            }

        } catch (error) {
            console.log('error: ', error);
        }

    }

    //Recibimos 3 parámetros, uno de ellos opcional: año, compañía (y número). Hacemos una búsqueda con ellos
    async function getVGsPerCompanyAndYear(agent) {
        try {
            agent.add('beban awita');
            let fecha = agent.parameters['date-period']['startDate'];
            let splited = fecha.split('-');
            let anyo = splited[0];
            let compania = agent.parameters['nombre-compania'];
            let vg;
            let numero = 0;
            if (agent.parameters['number']) {
                numero = agent.parameters['number'];
            }

            if (numero != 0) {
                vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: anyo }).limit(numero);
                //console.log('vg: ', vg);
            } else {
                vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: anyo }).limit(5);
            }

            if (vg.length > 0) {
                //Recorremos todas las entradas de los juegos y construimos el mensaje
                var mensaje = [];

                for (let i = 0; i < vg.length; i++) {
                    let img_url = "https://www.vgchartz.com/" + vg[i].img_url;
                    let consola = getConsola(vg[i].Platform);

                    let prueba = '{"type": "info","title": "' + vg[i].Name + '","subtitle": "Platform: ' + consola + '. Genre: ' + vg[i].Genre + '. Global sales: ' + vg[i].Global_Sales + '.","image": {"src": {"rawUrl": "' + img_url + '"}},"actionLink": "' + vg[i].url + '"}';
                    mensaje[i] = prueba;
                    if (i != vg.length - 1) { //No pones la , final
                        mensaje[i] = mensaje[i] + ',';
                    }
                }
                let payload = '{"richContent": [[';
                for (let i = 0; i < mensaje.length; i++) {
                    payload = payload + mensaje[i];
                }
                payload = payload + ']]}';

                agent.add(new dff.Payload(agent.UNSPECIFIED, JSON.parse(payload), { rawPayload: true, sendAsMessage: true }));

            } else {
                agent.add("Oops there's been an error with the search. Please try again.");
            }

        } catch (error) {
            console.log('error: ', error);
        }
    }

    //Recibimos un nombre y sacamos una tarjeta con info
    async function getVGPerName(agent) {
        try {
            let nombre = agent.parameters['any'];
            vg = await VGBBDD.findOne({ Name: { $regex: nombre, $options: 'i' } });
            //console.log('vg: ', vg);
            if (vg != null) {
                img_url = "https://www.vgchartz.com/" + vg.img_url;
                //Gestionamos la consola
                let consola = getConsola(vg.Platform);


                const payload = {

                    "richContent": [
                        [{
                                "type": "image",
                                "rawUrl": img_url,
                                "accessibilityText": vg.Name + "-cover"
                            },
                            {
                                "type": "description",
                                "title": vg.Name,
                                "text": [
                                    "Genre: " + vg.Genre,
                                    "Global Sales: " + vg.Global_Sales,
                                    "Rating: " + vg.ESRB_Rating,
                                    "Score: " + vg.Critic_Score,
                                    "Platform: " + consola,
                                    "Release: " + vg.Year
                                ]
                            },
                            {
                                "type": "button",
                                "icon": {
                                    "type": "explore",
                                    "color": "#FF9800"
                                },
                                "text": "Go to page",
                                "link": vg.url

                            }
                        ]
                    ]

                };
                agent.add(new dff.Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true }));

            } else {
                agent.add("Oops there's been an error with the search. Please try again.");
            }

        } catch (error) {
            console.log('error: ', error);
        }
    }

    //Te devuleve el año donde más ventas hubo. Tiene filtros opcionales de compañía y consola.
    async function getYearWithMostSales(agent) {
        let consola, compania, vg;
        if (agent.parameters['nombre-consola']) {
            consola = agent.parameters['nombre-consola'];
        }
        if (agent.parameters['nombre-compania']) {
            compania = agent.parameters['nombre-compania'];
        }

        let mayores_ventas = 0;
        let ventas_anyo = "";

        //Vale, y si hacemos un for que haga el filtro por año, desde 1980 hasta 2022, 
        //y va haciendo sumatorio del 'Total shipped' o el 'global sales', el que esté con datos.
        //Guardar el valor en una variable y sobrescribirlo
        for (let i = 1980; i <= 2022; i++) {

            //Hacemos la consulta
            if (consola != null) { //Hay valor de "consola"
                vg = await VGBBDD.find({ Platform: consola, Year: i });
            } else if (compania != null) { //Hay valor de compañía
                vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: i });
            } else { //Query normal
                vg = await VGBBDD.find({ Year: i });
            }

            //Dntro del for, vg[j] es cada uno de los juegos. Hacer el sumatorio
            //Vamos a coger y sumar todas las ventas del año
            let ventas = 0;
            if (vg.length > 0) {
                for (let j = 0; j < vg.length; j++) {
                    let ventas_float = Math.round(parseFloat(vg[j].Total_Shipped));
                    if (!isNaN(ventas_float)) {
                        ventas += ventas_float;
                    }
                }
                console.log('Ventas del año ', i, ': ', ventas);
                console.log('mayores_ventas: ', mayores_ventas);
                //Ahora que tengo las ventas (y el año), vamos a compararlo con el que está guardado como mayor número de ventas
                if (ventas > mayores_ventas) {
                    mayores_ventas = ventas
                    ventas_anyo = i;
                }
            } else {
                //agent.add("Oops there's been an error with the search. Please try again.");
            }
        }
        console.log('The year with the highest sales of video games was ', ventas_anyo, ' with ', mayores_ventas, 'million copies distributed');
        if (agent.parameters['nombre-consola']) {
            agent.add('The year with the highest sales of video games for ' + consola + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed');
        } else if (agent.parameters['nombre-compania']) {
            agent.add('The year with the highest sales of video games for ' + compania + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed');
        } else {
            agent.add('The year with the highest sales of video games was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed');
        }
    }


    let intentMap = new Map();
    intentMap.set('conexionBackend', callBackend); //Este es de prueba
    intentMap.set('BestSellingVGPerYear', getVGPerYear);
    intentMap.set('GamesPerPlatform', getVGsPerPlatform);
    intentMap.set('GamesPerGenreAndYear', getVGsPerGenreAndYear);
    intentMap.set('GamesPerCompanyAndYear', getVGsPerCompanyAndYear);
    intentMap.set('GamesPerName', getVGPerName);
    intentMap.set('SalesByYear', getYearWithMostSales);

    agent.handleRequest(intentMap);


    /*
        
    try {
        pResponse = {
            fulfillmentText: 'refacherito Backend',
            fulfillmentMessages: [{
                text: {
                    text: ['Hola, estoy hablando desde el backend']
                },
            }],
        };

        res.setHeader('Content-Type', 'application/json');
        var out = JSON.stringify(pResponse);
        res.send(out);

    } catch (error) {
        console.log('error: ', error);
    }

    */


    /*
    res.json({
        ok: true,
        msg: 'respuestaChatbot'
    });*/
}

const respuestaMBFChatbot = async(req, res) => {
    const intent = req.header('intent');
    console.log('He entrado en respuesta MBF');
    var params;
    //console.log('req.header: ', req.header);
    //console.log('Que hay en req?: ', req);

    switch (intent) {
        case 'pruebaBackend':
            console.log('entra en pruebaBackend');
            break;

        case 'BestSellingVGPerYear':
            console.log('Entra en BestSellingVGPerYear');
            //Obtenemos los parámetros de búsqueda y los parseamos
            params = JSON.parse(req.header('params'));
            //Llamamos a una función aparte, y le pasamos los parámetros
            //Devuelve una tarjeta con el videojuego más vendido el año pasado por parámetro
            var payload = await getVGPerYear(params);
            break;

        case 'GamesPerPlatform':
            console.log('Entra en GamesPerPlatform');
            params = JSON.parse(req.header('params'));
            var payload = await GamesPerPlatform(params);

            break;

        case 'GamesPerGenreAndYear':
            console.log('Entra en GamesPerGenreAndYear');
            params = JSON.parse(req.header('params'));
            var payload = await GamesPerGenreAndYear(params);
            break;

        case 'GamesPerCompanyAndYear':
            console.log('Entra en GamesPerCompanyAndYear');
            params = JSON.parse(req.header('params'));
            var payload = await GamesPerCompanyAndYear(params);
            break;

        case 'SalesByYear':
            console.log('Entra en SalesByYear');
            params = JSON.parse(req.header('params'));
            var payload = await SalesByYear(params);
            break;

        case 'GamesPerName':
            console.log('Entra en GamesPerName');
            params = JSON.parse(req.header('params'));
            var payload = await GamesPerName(params);
            break;

        default:
            console.log('Hewwo oWo algo sawio mal :x');
            break;
    }

    res.json({
        payload,
        ok: true,
        code: 200,
        msg: 'respuestaMBFChatbot',
        intent
    });
}

const respuestaLEXChatbot = async(req, res) => {
    console.log('He entrado en respuesta LEX');
    //console.log('request: ', req.body.sessionState.intent.name);
    let intent = req.body.sessionState.intent.name;
    //console.log('sessionState: ', req.body.sessionState.intent.slots);
    var params = req.body.sessionState.intent.slots;

    switch (intent) {
        case 'ConexionLambda':
            console.log('Entra en conexión Lambda');

            var payload = {
                "sessionState": {
                    "dialogAction": {
                        "type": "Close"

                    },
                    "intent": {
                        "name": intent,
                        "state": "Fulfilled"

                    }
                },
                "messages": [{
                        "content": "Cerrando ConexionLambda",
                        "contentType": "PlainText"
                    },
                    {
                        "contentType": "ImageResponseCard",
                        "imageResponseCard": {
                            "title": "Titulo",
                            "subtitle": "Hola",

                            //No reconoce la imagen como válida
                            //"imageUrl": "https://www.vgchartz.com/games/boxart/full_5208890AmericaFrontccc.jpg"
                        }
                    }, {
                        "contentType": "ImageResponseCard",
                        "imageResponseCard": {
                            "title": "Titulo2",
                            "subtitle": "Hola2",

                            //No reconoce la imagen como válida
                            //"imageUrl": "https://www.vgchartz.com/games/boxart/full_5208890AmericaFrontccc.jpg"
                        }
                    }
                ]

            };
            break;

        case 'VGPerYear': //Hecho
            console.log('Entra en VGPerYear');
            var payload = await LEXGamesPerYear(intent, params);
            break;

        case 'GamesPerPlatform': //Hecho
            console.log('Entra en GamesPerPlatform');
            var payload = await LEXGamesPerPlatform(intent, params);
            break;

        case 'GamesPerGenreAndYear':
            console.log('Entra en GamesPerGenreAndYear');
            var payload = await LEXGamesPerGenreAndYear(intent, params);
            break;

        case 'GamesPerCompanyAndYear':
            console.log('Entra en GamesPerCompanyAndYear');
            var payload = await LEXGamesPerCompanyAndYear(intent, params);
            break;

        case 'GamesPerName':
            console.log('Entra en GamesPerName');
            var payload = await LEXGamesPerName(intent, params);
            break;

        case 'SalesByYear':
            console.log('Entra en SalesByYear');
            var payload = await LEXSalesByYear(intent, params);
            break;

        default:
            console.log('Hewwo oWo algo sawio mal en Lex :x');
            break;
    }

    res.json({
        payload,
        ok: true,
        code: 200,
        msg: 'respuestaLEXChatbot'
    });
    //console.log('res: ', res);

}

/*---------------------Métodos de Amazon Lex--------------------------------------------*/

async function LEXGamesPerYear(intent, params) {
    //console.log('parametros: ', params);
    let fecha = params.Year.value.interpretedValue;
    let anyo = fecha.split('-')[0];
    console.log('año: ', anyo);

    const vg = await VGBBDD.findOne({ Year: anyo }); //Importante las mayúsculas, que coincidan con el Model
    if (vg != null) {
        let img_url = "https://www.vgchartz.com/" + vg.img_url;
        //Gestionamos la consola
        let consola = getConsola(vg.Platform);

        var payload = {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"

                },
                "intent": {
                    "name": intent,
                    "state": "Fulfilled"

                }
            },
            "messages": [{
                    "content": 'Showing the best selling game of ' + anyo + ': ' + vg.Name,
                    "contentType": "PlainText"
                },
                {
                    "contentType": "ImageResponseCard",
                    "imageResponseCard": {
                        "title": vg.Name,
                        //"imageUrl": img_url,
                        "subtitle": "Genre: " + vg.Genre + ". Global Sales: " + vg.Global_Sales + ". Rating: " + vg.ESRB_Rating + ". Score: " + vg.Critic_Score + ". Platform: " + consola + ". Release: " + vg.Year,
                    }
                }
            ]

        };
    }
    return payload;
}

async function LEXGamesPerPlatform(intent, params) {
    let consola = params.Consola.value.interpretedValue;
    //console.log('parametros: ', consola);
    const vg = await VGBBDD.find({ Platform: consola }).limit(6);
    if (vg != null) {
        var payload = {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"

                },
                "intent": {
                    "name": intent,
                    "state": "Fulfilled"

                }
            },
            "messages": [] //Metes aqui las tarjetas
        };

        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            mensaje[i] = '{"contentType": "ImageResponseCard","imageResponseCard": {"title": "' + vg[i].Name + '","subtitle": "Genre: ' + vg[i].Genre + '. Global Sales: ' + vg[i].Global_Sales + '"}}';
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.messages = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.messages = payload.messages + mensaje[i];
        }
        payload.messages += ']';
        payload.messages = JSON.parse(payload.messages);
    }
    return payload;
}

async function LEXGamesPerGenreAndYear(intent, params) {
    //console.log('parametros: ', params);
    let genero = params.Genero.value.interpretedValue;
    let fecha = params.Anyo.value.interpretedValue;
    let anyo = fecha.split('-')[0];
    //console.log('año y genero: ', anyo, ', ', genero);

    const vg = await VGBBDD.find({ Genre: genero, Year: anyo }).limit(6);
    if (vg != null) {
        var payload = {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"

                },
                "intent": {
                    "name": intent,
                    "state": "Fulfilled"

                }
            },
            "messages": [] //Metes aqui las tarjetas
        };

        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            let consola = getConsola(vg[i].Platform);
            mensaje[i] = '{"contentType": "ImageResponseCard","imageResponseCard": {"title": "' + vg[i].Name + '","subtitle": "Genre: ' + vg[i].Genre + '.Platform: ' + consola + '. Global Sales: ' + vg[i].Global_Sales + '"}}';
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.messages = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.messages = payload.messages + mensaje[i];
        }
        payload.messages += ']';
        payload.messages = JSON.parse(payload.messages);

    }
    return payload;
}

async function LEXGamesPerCompanyAndYear(intent, params) {
    //Los parámetros son compañía, número y año
    console.log('parametros: ', params);
    let fecha = params.Anyo.value.interpretedValue;
    let anyo = fecha.split('-')[0];
    let compania = params.Compania.value.interpretedValue;
    let num = params.Numero.value.interpretedValue;
    vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: anyo }).limit(num);
    if (vg.length > 0) {
        var payload = {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"

                },
                "intent": {
                    "name": intent,
                    "state": "Fulfilled"

                }
            },
            "messages": [] //Metes aqui las tarjetas
        };

        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            let consola = getConsola(vg[i].Platform);
            mensaje[i] = '{"contentType": "ImageResponseCard","imageResponseCard": {"title": "' + vg[i].Name + '","subtitle": "Genre: ' + vg[i].Genre + '.Platform: ' + consola + '. Global Sales: ' + vg[i].Global_Sales + '"}}';
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.messages = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.messages = payload.messages + mensaje[i];
        }
        payload.messages += ']';
        payload.messages = JSON.parse(payload.messages);
    }
    return payload;
}

async function LEXSalesByYear(intent, params) {
    //Los parámetros son compañía y consola
    console.log('parametros: ', params);
    let consola, compania, vg;
    if (params.Consola) {
        consola = params.Consola.value.interpretedValue;
    }
    if (params.Compania) {
        compania = params.Compania.value.interpretedValue;
    }
    let mayores_ventas = 0;
    let ventas_anyo = "";

    for (let i = 1980; i <= 2022; i++) {
        if (consola) { //Hay valor de "consola"
            vg = await VGBBDD.find({ Platform: consola, Year: i });
        } else if (compania) { //Hay valor de compañía
            vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: i });
        } else { //Query normal
            vg = await VGBBDD.find({ Year: i });
        }

        let ventas = 0;
        if (vg.length > 0) {
            for (let j = 0; j < vg.length; j++) {
                let ventas_float = Math.round(parseFloat(vg[j].Total_Shipped));
                if (!isNaN(ventas_float)) {
                    ventas += ventas_float;
                }
            }
            console.log('Ventas del año ', i, ': ', ventas);
            console.log('mayores_ventas: ', mayores_ventas);
            if (ventas > mayores_ventas) {
                mayores_ventas = ventas
                ventas_anyo = i;
            }
        }
    }
    console.log('The year with the highest sales of video games was ', ventas_anyo, ' with ', mayores_ventas, 'million copies distributed');
    var payload = {
        "sessionState": {
            "dialogAction": {
                "type": "Close"

            },
            "intent": {
                "name": intent,
                "state": "Fulfilled"

            }
        },
        "messages": [] //Metes aqui la respuesta.
    };
    payload.messages = '['
    if (consola) {
        payload.messages += '{"content": "The year with the highest sales of video games for ' + consola + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed.","contentType": "PlainText"}';

    } else if (compania) {
        payload.messages += '{"content": "The year with the highest sales of video games for ' + compania + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed.","contentType": "PlainText"}';

    } else {
        payload.messages += '{"content": "The year with the highest sales of video games was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed.","contentType": "PlainText"}';

    }
    payload.messages += ']';
    payload.messages = JSON.parse(payload.messages);

    return payload;
}

async function LEXGamesPerName(intent, params) {
    //console.log('parametros: ', params);
    let nombre = params.NombreJuego.value.originalValue;
    vg = await VGBBDD.findOne({ Name: { $regex: nombre, $options: 'i' } });
    if (vg != null) {
        img_url = "https://www.vgchartz.com/" + vg.img_url;
        //Gestionamos la consola
        let consola = getConsola(vg.Platform);

        var payload = {
            "sessionState": {
                "dialogAction": {
                    "type": "Close"

                },
                "intent": {
                    "name": intent,
                    "state": "Fulfilled"

                }
            },
            "messages": [{
                "contentType": "ImageResponseCard",
                "imageResponseCard": {
                    //"imageUrl": img_url,
                    "title": vg.Name,
                    "subtitle": "Genre: " + vg.Genre + ". Global Sales: " + vg.Global_Sales + ". Rating: " + vg.ESRB_Rating + ". Score: " + vg.Critic_Score + ". Platform: " + consola + ". Release: " + vg.Year,
                }
            }]
        };
    }
    return payload;
}

/*----------------------Métodos de Microsoft------------------- */
//Método para hacer la query de "Obtener el jueguito más vendido de x año"
async function getVGPerYear(params) {
    //Obtenemos el año
    let anyo = parseInt(params.year);
    console.log('año: ', anyo);
    //Hacemos la query y montamos la tarjeta
    const vg = await VGBBDD.findOne({ Year: anyo }); //Importante las mayúsculas, que coincidan con el Model
    if (vg != null) {
        //console.log('vg: ', vg);
        img_url = "https://www.vgchartz.com/" + vg.img_url;
        let consola = getConsola(vg.Platform);

        //Montamos la tarjeta
        var payload = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": [{
                    "type": "Image",
                    "url": img_url,
                    "altText": vg.Name + "-cover"
                },
                {
                    "type": "Container",
                    "items": [{
                            "type": "TextBlock",
                            "text": vg.Name,
                            "wrap": true,
                            "weight": "Bolder"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Genre: " + vg.Genre,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Global Sales: " + vg.Global_Sales,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Rating: " + vg.ESRB_Rating,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Score: " + vg.Critic_Score,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Platform: " + consola,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Release: " + vg.Year,
                            "wrap": true
                        }
                    ]
                },
                {
                    "type": "Container",
                    "items": [{
                        "type": "ActionSet",
                        "actions": [{
                            "type": "Action.OpenUrl",
                            "title": "Go to page",
                            "url": vg.url
                        }]
                    }]
                }
            ]
        };
    } else {
        //Escribir un "oops no te sigo"
    }

    return payload;
}

async function GamesPerPlatform(params) {
    let consola = params.nombreConsola[0][0];

    const vg = await VGBBDD.find({ Platform: consola }).limit(6);
    //console.log('vg: ', vg);
    //Vale ahora es cuestion de meterle formato a la tarjeta. Me voy a jugar.
    if (vg != null) {
        var payload = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": []
        };
        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            let titulo = '{"type": "TextBlock","text": "' + vg[i].Name + '","wrap": true,"weight": "Bolder"}';
            let texto = '{"type": "TextBlock","text": "Genre: ' + vg[i].Genre + ' Global Sales: ' + vg[i].Global_Sales + '","wrap": true}';
            let enlace = '{"type": "ActionSet","actions": [{"type": "Action.OpenUrl","title": "Open game DB","url": "' + vg[i].url + '"}]}';

            mensaje[i] = titulo + ',' + texto + ',' + enlace;
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.body = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.body = payload.body + mensaje[i];
        }
        payload.body += ']';
        payload.body = JSON.parse(payload.body);

    }
    return payload;
}

async function GamesPerGenreAndYear(params) {
    let genero = params.nombreGenero[0][0];
    let anyo = parseInt(params.year);
    const vg = await VGBBDD.find({ Genre: genero, Year: anyo }).limit(6);
    //console.log('vg: ', vg);
    if (vg != null) {
        var payload = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": []
        };
        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            let consola = getConsola(vg[i].Platform);

            let titulo = '{"type": "TextBlock","text": "' + vg[i].Name + '","wrap": true,"weight": "Bolder"}';
            let texto = '{"type": "TextBlock","text": "Platform: ' + consola + ' Global Sales: ' + vg[i].Global_Sales + '","wrap": true}';
            let enlace = '{"type": "ActionSet","actions": [{"type": "Action.OpenUrl","title": "Open game DB","url": "' + vg[i].url + '"}]}';

            mensaje[i] = titulo + ',' + texto + ',' + enlace;
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.body = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.body = payload.body + mensaje[i];
        }
        payload.body += ']';
        payload.body = JSON.parse(payload.body);
    }
    return payload;
}

async function GamesPerCompanyAndYear(params) {
    let compania = params.nombreCompania[0][0];
    let anyo = parseInt(params.year);
    let numero = 0;
    if (params.Number) {
        numero = parseInt(params.Number);
    }
    //console.log('params', compania, anyo, numero);
    if (numero != 0) {
        vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: anyo }).limit(numero);
    } else {
        vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: anyo }).limit(5);
    }
    if (vg != null) {
        console.log('vg: ', vg);

        var payload = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": []
        };
        var mensaje = [];
        for (let i = 0; i < vg.length; i++) {
            let consola = getConsola(vg[i].Platform);

            let titulo = '{"type": "TextBlock","text": "' + vg[i].Name + '","wrap": true,"weight": "Bolder"}';
            let texto = '{"type": "TextBlock","text": "Platform: ' + consola + '. Genre: ' + vg[i].Genre + '. Global Sales: ' + vg[i].Global_Sales + '","wrap": true}';
            let enlace = '{"type": "ActionSet","actions": [{"type": "Action.OpenUrl","title": "Open game DB","url": "' + vg[i].url + '"}]}';

            mensaje[i] = titulo + ',' + texto + ',' + enlace;
            if (i != vg.length - 1) { //No pones la , final
                mensaje[i] = mensaje[i] + ',';
            }
        }

        payload.body = '[';
        for (let i = 0; i < mensaje.length; i++) {
            payload.body = payload.body + mensaje[i];
        }
        payload.body += ']';
        payload.body = JSON.parse(payload.body);
    }
    return payload;

}

async function SalesByYear(params) {
    let consola, compania, vg;
    if (params.nombreConsola) {
        consola = params.nombreConsola[0][0];
    }
    if (params.nombreCompania) {
        compania = params.nombreCompania[0][0];
    }
    let mayores_ventas = 0;
    let ventas_anyo = "";

    for (let i = 1980; i <= 2022; i++) {
        //Hacemos la consulta
        if (consola != null) { //Hay valor de "consola"
            vg = await VGBBDD.find({ Platform: consola, Year: i });
        } else if (compania != null) { //Hay valor de compañía
            vg = await VGBBDD.find({ Publisher: { $regex: compania, $options: 'i' }, Year: i });
        } else { //Query normal
            vg = await VGBBDD.find({ Year: i });
        }

        let ventas = 0;
        if (vg.length > 0) {
            for (let j = 0; j < vg.length; j++) {
                let ventas_float = Math.round(parseFloat(vg[j].Total_Shipped));
                if (!isNaN(ventas_float)) {
                    ventas += ventas_float;
                }
            }
            console.log('Ventas del año ', i, ': ', ventas);
            console.log('mayores_ventas: ', mayores_ventas);
            if (ventas > mayores_ventas) {
                mayores_ventas = ventas
                ventas_anyo = i;
            }
        }
    }
    console.log('The year with the highest sales of video games was ', ventas_anyo, ' with ', mayores_ventas, 'million copies distributed');
    let payload;
    if (params.nombreConsola) {
        payload = 'The year with the highest sales of video games for ' + consola + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed';
    } else if (params.nombreCompania) {
        payload = 'The year with the highest sales of video games for ' + compania + ' was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed';
    } else {
        payload = 'The year with the highest sales of video games was ' + ventas_anyo + ' with ' + mayores_ventas + ' million copies distributed';
    }
    return payload;
}

async function GamesPerName(params) {
    let nombre = params.nombreJuego[0];
    vg = await VGBBDD.findOne({ Name: { $regex: nombre, $options: 'i' } });
    //console.log('vg: ', vg);
    if (vg != null) {
        img_url = "https://www.vgchartz.com/" + vg.img_url;
        //Gestionamos la consola
        let consola = getConsola(vg.Platform);

        //Montamos la tarjeta
        var payload = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": [{
                    "type": "Image",
                    "url": img_url,
                    "altText": vg.Name + "-cover"
                },
                {
                    "type": "Container",
                    "items": [{
                            "type": "TextBlock",
                            "text": vg.Name,
                            "wrap": true,
                            "weight": "Bolder"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Genre: " + vg.Genre,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Global Sales: " + vg.Global_Sales,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Rating: " + vg.ESRB_Rating,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Score: " + vg.Critic_Score,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Platform: " + consola,
                            "wrap": true
                        },
                        {
                            "type": "TextBlock",
                            "text": "Release: " + vg.Year,
                            "wrap": true
                        }
                    ]
                },
                {
                    "type": "Container",
                    "items": [{
                        "type": "ActionSet",
                        "actions": [{
                            "type": "Action.OpenUrl",
                            "title": "Go to page",
                            "url": vg.url
                        }]
                    }]
                }
            ]
        };
    }
    return payload;
}

//Un switch para devolver el nombre de la consola
function getConsola(platform) {
    let nomConsola
    switch (platform) {
        case 'Wii':
            nomConsola = 'Nintendo Wii';
            break;
        case 'NS':
            nomConsola = 'Nintendo Switch';
            break;

        case 'NES':
            nomConsola = 'Nintendo Entretainment System';
            break;

        case 'GB':
            nomConsola = 'Nintendo Game Boy';
            break;

        case 'DS':
            nomConsola = 'Nintendo DS';
            break;

        case 'X360':
            nomConsola = 'Xbox 360';
            break;

        case 'SNES':
            nomConsola = 'Super Nintendo';
            break;

        case 'PS3':
            nomConsola = 'PlayStation 3';
            break;

        case 'PS4':
            nomConsola = 'PlayStation 4';
            break;

        case '3DS':
            nomConsola = 'Nintendo 3DS';
            break;

        case 'PS2':
            nomConsola = 'PlayStation 2';
            break;

        case 'GBA':
            nomConsola = 'Game Boy Advance';
            break;

        case 'GEN':
            nomConsola = 'Sega Mega Drive / Genesis';
            break;

        case 'N64':
            nomConsola = 'Nintendo 64';
            break;

        case 'PS':
            nomConsola = 'PlayStation 1';
            break;

        case 'XOne':
            nomConsola = 'Xbox One';
            break;

        case 'WiiU':
            nomConsola = 'Nintendo WiiU';
            break;

        case 'XB':
            nomConsola = 'Xbox';
            break;

        case 'PSP':
            nomConsola = 'PlayStation Portable';
            break;

        case '2600':
            nomConsola = 'Atari 2600';
            break;

        case 'GC':
            nomConsola = 'Nintendo GameCube';
            break;

        case 'GBC':
            nomConsola = 'Game Boy Color';
            break;

        case 'PSN':
            nomConsola = 'PlayStation Network';
            break;

        case 'PSV':
            nomConsola = 'PlayStation Vita';
            break;

        case 'DC':
            nomConsola = 'Sega Dreamcast';
            break;

        case 'Int':
            nomConsola = 'Mattel Intellivision';
            break;

        case 'XBL':
            nomConsola = 'Xbox Live';
            break;

        case 'SCD':
            nomConsola = 'Sega-CD';
            break;

        case 'SAT':
            nomConsola = 'Sega Saturn';
            break;

        case 'PS5':
            nomConsola = 'PlayStation 5';
            break;

        case 'XS':
            nomConsola = 'Xbox Series';
            break;

        default:
            break;
    }
    return nomConsola;
}

module.exports = { respuestaDFChatbot, respuestaMBFChatbot, respuestaLEXChatbot }