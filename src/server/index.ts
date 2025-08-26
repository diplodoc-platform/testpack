import express from 'express';

const app = express();

const {PROJECT, PORT} = process.env;

app.get('/', (_req, res) => {
    res.send('Welcome to the Playwright Test Server!');
});

app.use((req, _res, next) => {
    const tail = req.url.split('/').pop() as string;
    if (tail === '') {
        req.url += 'index.html';
    } else if (!tail.match(/\..+?$/)) {
        req.url += '.html';
    }

    next();
});

app.use(express.static(PROJECT as string));

app.listen(Number(PORT));
