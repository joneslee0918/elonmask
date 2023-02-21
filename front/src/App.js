import { useMetaMask } from "metamask-react";
import { useEffect, useRef, useState } from 'react';
import Web3 from "web3";
import './App.css';
import TwitterLogin from "./components/TwitterLogin.js";
import { checkFollow, getScreenName } from "./services/api";


function App() {
  const { status, connect, account } = useMetaMask();
  const web3 = useRef(new (Web3)(window.ethereum)).current;
  const [twitterUser, setTwitterUser] = useState("vaingloriousETH")
  const [isFollowed, setIsFollowed] = useState(false)
  const [signed, setSigned] = useState(false)
  const [authTokens, setAuthTokens] = useState({})
  const twitterClient = useRef();

  const authHandler = async (err, data) => {
    if (err) {
      alert("Twitter login error");
      setIsFollowed(false);
      console.log(err);
      return;
    }
    const { oauth_token, oauth_token_secret } = data;

    setAuthTokens({ oauth_token, oauth_token_secret })

    const response = await getScreenName(oauth_token, oauth_token_secret).catch(console.log)
    if (response?.success) return setTwitterUser(response.screen_name)

    console.log(response.error);
    alert("get verify status error");
    setIsFollowed(false);
  };

  const saveUser = () => {
    saveUser(account, twitterUser)
      .then(res => {
        alert("user saved")
      })
      .catch(err => {
        console.log(err);
        alert("user save error")
      })
  }
  const verifyFolled = async () => {
    if (!twitterClient) {
      setIsFollowed(false);
      alert("login failed");
      return;
    }
    const response = await checkFollow(twitterUser, authTokens.oauth_token, authTokens.oauth_token_secret)
      .catch(console.log)
    if (response?.success) {
      saveUser();
      return setIsFollowed(response.followed)
    }
    console.log(response.error);
    alert("get verify status error");
    setIsFollowed(false);
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

  const ActionItem = ({ icon, title, desc, button, disabled, onAction = () => { }, actionComponent }) => {
    return (
      <div className={`contain ${disabled && 'disabled'}`}>
        <div className='description'>
          <img src={icon} alt={title} />
          <div >
            <h2>{title}</h2>
            <span>{desc}</span>
          </div>
        </div>

        {button ?
          actionComponent ?
            actionComponent()
            :
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
        setSigned(true);
        addSignedAddress(address)
      }
    }
  }

  return (
    <div className="App">
      <div className="container">
        {status}
        {isFollowed ?
          <h2>
            Login Success
            <br />
            {twitterUser}
            <br />
            {account}
          </h2>
          :
          <>
            <ActionItem
              icon={'https://www.freenft.xyz/_next/static/media/active.0e50e7a2.svg'}
              title={account ? signed ? `Hello, ${account}` : 'Sign a message' : 'Connect your wallet'}
              desc={account ? signed ? `Wallet Connected` : 'prove this is your wallet' : 'Start the whitelist process'}
              button={account ? signed ? false : 'SIGN' : 'Connect'}
              onAction={() => {
                if (account) {
                  signMessage()
                } else {
                  setSigned(false);
                  connect();
                }
              }}
            />
            <ActionItem
              icon={'https://www.freenft.xyz/_next/static/media/inactive.47228843.svg'}
              title={'Follow elonmusk'}
              desc={'And connect your twitter'}
              button={twitterUser ? 'verify' : 'Follow'}
              actionComponent={() => (
                <TwitterLogin
                  className={'action'}
                  authCallback={authHandler}
                  children={<p>{"Follow"}</p>}
                />
              )}
              onAction={verifyFolled}
              disabled={!account || !signed}
            />
          </>
        }
      </div>
    </div>
  );
}

export default App;