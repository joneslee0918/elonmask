import React, { useRef, useEffect } from 'react'
import { accessToken, requestToken } from '../services/api';
import { openWindow, observeWindow } from "../services/window.js";

var isCompleted = false;
export default function TwitterLogin(props) {
    const popupRef = useRef(null)

    const initializeProcess = () => {
        if (window.opener) {
            const [, oauthToken, oauthVerifier] = window.location.search.match(/^(?=.*oauth_token=([^&]+)|)(?=.*oauth_verifier=([^&]+)|).+$/) || [];
            window.opener.postMessage({ type: "authorized", data: { oauthToken, oauthVerifier } }, window.origin);
        } else {
            window.onmessage = async ({ data: { type, data } }) => {
                if (type === "authorized" && isCompleted == false) {
                    isCompleted = true
                    const accessTokenData = await accessToken(data.oauthToken, data.oauthVerifier)
                    props.authCallback && props.authCallback(undefined, accessTokenData);
                    popupRef?.current && popupRef.current.close();
                }
            };
        }
    };

    useEffect(() => {
        initializeProcess();
    }, [])

    const handleClosingPopup = () => {
        if (!isCompleted) {
            props.authCallback && props.authCallback("User closed OAuth popup");
        }
        isCompleted = false;

    }

    const handleLoginClick = async () => {
        const popup = openWindow({
            url: ``,
            name: "Log in with Twitter"
        });
        const requestTokenData = await requestToken(window.location.href);
        if (requestTokenData.oauth_callback_confirmed === "true" && popup !== null) {
            popup.location.href = `https://api.twitter.com/oauth/authorize?oauth_token=${requestTokenData.oauth_token}`;

            if (popup) {
                observeWindow({ popup, onClose: handleClosingPopup });
                popupRef.current = popup;
            }
        } else {
            props.authCallback(`Callback URL "${window.location.href}" is not confirmed. Please check that is whitelisted within the Twitter app settings.`)
        }
    }
    return (
        <div onClick={handleLoginClick} className={props.className}>
            {props.children}
        </div>
    )
}
