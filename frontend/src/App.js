import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { networks } from './utils/networks';
import vendorContractABI from './utils/Vendor.json';
import tokenContractABI from './utils/Token.json';
import { ethers } from "ethers";
import ReactDom from "react-dom";

//constants
const vendorContractAddress = '0xD29aeB7fcB7Af310951E9e308134eD624b7CF95b';
const tokenContractAddress = '0x88968a54b42de735508113aa398aE5a02210712a';
const vendorContractAbi = vendorContractABI.abi;
const tokenContractAbi = tokenContractABI.abi;
const vendorContractEtherscanLink = `https://rinkeby.etherscan.io/address/${vendorContractAddress}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [network, setNetwork] = useState("");
  const [tokenAmountOwnedByUser, setTokenAmountOwnedByUser] = useState('');
  const [tokensAvailableForPurchase, setTokensAvailableForPurchase] = useState('');
  const [tokenCostInEth, setTokenCostInEth] = useState('');
  const [isBuyingOrSellingToken, setIsBuyingOrSellingToken] = useState(false);
  const [isBuyingToken, setIsBuyingToken] = useState(false);
  const [isSellingToken, setIsSellingToken] = useState(false);
  const [isGrantingApproval, setIsGrantingApproval] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error(`Please download Metamask!`, {
          position: "top-right",
          autoClose: 3500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
      } else {
        console.log("We have the ethereum object:", ethereum);
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);
        setNetwork(networks[chainId]);
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('Found an authorized account:', account);
          setCurrentAccount(account);
          toast.success("Wallet Connected. Ribbet.", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          console.log('No authorized account found');
        }
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  const fetchTokenInfo = async () => {
    console.log('Fetching the token info...');
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractAbi, signer);
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);

        //get amount of tokens owned by the user
        const amountOfTokensUserOwnsInWei = await tokenContract.balanceOf(currentAccount);
        let amountOfTokenUserOwns = Number(ethers.utils.formatEther(amountOfTokensUserOwnsInWei)).toFixed(2);
        console.log(`You currently own ${amountOfTokenUserOwns} FROG`);
        if (amountOfTokenUserOwns === '0.00') {
          amountOfTokenUserOwns = '0';
        }
        setTokenAmountOwnedByUser(amountOfTokenUserOwns);

        //get total circulating token supply 
        const totalTokenSupplyInWei = await tokenContract.totalSupply();
        const totalTokenSupply = ethers.utils.formatEther(totalTokenSupplyInWei);
        console.log(`The total token supply is ${totalTokenSupply}`);

        //get amount of tokens owned by the vendor 
        const amountOfTokensVendorOwnsInWei = await tokenContract.balanceOf(vendorContractAddress);
        let amountOfTokensVendorOwns = ethers.utils.formatEther(amountOfTokensVendorOwnsInWei);
        console.log(`The vendor currently owns ${amountOfTokensVendorOwns} FROG`);
        setTokensAvailableForPurchase(amountOfTokensVendorOwns);

        //get cost of token
        const tokensPerEth = (await vendorContract.tokensPerEth()).toString();
        const costOfTokenInEth = 1 / tokensPerEth;
        setTokenCostInEth(costOfTokenInEth);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // USE EFFECTS
  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    //since fetchTokenInfo() needs the account, must be defined for it to run
    if(currentAccount) {
      fetchTokenInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  //listen for chain changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      })

      window.ethereum.on('accountsChanged', () => {
        window.location.reload();
      })
    }
  })

  //HANDLERS
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Please download MetaMask to use this dapp");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        //Try to switch to the Rinkeby test net 
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4' }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      //If window.ethereum is not found then MetaMask is not installed
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
      toast.error(`Please download Metamask!`, {
        position: "top-right",
        autoClose: 3500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }

  const buyToken = async (amount) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);

        //purchase token
        //need .toFixed because having problems when multiplying decimals together, this caps the length 
        let amountOfEthToSend = (amount * tokenCostInEth).toFixed(7);
        console.log("Amount of eth to send", amountOfEthToSend);
        const tokenTxn = await vendorContract.buyTokens({ value: ethers.utils.parseEther(amountOfEthToSend.toString())});
        console.log("Buying token...Here's the transaction hash:", tokenTxn.hash);
        toast.success("Purchasing FROG... 🐸 ", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        await tokenTxn.wait();
        console.log("Mined transaction:", tokenTxn.hash);

        //update variables
        fetchTokenInfo();

        toast.success("FROG Purchased! Ribbet.", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        setIsBuyingOrSellingToken(false);
        setIsBuyingToken(false);

      }
    } catch (error) {
      console.log(error);
      setIsBuyingOrSellingToken(false);
      setIsBuyingToken(false);
      toast.error(`${error.message}`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }

  const sellToken = async (amount) => {
    setIsBuyingOrSellingToken(true);
    setIsSellingToken(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractAbi, signer);

        //need to grant approval before selling token
        setIsGrantingApproval(true);
        //the below  is needed to use BigInt
        /* global BigInt */
        //1000000000000000000 b/c that is the wei equivalent of 1 token 
        //1 frog = 1000000000000000000 wei frog; just like...
        //1 eth = 1000000000000000000 wei
        let constant = "1000000000000000000";
        //need to convert constant * amount to a BigInt b/c the value is too large otherwise
        let amountOfTokensUserIsSellingInWei = BigInt(constant * amount);
        const approvalTxn = await tokenContract.approve(vendorContractAddress, amountOfTokensUserIsSellingInWei);

        console.log("Granting approval for selling token...Here's the transaction hash:", approvalTxn.hash);
        toast.success("Granting Approval.. 🐸 ", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        await approvalTxn.wait();
        console.log("Mined transaction:", approvalTxn.hash);
        setIsGrantingApproval(false);

        //sell token
        const saleTxn = await vendorContract.sellTokens(amountOfTokensUserIsSellingInWei);
        console.log("Selling tokens...Here's the transaction hash:", saleTxn.hash);
        toast.success("Selling Your FROG... 🐸 ", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        await saleTxn.wait();
        console.log("Mined transaction:", saleTxn.hash);

        //update variables
        fetchTokenInfo();

        toast.success("FROG Sold! Ribbet. 🐸 ", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        setIsBuyingOrSellingToken(false);
        setIsSellingToken(false);
      }
    } catch (error) {
      console.log(error);
      setIsBuyingOrSellingToken(false);
      setIsSellingToken(false);
      toast.error(`${error.message}`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }

  //RENDER METHODS
  const renderConnectWalletButtonOrRinkebyWarning = () => {
    if (!currentAccount) {
      return (
        <button className='connect-wallet-button' onClick={connectWallet}>
          Connect Wallet
        </button>
      )
    }

    if (currentAccount && network !== "Rinkeby") {
      return (
        <div className="rinkeby-only">
          <p>Hold up! This dapp only works on the Rinkeby Test Network. To buy some FrogCoin🐸 please switch networks in your connected wallet or by clicking below.</p>
          <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
        </div>
      )
    }
  }

  const renderTestEthMessage = () => {
    if (currentAccount && network === "Rinkeby") {
      return <p className="test-eth">
        If you need test ETH, try using <a href="https://faucets.chain.link/rinkeby">this faucet</a>.
      </p>
    }
  }

  const renderBuyAndSellButtons = () => {
    if (currentAccount && network === "Rinkeby") {
      return (
        <div className='buy-and-sell-button-container' >
          <div className='buy-button-container'>
            <button onClick={openBuyModal} disabled={isBuyingOrSellingToken}>
              {isBuyingToken && !showModal ? 'Purchasing...' : 'Buy 🐸'}
            </button>
            {renderBuyingLoader()}
          </div>
          <div className='sell-button-container'>
            <button onClick={openSellModal} disabled={isBuyingOrSellingToken}>
              {isSellingToken && !showModal ? (isGrantingApproval ? 'Granting approval...' : 'Selling...') : 'Sell 🐸'}
            </button>
            {renderSellingLoader()}
          </div>
        </div>
      )
    }
  }

  const renderTokenAmounts = () => {
    if (currentAccount && network === 'Rinkeby') {
      return (
        <div className='token-amounts'>
          {<h1>You currently own {tokenAmountOwnedByUser} FROG</h1>}
          {<h1>There are {Number(tokensAvailableForPurchase).toFixed(2)} FROG available to purchase</h1>}
          {<h1>1 FROG costs <span className='eth-symbol'>Ξ</span>{tokenCostInEth}</h1>}
        </div>
      )
    }
  }

  const renderBuyingLoader = () => {
    if (isBuyingToken && !showModal) {
      return (
        <div className="lds-spinner lds-spinner-buying"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
      )
    }
  }

  const renderSellingLoader = () => {
    if (isSellingToken && !showModal) {
      return (
        <div className="lds-spinner lds-spinner-selling"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
      )
    }
  }

  const openBuyModal = () => {
    setShowModal(true);
    setIsBuyingOrSellingToken(true);
    setIsBuyingToken(true);
  };

  const openSellModal = () => {
    setShowModal(true);
    setIsBuyingOrSellingToken(true);
    setIsSellingToken(true);
  };

  //MODAL//
  //useRef takes reference to the modal
  const modalRef = useRef();

  const closeModal = (e) => {
    //modalRef.current is the div with class of 'container'
    if (e.target === modalRef.current) {
      endTransaction();
    }
  };

  const endTransaction = () => {
    setShowModal(false);
    setIsBuyingOrSellingToken(false);
    setIsBuyingToken(false);
    setIsSellingToken(false);
  }

  const renderModal = () => {
    if (showModal) {
      //a portal exists outside the DOM heirarchy of the parent component
      //takes 2 arguments: 1) content to render 2) where to render it 
      return ReactDom.createPortal(
        <div className="container" ref={modalRef} onClick={closeModal}>
          <div className="modal">
            {<h2>How many FrogCoins would you like to {isBuyingToken ? 'buy' : (isSellingToken ? 'sell' : '')}?</h2>}
            <button className='x-button' onClick={() => endTransaction()}>X</button>
            <form className='form' onSubmit={(event) => {
              event.preventDefault();
              const amount = document.getElementById('token-amount').value;
              if (isBuyingToken) {
                setShowModal(false);
                buyToken(amount);
              } else if (isSellingToken) {
                setShowModal(false);
                sellToken(amount);
              }
            }}
            >
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  id="token-amount"
                  autoComplete="off"
                  required />
              </div>
              <button type="submit">
                {isBuyingToken ? 'BUY' : (isSellingToken ? 'SELL' : '')}
              </button>
            </form>
          </div>
        </div>,
        document.getElementById("portal")
      );
    }
  }


  return (
    <div className="outerContainer">
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
            FrogCoin Token Vendor 🐸
          </div>

          <div className="slogan">
            The ONLY place on the Interwebs to buy and sell FrogCoin. Ribbet.
          </div>

          {renderConnectWalletButtonOrRinkebyWarning()}

          {renderBuyAndSellButtons()}

          {renderTestEthMessage()}

          {renderTokenAmounts()}

          {renderModal()}

        </div>
        <div className="footer-container">
          Check out the <a href={vendorContractEtherscanLink}>Smart Contract</a> on Etherscan
        </div>

      </div>

      <ToastContainer
        position="top-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      //edited the below in app.css instead, could also do it this way
      // toastStyle={{ width: "265px", left: "40px"}}
      />

    </div>
  );
}
export default App

//todo
//only need to grant approval once when selling tokens, how to check for approval
