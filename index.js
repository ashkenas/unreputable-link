import express from "express";
import { createMaskedLink, resolveMask } from "./database.js";

const sync = f => (req, res, next) => f(req, res).catch(next);

const app = express();
app.use(express.static('./public'));
app.use(express.json());
app.post('/', sync(async (req, res) => {
  await createMaskedLink(req.body.mask, req.body.actual);
  res.sendStatus(200);
}));
app.get("*", sync(async (req, res) => {
  const actual = await resolveMask(req.url.slice(1));
  if (actual) return res.redirect(actual);
  res.sendFile("./public/404.html", { root: '.' });
}));

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = (status !== 500 && err.message) || 'Internal Server Error';
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

const returnedServer = app.listen(8673, () => {
  console.log(`App started at http://localhost:${returnedServer.address().port}`);
});
