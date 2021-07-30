const http = require('http');
const express = require('express');
const app = express();


app.use(express.static(__dirname));

app.listen(3000, () => {
    console.log("Application started and listening on port 3000");
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})