const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const cors = require('cors')({origin: true});

const stripe = require('stripe')(functions.config().stripe.key);

function charge(req, res) {
    let amount = req.body.numPicks * 2500;
    let token = req.body.token;
    console.log(amount);
    stripe.charges.create({
        amount,
        currency: "usd",
        description: "Pick'm Football Pool",
        source: token
    })
    .catch(err => {
        res.send(JSON.stringify(err));
    })
    .then(charge => {
        charge.numPicks = req.body.numPicks;
        res.send(JSON.stringify(charge));
    });
}

exports.chargePicks = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        charge(req, res);
    });
});

