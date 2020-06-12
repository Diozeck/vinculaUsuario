const express = require('express')
const app = express()
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const Client = require('authy-client').Client;
const port = 8080;

//para que los servicios se lean con un json body
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

module.exports = app;

const config = require('./config')
var authy = require('authy')(config.apiKey);
const client = new Client({ key: config.apiKey }, { host: "https://api.authy.com" }, { timeout: 100000 });

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "API Twilio Authy",
            description: "Consumir los servicios de Authy",
            contact: {
                name: "Erick"
            },
            //servers: ["http://localhost:8080"]
            servers: ["https://ieeemn7mb5.execute-api.us-east-2.amazonaws.com/production"]
        }
    },
    apis: ["index.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


/**
* @swagger
*
* tags:
* - name: Twilio
*
* /production/Registro:
*    post:
*      tags:
*      - Twilio
*      description: Registar usuarios
*      consumes:
*      - application/json
*      produces:
*      - application/json
*      parameters:
*      - in: body
*        name: Registro
*        schema:
*          $ref: '#/definitions/Registro'
*      responses:
*        200:
*          description: Usuario Registrado
*        400:
*          description: Verifica tus datos
*        500:
*          description: Error al registrar
*definitions:
*  Registro:
*    type: object
*    required:
*    - codigopais
*    - celular
*    - email
*    properties:
*      email:
*        type: string
*        example: "prueba@gmail.com"
*      celular:
*        type: string
*        example: "5587485131"
*      codigopais:
*        type: string
*        example: "52"
*/

app.post('/Registro', (req, res) => {
    if ((req.body.email != "") && (req.body.celular).length === 10 && (req.body.codigopais != "")) {
        authy.register_user(req.body.email, req.body.celular, req.body.codigopais, function (err, respuesta) {
            if (respuesta) {
                console.log("Token envio 1: ");
                authy.request_sms(respuesta.user.id, force = true, function (errSms, resSms) {
                    console.log("Prueba");
                    if (resSms) {
                        console.log("Token de activacion enviado 1: ", resSms);
                    } else {
                        console.log("Token envio 2: ", errSms);
                        authy.request_sms(respuesta.user.id, force = true, function (errSms, resSms) {
                            if (resSms) {
                                console.log("Token de activacion enviado 2: ", resSms);
                            } else {
                                console.log("Token envio 3: ", errSms);
                                authy.request_sms(respuesta.user.id, force = true, function (errSms, resSms) {
                                    if (resSms) {
                                        console.log("Token de activacion enviado 3: ", resSms);
                                    } else {
                                        console.log("Error al enviar Token de activacion SMS: ", errSms);
                                    }
                                });
                            }
                        });
                    }
                });
                console.log("Usuario Registrado", respuesta);
                res.status(200).json(respuesta);
            } else {
                console.log("Error al registra", err);
                res.status(500).json(err);
            }
        })
    } else {
        console.log("Verifica tus datos");
        res.status(400).send({
            message: "Verifica tus datos"
        })
    }
});

/* app.post('/Registro', (req, res) => {
    if ((req.body.email != "") && (req.body.celular).length === 10 && (req.body.codigopais).length === 2) {
        client.registerUser({ countryCode: req.body.codigopais, email: req.body.email, phone: req.body.celular}, function (err, resp) {
            if (err) {
                console.log("Error al registra", err);
                res.status(500).json(err);
            } else {
                client.requestSms({ authyId: resp.user.id }, { force: true }, function (errSms, resSms) {
                    if (errSms) {
                        console.log("Error al enviar SMS: ", errSms);
                    } else {
                        console.log("Mensaje enviado: ", resSms);
                    }
                });
                console.log("Usuario Registrado: ", resp);
                res.status(200).json(resp);
            }
        });
    } else {
        console.log("Verifica tus datos");
        res.status(400).send({
            message: "Verifica tus datos"
        })
    }
}); */

/**
* @swagger
*
* /production/Verificar:
*    post:
*      tags:
*      - Twilio
*      description: Verificar token
*      consumes:
*      - application/json
*      produces:
*      - application/json
*      parameters:
*      - in: body
*        name: VerificaTokenSms
*        schema:
*          $ref: '#/definitions/VerificaTokenSms'
*      responses:
*        200:
*          description: Token valido
*        400:
*          description: Verifica tus datos
*        500:
*          description: Token invalido
*definitions:
*  VerificaTokenSms:
*    type: object
*    required:
*    - authyId
*    - token
*    properties:
*      authyId:
*        type: number
*        example: 123456789
*      token:
*        type: string
*        example: "123456"
*/

app.post('/Verificar', (req, res) => {
    if ((req.body.token).length === 6 && (req.body.authyId != "")) {
        /* authy.verify(req.body.authyId, req.body.token, function (err, tokenResp) {
            if (err) {
                console.log("Token invalido", err);
                res.status(500).json(err);
                return;
            }
            console.log("Token valido", tokenResp);
            res.status(200).json(tokenResp);
        }); */
        client.verifyToken({ authyId: req.body.authyId, token: req.body.token }, function (err, tokenres) {
            if (err) {
                console.log("Token invalido", err);
                res.status(500).json(err);
            }
            console.log("Token valido", tokenres);
            res.status(200).json(tokenres);
        });
    } else {
        console.log("Verifica tus datos");
        res.status(400).send({
            message: "Verifica tus datos"
        })
    }
})


/**
* @swagger
*
* /production/TokenSms:
*    post:
*      tags:
*      - Twilio
*      description: Enviar token SMS
*      consumes:
*      - application/json
*      produces:
*      - application/json
*      parameters:
*      - in: body
*        name: EnvioTokenSms
*        schema:
*          $ref: '#/definitions/EnvioTokenSms'
*      responses:
*        200:
*          description: Mensaje enviado
*        400:
*          description: Verifica tus datos
*        500:
*          description: Error al enviar SMS.
*definitions:
*  EnvioTokenSms:
*    type: object
*    required:
*    - authyId
*    properties:
*      authyId:
*        type: number
*        example: 123456789
*/

app.post('/TokenSms', (req, res) => {
    if ((req.body.authyId != "")) {
        /*   authy.request_sms(req.body.authyId, force = true, function (errSms, resSms) {
              if (errSms) {
                  console.log("Error al enviar SMS", errSms);
                  res.status(500).json(errSms);
              } else {
                  console.log("Mensaje enviado", resSms);
                  res.status(200).json(resSms);
              }
          }); */
        client.requestSms({ authyId: req.body.authyId }, force = true, function (errSms, resSms) {
            if (errSms) {
                console.log("Error al enviar SMS", errSms);
                res.status(500).json(errSms);
            } else {
                console.log("Mensaje enviado", resSms);
                res.status(200).json(resSms);
            }
        });
    } else {
        console.log("Verifica tus datos");
        res.status(400).send({
            message: "Verifica tus datos"
        })
    }
})

app.listen(port, () => {
    console.log(`Server:  ${port}`)
})