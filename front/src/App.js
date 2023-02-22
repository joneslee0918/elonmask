import { useMetaMask } from "metamask-react";
import { useEffect, useRef, useState } from 'react';
import Web3 from "web3";
import './App.css';
import TwitterLogin from "./components/TwitterLogin.js";
import { checkFollow, getScreenName, saveUser } from "./services/api";

const FOLLOW_SATUS = {
  DISABLE: -1,
  LOGIN: 0,
  FOLLOW: 1,
  FOLLOWED: 2,
  UNFOLLOWED: 3,
}

function App() {
  const { status, connect, account } = useMetaMask();
  const web3 = useRef(new (Web3)(window.ethereum)).current;
  const [twitterUser, setTwitterUser] = useState()
  const [followStatus, setFollowStatus] = useState(FOLLOW_SATUS.DISABLE)

  const [signed, setSigned] = useState(false)
  const [authTokens, setAuthTokens] = useState({})
  const twitterClient = useRef();

  const authHandler = async (err, data) => {
    if (err) {
      console.log(err);
      alert("Twitter login error");
      setFollowStatus(FOLLOW_SATUS.LOGIN)
      return;
    }
    const { oauth_token, oauth_token_secret } = data;

    setAuthTokens({ oauth_token, oauth_token_secret })

    const response = await getScreenName(oauth_token, oauth_token_secret).catch(console.log)
    if (response?.success) {
      setFollowStatus(FOLLOW_SATUS.FOLLOW)
      setTwitterUser(response.screen_name)
      setTimeout(() => verifyFolled(), 100);
      return;
    }
    setFollowStatus(FOLLOW_SATUS.LOGIN)
  };

  const onSuccess = () => {
    saveUser(account, twitterUser)
      .then(res => alert("user saved"))
      .catch(err => {
        console.log(err);
        alert("user save error")
      })
  }
  const verifyFolled = async () => {
    if (followStatus === FOLLOW_SATUS.UNFOLLOWED) return setFollowStatus(FOLLOW_SATUS.FOLLOW)

    if (!twitterClient) return setFollowStatus(FOLLOW_SATUS.LOGIN)

    const response = await checkFollow(twitterUser, authTokens.oauth_token, authTokens.oauth_token_secret)
      .catch(console.log)
    if (response?.success) {
      onSuccess();
      return setFollowStatus(FOLLOW_SATUS.FOLLOWED)
    }
    setFollowStatus(FOLLOW_SATUS.UNFOLLOWED)
  }

  const getSigned = () => JSON.parse(window.localStorage.getItem('accounts')) || [];

  const addSignedAddress = (addr) => {
    var accounts = getSigned();
    accounts.push(addr)
    window.localStorage.setItem('accounts', JSON.stringify(accounts))
  }

  useEffect(() => {
    if (!account) return setSigned(false);
    var accounts = getSigned();
    var exists = accounts.filter(item => item.toLowerCase() === account.toLowerCase()).length > 0;
    setSigned(exists);
  }, [account])

  const ActionItem = ({ icon, content, title, desc, connected, error, button, disabled, onAction = () => { }, actionComponent }) => {
    return (
      <div className={`contain ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}>
        <div className='description'>
          <img src={icon} alt={title} />
          <div>
            <h2>{content ? content : title}</h2>
            <span>{desc}</span>
          </div>
          {connected &&
            <>
              <img src={'https://freenft.xyz/_next/static/media/green-check.b46832bf.svg'} alt={'CONNECTED'}
                style={{ width: 30, height: 30, marginRight: 10 }} />
              <h3>Connected</h3>
            </>
          }
        </div>

        {actionComponent ?
          actionComponent()
          :
          button ?
            <div className='action' onClick={onAction}>
              <p>{button}</p>
            </div>
            :
            <></>
        }
        {/* {disabled && <div className="overlay" />} */}
      </div>
    )
  }
  const generateKey = (length) => {
    var nonce = "";
    var allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
      nonce = nonce.concat(allowed.charAt(Math.floor(Math.random() * allowed.length)));
    }
    return nonce;
  }
  const signMessage = async () => {
    const nonce = generateKey(10);
    const message = `This is the official message, Your nonce is: ${nonce}`;
    const signatureHash = await web3.eth.personal.sign(message, account)
    if (signatureHash) {
      const address = web3.eth.accounts.recover(message, signatureHash)
      if (address.toLowerCase() === account.toLowerCase()) {
        setFollowStatus(FOLLOW_SATUS.LOGIN)
        setSigned(true);
        addSignedAddress(address)
      }
    }
  }

  const connected = status === 'connected';

  return (
    <div className="App">
      <div className="container">
        {status}
        <ActionItem
          icon={'https://www.freenft.xyz/_next/static/media/active.0e50e7a2.svg'}
          title={connected ? signed ? `Hello, ${account}` : 'Sign a message' : 'Connect your wallet'}
          desc={connected ? signed ? `Wallet Connected` : 'prove this is your wallet' : 'Start the whitelist process'}
          button={connected ? signed ? false : 'SIGN' : 'Connect'}
          connected={connected && signed}
          onAction={() => {
            if (connected) {
              signMessage()
            } else {
              setSigned(false);
              connect();
            }
          }}
        />
        <ActionItem
          icon={followStatus === FOLLOW_SATUS.DISABLE ?
            'https://www.freenft.xyz/_next/static/media/inactive.47228843.svg'
            :
            'https://www.freenft.xyz/_next/static/media/active.1d43c8ff.svg'
          }
          error={followStatus === FOLLOW_SATUS.UNFOLLOWED}

          content={<div>Follow <a href="https://twitter.com/elonmusk" target="_blank" rel="noreferrer">elonmusk</a></div>}
          desc={'And connect your twitter'}

          button={followStatus === FOLLOW_SATUS.UNFOLLOWED ?
            'You must follow the indicated twitter account(s) TRY AGAIN'
            :
            followStatus === FOLLOW_SATUS.FOLLOW ?
              'Verify'
              :
              ''
          }
          connected={followStatus === FOLLOW_SATUS.FOLLOWED}
          actionComponent={followStatus === FOLLOW_SATUS.LOGIN ? () => (
            <TwitterLogin
              className={'action'}
              authCallback={authHandler}
              children={<p>{"Connect & Verify"}</p>}
            />
          ) : null}
          onAction={verifyFolled}
          disabled={followStatus === FOLLOW_SATUS.DISABLE}
        />
        <div className={`contain ${followStatus !== FOLLOW_SATUS.FOLLOWED ? 'disabled' : ''}`}>
          <div className='action' onClick={console.log}>
            <p>{"Submit"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;