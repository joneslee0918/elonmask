import bodyParser from 'body-parser';
import cors from 'cors';
import express from "express";
import fetch from 'node-fetch';
import path, { dirname } from "path";
import Twit from 'twit';
import { fileURLToPath } from 'url';
import { CONSUMER_KEY, CONSUMER_SECRET } from "./config.js";
import { accessTokenSignature, requestTokenSignature } from "./signature.js";
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url));

var app = express();
app.use(express.static("front/build"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const parseOAuthRequestToken = (responseText) =>
  responseText.split("&").reduce((prev, el) => {
    const [key, value] = el.split("=");
    return { ...prev, [key]: value };
  }, {});


app.get('/api/request-token', async function (req, res) {
  const apiUrl = "https://api.twitter.com/oauth/request_token";
  const method = "POST"
  const oauthSignature = requestTokenSignature({ apiUrl, method });
  // https://corsanywhere.herokuapp.com/
  const response = await fetch(apiUrl, {
    method,
    headers: {
      Authorization: `OAuth ${oauthSignature}`,
      "X-Requested-With": "XMLHttpRequest"
    }
  });
  const responseText = await response.text();
  const token = parseOAuthRequestToken(responseText);
  res.send(token);
})

app.post('/api/access-token', async function (req, res) {
  const { oauthToken, oauthVerifier } = req.body;
  const apiUrl = "https://api.twitter.com/oauth/access_token";
  const method = "POST"

  const oauthSignature = accessTokenSignature({ method, apiUrl, oauthToken, oauthVerifier });
  const response = await fetch(apiUrl, {
    method,
    headers: {
      Authorization: `OAuth ${oauthSignature}`,
      "X-Requested-With": "XMLHttpRequest"
    }
  });
  const responseText = await response.text();
  const token = parseOAuthRequestToken(responseText);
  res.send(token);
})

const twitter = (url, data, access_token, access_token_secret) => {
  return new Promise((resolve, reject) => {
    const T = new Twit({
      consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET, access_token, access_token_secret,
    });

    T.get(url, data, function (err, data, response) {
      if (err) {
        resolve(false)
        console.log(err);
      } else {
        resolve(data);
      }
    });
  })
}
app.post('/api/verify-credentials', async function (req, res) {
  const { access_token, access_token_secret } = req.body;
  const data = { tweet_mode: "extended" };
  const url = 'account/verify_credentials';
  try {
    const response = await twitter(url, data, access_token, access_token_secret)
    res.send({ screen_name: response.screen_name, success: true })
  } catch (error) {
    res.send({ screen_name: "", error })
  }
})
app.post('/api/check-followers', async function (req, res) {
  const { screen_name, access_token, access_token_secret } = req.body;
  const data = { screen_name };
  const url = 'friends/ids';
  try {
    const response = await twitter(url, data, access_token, access_token_secret)
    const followingElonMusk = response.ids.includes(44196397);
    console.log(data, followingElonMusk);
    res.send({ followed: followingElonMusk, success: true })
  } catch (error) {
    res.send({ followed: false, error })
  }
})

app.post('/api/save-user', async function (req, res) {
  const { address, twitter_name } = req.body;
  console.log(address, twitter_name)
  fs.appendFileSync("users.csv", `${address},${twitter_name}`)
  res.send({ success: true })
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front/build", "index.html"));
});

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})