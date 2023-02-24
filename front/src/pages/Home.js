import { useMetaMask } from "metamask-react";
import { useEffect, useRef, useState } from 'react';
import Web3 from "web3";
import TwitterLogin from "../components/TwitterLogin.js";
import { checkFollow, getScreenName, saveUser } from "../services/api";
import './styles.css';

const FOLLOW_SATUS = {
  DISABLE: -1,
  LOGIN: 0,
  FOLLOW: 1,
  FOLLOWED: 2,
  UNFOLLOWED: 3,
}

function Home() {
  const { status, connect, account } = useMetaMask();
  const web3 = useRef(new (Web3)(window.ethereum)).current;
  const [twitterUser, setTwitterUser] = useState()
  const [followStatus, setFollowStatus] = useState(FOLLOW_SATUS.DISABLE)
  const [oauthToken, setOauthToken] = useState(null)

  const [signed, setSigned] = useState(false)

  useEffect(() => {
    if (!account) return setSigned(false);
    var accounts = getSigned();
    var exists = accounts.filter(item => item.toLowerCase() === account.toLowerCase()).length > 0;
    setSigned(exists);
  }, [account])

  useEffect(() => {
    if (account && signed) setFollowStatus(FOLLOW_SATUS.LOGIN)
    else setFollowStatus(FOLLOW_SATUS.DISABLE)
  }, [account, signed])

  useEffect(() => {
    if (followStatus !== FOLLOW_SATUS.FOLLOW) return
    if (!oauthToken) return;
    if (!twitterUser) return;
    verifyFolled()
  }, [oauthToken, twitterUser, followStatus])

  const authHandler = async (err, data) => {
    if (err) {
      console.log(err);
      alert("Twitter login error");
      setFollowStatus(FOLLOW_SATUS.LOGIN)
      return;
    }
    const { oauth_token, oauth_token_secret } = data;
    setOauthToken({ oauth_token, oauth_token_secret })

    const response = await getScreenName(oauth_token, oauth_token_secret).catch(console.log)
    if (response?.success) {
      setTwitterUser(response.screen_name)
      setFollowStatus(FOLLOW_SATUS.FOLLOW)
      return;
    }
    setFollowStatus(FOLLOW_SATUS.LOGIN)
  };

  const onSuccess = () => {
    if (followStatus !== FOLLOW_SATUS.FOLLOWED) return;

    saveUser(account, twitterUser)
      .then(res => alert("login success and user saved"))
      .catch(err => {
        console.log(err);
        alert("user save error")
      })
  }
  const verifyFolled = async () => {
    if (!twitterUser) return setFollowStatus(FOLLOW_SATUS.LOGIN)
    if (followStatus === FOLLOW_SATUS.UNFOLLOWED) return setFollowStatus(FOLLOW_SATUS.FOLLOW)
    const response = await checkFollow(twitterUser, oauthToken.oauth_token, oauthToken.oauth_token_secret)
      .catch(console.log)
    if (response?.success && response.followed) {
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

  const ActionItem = ({ icon, content, title, desc, connected, error, button, disabled, onAction = () => { }, actionComponent }) => {
    return (
      <div className={`contain ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}>
        <div className='description'>
          <img src={icon} alt={title} />
          <div className="title">
            <h3>{content ? content : title}</h3>
            <span>{desc}</span>
          </div>
          {connected &&
            <>
              <img src={'https://freenft.xyz/_next/static/media/green-check.b46832bf.svg'} alt={'CONNECTED'}
                style={{ width: 25, height: 25, marginRight: 5 }} />
              <h5>Connected</h5>
            </>
          }
        </div>

        {actionComponent ?
          actionComponent()
          :
          button ?
            <div className='action' onClick={disabled || !onAction ? () => { } : onAction}>
              {button}
            </div>
            :
            <></>
        }
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

  const isredirectScreen = window.location.href.includes("oauth_token")
  return (
    <div className="App">
      {isredirectScreen && <div>Redirecting....</div>}
      <div className={`container ${isredirectScreen ? 'redirecting' : ''}`}>
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
              followStatus === FOLLOW_SATUS.DISABLE ?
                'Connect & Verify'
                :
                ''
          }
          connected={followStatus === FOLLOW_SATUS.FOLLOWED}
          actionComponent={followStatus === FOLLOW_SATUS.LOGIN ? () => (
            <TwitterLogin
              className={'action'}
              authCallback={authHandler}
              children={<div>{"Connect & Verify"}</div>}
            />
          ) : null}
          onAction={() => verifyFolled()}
          disabled={followStatus === FOLLOW_SATUS.DISABLE}
        />
        <div className={`contain ${followStatus !== FOLLOW_SATUS.FOLLOWED ? 'disabled' : ''}`}>
          <div className='action' onClick={onSuccess}>
            <div>{"Submit"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;