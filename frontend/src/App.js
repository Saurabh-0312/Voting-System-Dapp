import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAbi, contractAddress } from "./Constant/constant";
import Login from "./Components/Login";
import Finished from "./Components/Finished";
import Connected from "./Components/Connected";
import "./App.css";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [RemainingTime, setRemainingTime] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [number, setNumber] = useState("");
  const [CanVote, setCanVote] = useState(true);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    getCandidates();
    getRemainingTime();
    getCurrentStatus();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [account]); // Only re-run effect when 'account' changes

  useEffect(() => {
    if (isConnected) {
      getCandidates(); // Fetch updated candidates whenever the account changes or after voting
    }
  }, [isConnected, candidates]); // Re-fetch candidates when `candidates` array changes
  

  async function connectToMetamask() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        setSigner(signer);

        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);

        console.log("Metamask Connected : " + address);
        canVote();
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("Metamask is not detected in the browser");
    }
  }

  async function vote() {
    try {
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const tx = await contractInstance.vote(number);
      await tx.wait();
      getCandidates();
      canVote();
    } catch (err) {
      console.error("Error voting:", err);
    }
  }

  async function canVote() {
    try {
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const voteStatus = await contractInstance.voters(await signer.getAddress());
      setCanVote(voteStatus);
    } catch (err) {
      console.error("Error checking voting status:", err);
    }
  }

  async function getCandidates() {
    try {
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const candidatesList = await contractInstance.getAllVotesOfCandiates();

      const formattedCandidates = candidatesList.map((candidate, index) => ({
        index: index,
        name: candidate.name,
        voteCount: candidate.voteCount.toNumber(),
      }));

      setCandidates(formattedCandidates);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    }
  }

  async function getCurrentStatus() {
    try {
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const status = await contractInstance.getVotingStatus();
      setVotingStatus(status);
    } catch (err) {
      console.error("Error fetching voting status:", err);
    }
  }

  async function getRemainingTime() {
    try {
      const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
      const time = await contractInstance.getRemainingTime();

      // Assuming `time` is a hexadecimal string
      setRemainingTime(parseInt(time, 10)); // Adjust if time is in decimal
    } catch (err) {
      console.error("Error fetching remaining time:", err);
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0 && account !== accounts[0]) {
      setAccount(accounts[0]);
      canVote();
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }

  function handleNumberChange(e) {
    setNumber(e.target.value);
  }

  return (
    <div className="App">
      {votingStatus ? (
        isConnected ? (
          <Connected
            account={account}
            candidates={candidates}
            RemainingTime={RemainingTime}
            number={number}
            handleNumberChange={handleNumberChange}
            voteFunction={vote}
            showButton={CanVote}
          />
        ) : (
          <Login connectWallet={connectToMetamask} />
        )
      ) : (
        <Finished />
      )}
    </div>
  );
}

export default App;
