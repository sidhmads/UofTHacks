var express = require('express')
var router = express.Router()
var Clarifai = require('clarifai');
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient({
    keyFilename: 'API.json'
});

const clarifai = new Clarifai.App({
    apiKey: '008ef11e28ea40e29f3431ef7bb4b532'
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express', values: {} })
});

router.post('/pic', async function (req, res) {
    var request = {
        image: { content: `${req.body.base64}` },
        features: [
            {
                'type': 'TEXT_DETECTION'
            }
        ],
    };
    var result = {}
    client.annotateImage(request)
        .then(response => {
            // doThingsWith(response);
            let text = response[0].fullTextAnnotation.text.toLowerCase()
            let index = text.indexOf('subtotal') === -1 ? text.indexOf('sub total') : text.indexOf('subtotal')
            let arr = text.slice(index).split('\n')
            let max = 0
            let secondMax = 0;
            arr.forEach(line => {
                let l = line.split('$')
                if (l.length < 3) {
                    let val = parseFloat(l[l.length - 1])
                    if (!isNaN(val)) {
                        if (val > max) {
                            secondMax = max
                            max = val
                        }
                    }
                }
            })
            result['total'] = max
            result['tax'] = max - secondMax
            result['subtotal'] = secondMax
            res.json(result)
        })
})

router.post('/img/upload', function (req, res) {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send('No files were uploaded.')
    }
    let sampleFile = req.files.fileToUpload;
    sampleFile.mv(`./public/images/${sampleFile.name}`, (err) => {
        if (err) {
            return res.status(500).send(err)
        }

        clarifai.models.predict(Clarifai.GENERAL_MODEL, { base64: `${sampleFile.data.toString('base64')}` }).then(
            function (response) {
                let data = response.rawData.outputs[0].data.concepts
                let dict = {}
                data.forEach(data => {
                    var val = data.value.toString()
                    dict[data.name] = data.value.toString()
                })
                return res.render('index', { title: 'Result', values: dict })
            },
            function (err) {
                // there was an error
            }
        );
    })
})

router.post('/img/url', function (req, res) {
    console.log(req)
    res.render('index', { title: 'Express', values: {} })
})

module.exports = router;
