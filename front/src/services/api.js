
const server_url = window.location.href;
// const server_url = 'http://localhost:8000/'

const METHOD = {
    GET: "GET",
    POST: 'POST'
}
const _request = (url, method = METHOD.GET, data) => {
    method = method.toUpperCase();
    return fetch(`${server_url}api/${url}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        ...(method === METHOD.POST && { body: JSON.stringify(data) })
    })
        .then(res => res.json())
}

export const requestToken = () =>
    _request('request-token', METHOD.GET)

export const accessToken = (oauthToken, oauthVerifier) =>
    _request('access-token', METHOD.POST, { oauthToken, oauthVerifier })

export const getScreenName = (access_token, access_token_secret) =>
    _request('verify-credentials', METHOD.POST, { access_token, access_token_secret })

export const checkFollow = (screen_name, access_token, access_token_secret) =>
    _request('check-followers', METHOD.POST, { screen_name, access_token, access_token_secret })

export const saveUser = (address, twitter_name) =>
    _request('save-user', METHOD.POST, { address, twitter_name })
