//Importamos módulos
const express = require('express');
//CORS permite ser usado desde cualquier aplicación
const cors = require('cors');
//DOTENV permite cargar variables de entorno 
require('dotenv').config();
const { dbConnection } = require('./database/configdb.js')

const { respuestaDFChatbot, respuestaMBFChatbot, respuestaLEXChatbot } = require('./controllers/chatbot');

// Crear una aplicación de express
const app = express();

//Conectamos a la base de datos
dbConnection();

//Colocamos los middleware aqui
//Uso de cors para el tratamiento de rutas
app.use(cors());
//app.use('/api/endpoint', require('./routes/chatbot'));
//app.use('/api/chatbot', require('./routes/chatbot'));


app.get('/', (req, res) => {
    console.log('Accede al backend');
    res.send('backend activo');
});

//Llamando al controller desde aquí nos quitamos de encima el router
app.post('/api/dfendpoint', express.json(), (req, res) => {
    //console.log('req en el index: ', req.body);
    respuestaDFChatbot(req, res);
});

app.post('/api/mbfendpoint', express.json(), (req, res) => {
    //console.log('req en el index: ', req.body);
    respuestaMBFChatbot(req, res);
});

app.post('/api/lexendpoint', express.json(), (req, res) => {
    //console.log('req en el index de LEX: ', req.body);
    respuestaLEXChatbot(req, res);
    //res.send;
});

// Abrir la aplicacíon en el puerto 3000
app.listen(process.env.PORT, () => {
    console.log('Servidor corriendo en el puerto ', process.env.PORT);
});