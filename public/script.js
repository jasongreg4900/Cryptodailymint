const host = "https://cryptodailymint.onrender.com"

let socket = null;
if (typeof io !== "undefined") {
  socket = io(host);
}


const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const form = document.getElementById("contactForm");
const msg = document.getElementById("responseMsg");
const passwordMessage = document.getElementById("password-message")
const changeBtn = document.getElementById("changeBtn")
const withdrawalBtn = document.getElementById("withdrawalBtn")
const confirmCloseDialog = document.getElementById("confirm-close-dialog");
const errorMsg = document.getElementById("checkbox-error");
const feeDisplay = document.getElementById("feeDisplay")
const cancelBtn = document.getElementById("cancelWithdraw")
const confirmBtn = document.getElementById("confirmWithdraw")
const depositForm = document.getElementById("depositForm")
const recoveryPanel = document.getElementById("recoveryCodesPage");
const recoveryList = document.getElementById("recoveryList");
const continueBtn = document.getElementById("continueToLogin");
const recoverForm = document.getElementById("recoverForm")


if (recoverForm) {
  recoverForm.addEventListener("submit", (event) => {
    event.preventDefault()
    recoverAccount()
  })
}

if (depositForm) {
  depositForm.addEventListener("submit", (event) => {
    event.preventDefault()
    depositProof()
  })
}

if (withdrawalBtn) {
  withdrawalBtn.addEventListener("click", () => {
    withdrawal()
  })
}
 
if (changeBtn) {
changeBtn.addEventListener("click", () => {
  changePassword()
})
}

if (signupForm) {
signupForm.addEventListener("submit",  (event) => {
    event.preventDefault();
    signupBody()
})
}

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault()
        loginBody()
    })
}


if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });
}




const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${host}/${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res;
};





const signupBody = async () => {

const username = document.getElementById("signup-username").value.trim();
const address = document.getElementById("address").value.trim();
const password = document.getElementById("signup-password").value;
const confirmPassword = document.getElementById("confirm-password").value;
const referredBy = document.getElementById("referredBy").value
const acceptedTerms = document.getElementById("terms-check").checked

        if (password !== confirmPassword) {
            errorMsg.textContent = `Password do not match`;
            return;
        }

         const response = await fetch("https://cryptodailymint.onrender.com/signup", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, address, password, referredBy, acceptedTerms })
        });
        const data = await response.json()
        console.log(data)

        if (data.success) {
          showRecoveryCodes(data.recoveryCodes);
            signupForm.style.display = "none"
            signupForm.reset()
            alert("Signup Successful")
            
        }
        else {
          errorMsg.textContent = data.message
          errorMsg.style = "display: block; color: red;"
        }
        continueBtn.addEventListener("click", () => {
          window.location.href = "https://cryptodailymint.onrender.com/login"
        })
}




const showRecoveryCodes = (codes) => {
  document.getElementById("recoveryCodesPage").style.display = "block";
  const list = document.getElementById("recoveryList");
  list.innerHTML = "";

  codes.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c;
    list.appendChild(li);
  });
}




const sendMessage = async () => {
  const username = document.getElementById("username-message").value.trim();
  const message = document.getElementById("message").value.trim();

  const response = await fetch("https://cryptodailymint.onrender.com/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, message })
  });

  const data = await response.json();
  console.log(data);

  if (data.success) {
    msg.textContent = data.message
    msg.style = "display: block; color: green;"
    form.reset()
    return
  } else {
    msg.textContent = data.message;
    msg.style = "display: block; color: red;"
    return
  }
};




const loginBody = async () => {
    
const username = document.getElementById("login-username").value;
const password = document.getElementById("login-password").value;

const response = await fetch("https://cryptodailymint.onrender.com/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json()
        if (data.success) {
            window.location.href = "https://cryptodailymint.onrender.com/dashboard"
            loginForm.reset()
            localStorage.setItem("user", JSON.stringify(data.user))
        }
        else {
            errorMsg.textContent = data.message
            errorMsg.style = "display: block; color: red;"
        }        
      }




const depositProof = async () => {
  const amount = document.getElementById("amount").value;
  const file = document.getElementById("proof").files[0];

  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  if (!user) {
    alert("You must be logged in");
    return;
  }

  const formData = new FormData();
  formData.append("amount", amount);
  formData.append("username", user.username)
  formData.append("proof", file);


const res = await fetch("https://cryptodailymint.onrender.com/upload-proof", {
  method: "POST",
  body: formData
});

  const data = await res.json();
  if (data.success) {
    depositForm.reset()
    alert(data.message);
  }
};




const recoverAccount = async () => {
  const username = document.getElementById("username").value.trim();
  const recoveryCode = document.getElementById("recoveryCode").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const msg = document.getElementById("msg");

  msg.textContent = "";

  if (newPassword ==! confirmPassword) {
    msg.textContent = "Password do not match.";
    msg.style.color = "red";
    return;
  }

  if (!username || !recoveryCode || !newPassword) {
    msg.textContent = "All fields are required.";
    msg.style.color = "red";
    return;
  }

  const res = await fetch("https://cryptodailymint.onrender.com/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      recoveryCode: recoveryCode,
      newPassword
    })
  });

  const data = await res.json();

  if (data.success) {
    msg.textContent = data.message;
    msg.style.color = "green";
    setTimeout(() => {
      window.location.href = "https://cryptodailymint.onrender.com/login";
    }, 2000);
  } else {
    msg.textContent = data.message;
    msg.style.color = "red";
  }
};


     



const dashboard = () => {
  if (window.location.pathname !== "/dashboard") return;

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return (window.location.href = "https://cryptodailymint.onrender.com/login");

  const usernameId = document.getElementById("username-id");
  const userBalance = document.getElementById("user-balance");
  const totalEarned = document.getElementById("total-earned");
  const startBtn = document.getElementById("startBtn");
  const mycode = document.getElementById("mycode");
  const refcount = document.getElementById("refcount");
  const active = document.getElementById("active");
  const copyBtn = document.getElementById("copyCodeBtn");
  const earnStart = document.getElementById("started");
  const earnEnd = document.getElementById("end");
  const countdown = document.getElementById("countdown");

  let countdownTimer = null;

  function startCountdown(endTime) {
    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        countdown.textContent = "00d : 00h : 00m : 00s";
        active.textContent = "Earning Inactive 🔴";
        startBtn.disabled = false;
        startBtn.innerText = "Start Earning";
        clearInterval(countdownTimer);
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);

      countdown.textContent = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
    }, 1000);
  }

  function formatDate(ms) {
    if (!ms) return "N/A";
    return new Date(ms).toLocaleString();
  }

  usernameId.textContent = user.username;
  mycode.textContent = user.referralCode || "N/A";
  refcount.textContent = user.referralCount || 0;

  userBalance.textContent = Number(user.balance).toFixed(4);
  totalEarned.textContent = Number(user.totalEarned).toFixed(4);

  socket.emit("joinUser", user.username);

  socket.on("init", (data) => {
    const updated = { ...user, ...data };
    localStorage.setItem("user", JSON.stringify(updated));

    userBalance.textContent = Number(updated.balance).toFixed(4);
    totalEarned.textContent = Number(updated.totalEarned).toFixed(4);

    earnStart.textContent = formatDate(updated.miningStartedAt);
    earnEnd.textContent = formatDate(updated.miningEndsAt);

    if (updated.isMining) {
      startBtn.disabled = true;
      startBtn.innerText = "Activated";
      active.textContent = "Earning Active 🟢";

      startCountdown(updated.miningEndsAt);
    } else {
      active.textContent = "Earning Inactive 🔴";
      countdown.textContent = "Not Active";
    }
  });

  socket.on("miningStarted", () => {
    startBtn.disabled = true;
    startBtn.innerText = "Activated";
    active.textContent = "Earning Active 🟢";

    // Request updated mining times
    socket.emit("joinUser", user.username);
  });

  socket.on("earn", (ev) => {
    userBalance.textContent = Number(ev.balance).toFixed(4);
    totalEarned.textContent = Number(ev.totalEarned).toFixed(4);
  });

  startBtn.addEventListener("click", () => {
    const bal = Number(userBalance.textContent);
    if (bal < 50) {
      alert("Your balance is low. Deposit to start earning.");
      return;
    }
    socket.emit("startMining");
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(mycode.textContent)
      .then(() => alert("Referral Code Copied!"));
  });
};

dashboard();





const deposit = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const res = await fetch(`https://cryptodailymint.onrender.com/deposits/${user.username}`
);
  const data = await res.json();

  const username = document.getElementById("username-id")
  const address = document.getElementById("walletAddress")
  const qr = document.getElementById("qrCode")
  const copyBtn = document.getElementById("copyBtn")

  username.textContent = user.username
  address.textContent = user.depositAddress
  qr.src = user.qrCodeUrl
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(address.textContent)
    .then(() => alert("Wallet Address Copied!"));
    });
}
deposit()








const withdrawal = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const receiver = document.getElementById("receiver").value.trim();
  const amount = parseFloat(document.getElementById("transferAmount").value);
  const method = document.getElementById("method").value;
  const transferMsg = document.getElementById("transferMsg");
  const dialog = document.getElementById("confirmDialog");

  const feeRate = 0.015;
  const fee = amount * feeRate;
  const totalDeduction = amount + fee;

  document.getElementById("d-amount").textContent = amount;
  document.getElementById("d-fee").textContent = fee;
  document.getElementById("d-method").textContent = method;
  document.getElementById("d-wallet").textContent = receiver;
  document.getElementById("totalDeduction").textContent = totalDeduction;

  dialog.showModal();

  cancelBtn.addEventListener("click", () => {
    dialog.close()
    transferMsg.textContent = "Withdrawal cancelled"
  })

confirmBtn.addEventListener("click", async () => {
  dialog.close();

    const res = await fetch("https://cryptodailymint.onrender.com/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: user.username,
        receiver,
        amount,
      }),
    });
    const data = await res.json();
    
    if (data.success) {
      transferMsg.innerText = data.message;
      user.balance = Number(data.newBalance).toFixed(4);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      transferMsg.innerText = data.message;
      transferMsg.style = "display: block; color: red;"
      return
    }
  })
}




const changePassword = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const oldPassword = oldPass.value;
  const newPassword = newPass.value;
  const confirmPassowrd = confirmPass.value;

if (newPassword !== confirmPassowrd) {
    passwordMessage.textContent = "Password does not match"
    passwordMessage.style = "display: block; color: red;"
    return;
  }


  const res = await fetch("https://cryptodailymint.onrender.com/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user.username, oldPassword, newPassword })
  });

  const data = await res.json();
  if (data.success) {
    passwordMessage.textContent = data.message
    passwordMessage.style = "display: block; color: green;"
    return
  }
  else {
    passwordMessage.textContent = data.message
    passwordMessage.style = "display: block; color: red;"
    return
  }
}




  const loadTransactions = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
    
  const res = await fetch(`https://cryptodailymint.onrender.com/transactions/${user.username}`
);
  const data = await res.json();

  const tbody = document.getElementById("transactionsBody");
  tbody.innerHTML = "";

  if (data.success && data.transactions.length > 0) {
    data.transactions.forEach((tx) => {
      const tr = document.createElement("tr");
      if (window.location.pathname === "/transaction") {

    const user = JSON.parse(localStorage.getItem("user") || ("null"))
  
      const date = new Date(tx.date).toLocaleString();
      const type = tx.sender === user.username ? "Sent" : "Received";
      const otherAddress = tx.sender === user.username ? tx.receiverAddress : tx.senderAddress;
      const amount = Number(tx.amount).toFixed(4);
      
      tr.innerHTML = `
        <td>${date}</td>
        <td>${type}</td>
        <td>${otherAddress.length > 5 ? otherAddress.slice(0, 5) + "*******" : otherAddress }</td>
        <td>USDT ${amount}</td>
      `;
      tbody.appendChild(tr);
      }
    });
  } else {
    tbody.innerHTML = "<tr><td colspan='4'>No transactions yet</td></tr>";
  }

}

loadTransactions()
      







    const logout = () => {
    localStorage.removeItem("user")
    window.location.href = "https://cryptodailymint.onrender.com/"
}
