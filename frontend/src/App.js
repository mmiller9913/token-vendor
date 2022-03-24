import React, { useEffect, useState } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { networks } from './utils/networks';
import vendorContractABI from './utils/Vendor.json';
import tokenContractABI from './utils/Token.json';
import { ethers } from "ethers";

//constants
const vendorContractAddress = '0x494239215f12c29F420dC3FbD02E5A8E6feDA432';
const tokenContractAddress = '0xb5Bc7dF5832057b51985029D7940Ef7A3c3da653';
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

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have Metamask installed!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);
        setNetwork(networks[chainId]);
        //get account 
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
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractAbi, signer);
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);

        //get amount of tokens owned by the user
        const amountOfTokensUserOwnsInWei = await tokenContract.balanceOf(currentAccount);
        let amountOfTokenUserOwns = ethers.utils.formatEther(amountOfTokensUserOwnsInWei);
        console.log(`You currently own ${amountOfTokenUserOwns} FROG`);
        if (amountOfTokenUserOwns === '0.0') {
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
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4' }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    }
  }

  const buyToken = async () => {
    setIsBuyingOrSellingToken(true);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);

        //purchase token
        const tokenTxn = await vendorContract.buyTokens({ value: ethers.utils.parseEther('0.0001') });
        console.log("Buying token...Here's the transaction hash:", tokenTxn.hash);
        await tokenTxn.wait();
        console.log("Mined transaction:", tokenTxn.hash);

        //update variables
        fetchTokenInfo();

        setIsBuyingOrSellingToken(false);

      }
    } catch (error) {
      console.log(error);
      setIsBuyingOrSellingToken(false);
    }
  }

  const sellToken = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const vendorContract = new ethers.Contract(vendorContractAddress, vendorContractAbi, signer);
        const tokenContract = new ethers.Contract(tokenContractAddress, tokenContractAbi, signer);

        //amount to sell
        const amountToSell = 100000000000000;
        //need to grant approval before selling token
        const approvalTxn = await tokenContract.approve(vendorContractAddress, amountToSell);
        console.log("Granting approval for selling token...Here's the transaction hash:", approvalTxn.hash);
        await approvalTxn.wait();
        console.log("Mined transaction:", approvalTxn.hash);

        //sell token
        const saleTxn = await vendorContract.sellTokens(amountToSell);
        console.log("Selling tokens...Here's the transaction hash:", saleTxn.hash);
        await saleTxn.wait();
        console.log("Mined transaction:", saleTxn.hash);

        //update variables
        fetchTokenInfo();
      }
    } catch (error) {
      console.log(error);
    }
  }

  //RENDER METHODS
  const renderConnectWalletButtonOrRinkebyWarning = () => {
    if (!currentAccount) {
      return (
        <button onClick={connectWallet}>
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
        <div className='buy-and-sell-button-container'>
          <button onClick={buyToken}>Buy 🐸</button>
          <button onClick={sellToken}>Sell 🐸</button>
        </div>
      )
    }
  }

  const renderTokenAmounts = () => {
    if (currentAccount && network === 'Rinkeby') {
      return (
        <div className='token-amounts'>
          {<h1>You currently own {tokenAmountOwnedByUser} FROG</h1>}
          {<h1>There are {tokensAvailableForPurchase} FROG available to purchase</h1>}
          {<h1>1 FROG costs <span className='eth-symbol'>Ξ</span>{tokenCostInEth}</h1>}
        </div>
      )
    }
  }

  const renderPopUp = () => {
    if(isBuyingOrSellingToken) {
      return (
        <Popup trigger={<button> Trigger</button>} position="right center">
          <div>Popup content here !!</div>
        </Popup>
      )
    }
  }

  // USE EFFECTS
  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTokenInfo();
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

          {renderPopUp()}

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
      />

    </div>
  );
}
export default App

//after deploying new contract 
//transfer funds to vendor contract in remix
//add abi and address in remix

//todo
//only need to grant approval once when selling tokens, how to check for approval

//final to do
//verify contract, either with hardhat or rinkeby 