const path = require('path');
const express = require('express');
const Sentiment = require('sentiment');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname,'public'), {index: '_'}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('/voice', (req, res) => {
    const sentiment = new Sentiment();
    const text = req.query.text;
    const score = sentiment.analyze(text);
    res.send(score);
})

app.get('/mirror', (req, res) => {
    const sentiment = new Sentiment();
    const text = req.query.text;
    const score = sentiment.analyze(text);
    res.send(score);
})

app.listen(port);
console.log('Server is running on port ' + port);